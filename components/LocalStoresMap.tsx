import React, { useState } from 'react';
import { MapPin, Search, Loader2, Navigation, Star } from 'lucide-react';
import { findNearbyPlaces } from '../services/geminiService';
import { MapPlace } from '../types';

const LocalStoresMap: React.FC = () => {
  const [location, setLocation] = useState('กรุงเทพมหานคร');
  const [query, setQuery] = useState('ร้านอะไหล่รถยนต์');
  const [places, setPlaces] = useState<MapPlace[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setPlaces([]);
    
    // Construct a natural language query for the AI
    const prompt = `${query} ในพื้นที่ ${location}`;
    try {
      const results = await findNearbyPlaces(prompt);
      setPlaces(results);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden h-full flex flex-col">
      <div className="p-6 border-b border-slate-100">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <MapPin className="text-red-500" />
          ร้านอะไหล่และศูนย์บริการ (Local Map)
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          ค้นหาร้านอะไหล่และอู่ใกล้เคียงด้วย Google Maps AI
        </p>
      </div>

      <div className="p-6 flex-1 overflow-auto">
        <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
           <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500">สิ่งที่ต้องการค้นหา (Query)</label>
            <input 
              type="text"
              className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ex: ร้านอะไหล่ Toyota"
            />
           </div>
           <div className="space-y-1">
             <label className="text-xs font-semibold text-slate-500">พื้นที่ (Location)</label>
             <input 
              type="text"
              className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Ex: บางนา, เชียงใหม่"
            />
           </div>
           <div className="flex items-end">
             <button 
              type="submit"
              disabled={loading}
              className="w-full py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 flex items-center justify-center gap-2"
             >
               {loading ? <Loader2 className="animate-spin" /> : <Search size={18} />}
               ค้นหา (Find)
             </button>
           </div>
        </form>

        <div className="space-y-4">
          <h3 className="font-semibold text-slate-700 border-b border-slate-100 pb-2">ผลการค้นหา {places.length > 0 && `(${places.length})`}</h3>
          
          {loading ? (
             <div className="py-12 text-center text-slate-400">
               <Loader2 size={40} className="animate-spin mx-auto mb-4 text-brand-400" />
               <p>AI กำลังค้นหาข้อมูลจาก Google Maps...</p>
             </div>
          ) : places.length === 0 ? (
             <div className="py-12 text-center text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-200">
               <MapPin size={40} className="mx-auto mb-4 opacity-20" />
               <p>ไม่พบข้อมูล หรือยังไม่ได้ทำการค้นหา</p>
             </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {places.map((place, idx) => (
                <div key={idx} className="p-4 rounded-xl border border-slate-200 hover:border-brand-300 hover:shadow-md transition-all bg-white group">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-slate-800 text-lg group-hover:text-brand-600 transition-colors">{place.title}</h4>
                      {place.rating && (
                         <div className="flex items-center gap-1 text-orange-400 text-sm mt-1">
                           <Star size={14} fill="currentColor" />
                           <span className="font-medium">{place.rating}</span>
                           <span className="text-slate-400">({place.userRatingCount || 0})</span>
                         </div>
                      )}
                      <p className="text-sm text-slate-500 mt-2">{place.address}</p>
                    </div>
                    {place.uri && (
                       <a 
                        href={place.uri} 
                        target="_blank" 
                        rel="noreferrer"
                        className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                        title="Open in Google Maps"
                       >
                         <Navigation size={20} />
                       </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LocalStoresMap;