
import { ObdScanResult, HealthCheckResult, DiagnosticIssue } from "../types";

// Type definition for Web Serial API
interface SerialPort {
  open(options: { baudRate: number }): Promise<void>;
  close(): Promise<void>;
  readable: ReadableStream | null;
  writable: WritableStream | null;
  getInfo(): { usbVendorId?: number, usbProductId?: number };
}

interface NavigatorSerial {
  serial: {
    requestPort(options?: { filters: any[] }): Promise<SerialPort>;
    getPorts(): Promise<SerialPort[]>;
  };
}

const MAX_RETRIES = 2;
const INIT_TIMEOUT = 2000;

export class ObdService {
  private port: SerialPort | null = null;
  private reader: ReadableStreamDefaultReader | null = null;
  private writer: WritableStreamDefaultWriter | null = null;
  private encoder = new TextEncoder();
  private decoder = new TextDecoder();
  private isBusy = false;

  private parseDtc(hexData: string): string[] {
    const cleanHex = hexData.replace(/\s+/g, '').replace(/^43/, '');
    const codes: string[] = [];
    for (let i = 0; i < cleanHex.length; i += 4) {
      const pair = cleanHex.substring(i, i + 4);
      if (pair.length < 4 || pair === '0000') continue;
      const firstByte = parseInt(pair.substring(0, 2), 16);
      const secondByte = pair.substring(2, 4);
      const A = firstByte;
      const type = (A & 0xC0) >> 6;
      const digit1 = (A & 0x30) >> 4;
      let prefix = '';
      switch (type) {
        case 0: prefix = 'P'; break;
        case 1: prefix = 'C'; break;
        case 2: prefix = 'B'; break;
        case 3: prefix = 'U'; break;
      }
      const digit2 = (A & 0x0F).toString(16).toUpperCase();
      codes.push(`${prefix}${digit1}${digit2}${secondByte}`);
    }
    return codes;
  }

  private parsePidValue(pid: string, hexResponse: string): number | null {
    let clean = hexResponse.replace(/>/g, '').replace(/\s+/g, '').trim();
    if (!clean || clean.includes("NODATA") || clean.includes("ERROR") || clean.includes("STOPPED")) {
        return null;
    }
    const searchStr = "41" + pid; 
    const index = clean.indexOf(searchStr);
    if (index === -1) return null;
    const dataHex = clean.substring(index + 4);
    
    try {
        const A = parseInt(dataHex.substring(0, 2), 16) || 0;
        const B = parseInt(dataHex.substring(2, 4), 16) || 0;
        switch (pid) {
            case '0C': return ((A * 256) + B) / 4;
            case '05': return A - 40;
            case '06': return ((A - 128) * 100) / 128;
            case '07': return ((A - 128) * 100) / 128;
            case '10': return ((A * 256) + B) / 100;
            default: return A;
        }
    } catch (e) {
        console.error(`Error parsing PID ${pid}:`, e);
        return null;
    }
  }

  private async writeCommand(cmd: string) {
    if (!this.writer) throw new Error("Writer not initialized");
    await this.writer.write(this.encoder.encode(cmd + '\r'));
  }

  private async readResponse(timeoutMs: number = 1000): Promise<string> {
    if (!this.reader) throw new Error("Reader not initialized");
    let response = '';
    const startTime = Date.now();
    try {
      while (true) {
        if (Date.now() - startTime > timeoutMs) break;
        const { value, done } = await this.reader.read();
        if (done) break;
        if (value) {
          const chunk = this.decoder.decode(value);
          response += chunk;
          if (response.includes('>')) break;
        }
      }
    } catch (error) {
      console.warn("Read stream interrupted:", error);
    }
    return response.replace('>', '').trim();
  }

  private async cleanup() {
    try {
      if (this.reader) {
        await this.reader.cancel().catch(() => {});
        try { this.reader.releaseLock(); } catch(e) {}
        this.reader = null;
      }
      if (this.writer) {
        try { this.writer.releaseLock(); } catch(e) {}
        this.writer = null;
      }
      if (this.port) {
        await this.port.close().catch(() => {});
        this.port = null;
      }
    } catch (e) {
      console.warn("Cleanup warning:", e);
    } finally {
      this.isBusy = false;
    }
  }

  private async getActivePort(): Promise<SerialPort> {
    const nav = navigator as unknown as NavigatorSerial;
    const existingPorts = await nav.serial.getPorts();
    if (existingPorts.length > 0) {
      return existingPorts[0];
    }
    return await nav.serial.requestPort();
  }

