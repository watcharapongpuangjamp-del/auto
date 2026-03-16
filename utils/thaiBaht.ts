
export function thaiBahtText(num: number): string {
  if (num === 0) return "ศูนย์บาทถ้วน";
  
  const text = num.toFixed(2).split(".");
  const integerPart = text[0];
  const decimalPart = text[1];
  
  let result = "";
  
  if (integerPart !== "0") {
    result += convert(integerPart) + "บาท";
  }
  
  if (decimalPart === "00") {
    result += "ถ้วน";
  } else {
    result += convert(decimalPart) + "สตางค์";
  }
  
  return result;
}

function convert(numStr: string): string {
  const digits = ["", "หนึ่ง", "สอง", "สาม", "สี่", "ห้า", "หก", "เจ็ด", "แปด", "เก้า"];
  const units = ["", "สิบ", "ร้อย", "พัน", "หมื่น", "แสน", "ล้าน"];
  let result = "";
  const length = numStr.length;

  for (let i = 0; i < length; i++) {
    const digit = parseInt(numStr.charAt(i));
    const unitPos = length - i - 1;

    if (digit !== 0) {
      if (unitPos % 6 === 1 && digit === 1) {
        result += "";
      } else if (unitPos % 6 === 1 && digit === 2) {
        result += "ยี่";
      } else if (unitPos % 6 === 0 && digit === 1 && i > 0) {
        result += "เอ็ด";
      } else {
        result += digits[digit];
      }
      
      result += units[unitPos % 6];
    }
    
    if (unitPos !== 0 && unitPos % 6 === 0) {
      result += "ล้าน";
    }
  }
  
  // Fix for "สิบ" vs "หนึ่งสิบ"
  result = result.replace("หนึ่งสิบ", "สิบ");
  
  return result;
}