  private async initializeConnection(retryCount = 0): Promise<boolean> {
    try {
      this.port = await this.getActivePort();
      
      // Attempt to clear previous state
      try { await this.port.close(); } catch(e) {}
      
      await this.port.open({ baudRate: 38400 });
      
      if (!this.port.readable || !this.port.writable) {
        throw new Error("Port streams unavailable");
      }

      this.reader = this.port.readable.getReader();
      this.writer = this.port.writable.getWriter();

      // Basic initialization commands
      await this.writeCommand("AT Z"); 
      const resetResp = await this.readResponse(INIT_TIMEOUT);
      
      if (!resetResp || resetResp.includes("ERROR")) {
        throw new Error("Device failed to respond to reset");
      }

      await this.writeCommand("AT SP 0"); 
      await this.readResponse(500);
      
      return true;
    } catch (error) {
      console.warn(`Connection attempt ${retryCount + 1} failed:`, error);
      await this.cleanup();
      
      if (retryCount < MAX_RETRIES) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        return await this.initializeConnection(retryCount + 1);
      }
      return false;
    }
  }

  public async connectAndScan(): Promise<ObdScanResult> {
    if (this.isBusy) {
      return { success: false, codes: [], error: "System is busy. Please try again in a moment." };
    }

    if (!('serial' in navigator)) {
      return { success: false, codes: [], error: "Web Serial API not supported." };
    }

    this.isBusy = true;
    try {
      const connected = await this.initializeConnection();
      if (!connected) {
        throw new Error("Could not establish a stable connection with OBD2 device.");
      }

      await this.writeCommand("0100"); 
      await this.readResponse(1000);
      
      await this.writeCommand("03");
      const rawData = await this.readResponse(3000);
      
      const codes = rawData.includes("NO DATA") || !rawData ? [] : this.parseDtc(rawData);
      const result = { success: true, codes: Array.from(new Set(codes)), rawResponse: rawData };
      
      await this.cleanup();
      return result;
    } catch (error: any) {
      console.error("OBD Scan Error:", error);
      await this.cleanup();
      return { success: false, codes: [], error: error.message || "Unknown error during scan" };
    }
  }

  /**
   * Performs a minimal OBD connection and reads only DTC codes.
   */
  public async quickScan(): Promise<ObdScanResult> {
    if (this.isBusy) {
      return { success: false, codes: [], error: "System is busy." };
    }

    if (!('serial' in navigator)) {
      return { success: false, codes: [], error: "Web Serial API not supported." };
    }

    this.isBusy = true;
    try {
      const connected = await this.initializeConnection();
      if (!connected) {
        throw new Error("Quick connection failed.");
      }

      // Minimal initialization: go straight to DTC request
      await this.writeCommand("03");
      const rawData = await this.readResponse(2000);
      
      const codes = rawData.includes("NO DATA") || !rawData ? [] : this.parseDtc(rawData);
      const result = { success: true, codes: Array.from(new Set(codes)), rawResponse: rawData };
      
      await this.cleanup();
      return result;
    } catch (error: any) {
      console.error("Quick Scan Error:", error);
      await this.cleanup();
      return { success: false, codes: [], error: error.message || "Unknown error during quick scan" };
    }
  }

  public async performHealthCheck(): Promise<HealthCheckResult> {
    if (this.isBusy) throw new Error("System is busy");
    if (!('serial' in navigator)) throw new Error("Web Serial API not supported");
    
    this.isBusy = true;
    try {
        const connected = await this.initializeConnection();
        if (!connected) {
          throw new Error("Connection failed after multiple attempts.");
        }

        const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
        
        // PIDs to fetch
        const pids = ['0C', '05', '06', '07'];
        const results: Record<string, number | null> = {};

        for (const pid of pids) {
            await this.writeCommand(`01${pid}`);
            const resp = await this.readResponse(1000);
            results[pid] = this.parsePidValue(pid, resp);
            await delay(100);
        }

        await this.writeCommand("AT RV");
        const rawVolt = await this.readResponse(1000);
        const voltage = parseFloat(rawVolt.replace(/[^0-9.]/g, '')) || 0;

        const data = {
            rpm: Math.round(results['0C'] || 0),
            coolantTemp: Math.round(results['05'] || 0),
            voltage: voltage,
            stft: parseFloat((results['06'] || 0).toFixed(1)),
            ltft: parseFloat((results['07'] || 0).toFixed(1)),
            maf: 0
        };

        const issues: DiagnosticIssue[] = [];

        if (data.rpm > 500 && data.voltage < 13.0) {
            issues.push({
                code: 'ELEC-01', system: 'ELECTRICAL',
                title: 'Charging System Weak',
                description: `Alternator output is ${data.voltage}V. Expected > 13.5V for healthy charging.`,
                severity: 'MEDIUM'
            });
        }

        const totalTrim = data.stft + data.ltft;
        if (Math.abs(totalTrim) > 12) {
            issues.push({
                code: 'FUEL-01', system: 'FUEL',
                title: 'Fuel Trim Imbalance',
                description: `Total fuel trim is ${totalTrim.toFixed(1)}%. Possible vacuum leak or fuel injector issue.`,
                severity: 'HIGH'
            });
        }

        if (data.coolantTemp > 105) {
            issues.push({
                code: 'ENG-01', system: 'ENGINE',
                title: 'High Engine Temperature',
                description: `Coolant temp ${data.coolantTemp}°C is high. Check cooling fans and coolant level.`,
                severity: 'CRITICAL'
            });
        }

        let engineScore = 100;
        let fuelScore = 100;
        let electricalScore = 100;

        issues.forEach(issue => {
            const penalty = issue.severity === 'CRITICAL' ? 45 : issue.severity === 'HIGH' ? 25 : 15;
            if (issue.system === 'ENGINE') engineScore -= penalty;
            if (issue.system === 'FUEL') fuelScore -= penalty;
            if (issue.system === 'ELECTRICAL') electricalScore -= penalty;
        });

        const overallScore = Math.max(0, Math.round((Math.max(0, engineScore) * 0.4) + (Math.max(0, fuelScore) * 0.4) + (Math.max(0, electricalScore) * 0.2)));

        const result = {
            overallScore,
            systemScores: { engine: Math.max(0, engineScore), fuel: Math.max(0, fuelScore), electrical: Math.max(0, electricalScore) },
            snapshotData: data,
            issues,
            timestamp: new Date().toISOString()
        };

        await this.cleanup();
        return result;

    } catch (error: any) {
        console.error("Health Check Error:", error);
        await this.cleanup();
        throw new Error(error.message || "Health check interrupted.");
    }
  }
}

export const obdService = new ObdService();
