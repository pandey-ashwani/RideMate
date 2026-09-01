import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '../utils/api';
import { VehicleCard } from '../components/Vehicles/VehicleCard';
import { Info } from 'lucide-react';

export const PopularVehicles = ({ onBookQuickly }) => {
  const [activeTab, setActiveTab] = useState('all');
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchVehicles = async () => {
      setLoading(true);
      setError(null);
      try {
        const typeQuery = activeTab !== 'all' ? `&type=${activeTab}` : '';
        const data = await apiRequest(`/vehicles?pageSize=6${typeQuery}`);
        setVehicles(data.vehicles || []);
      } catch (err) {
        console.error('Error fetching featured vehicles:', err);
        setError(err.message || 'Could not load vehicle listings.');
      } finally {
        setLoading(false);
      }
    };

    fetchVehicles();
  }, [activeTab]);

  const tabs = [
    { id: 'all', label: 'All Vehicles' },
    { id: 'car', label: '🚗 Cars' },
    { id: 'bike', label: '🚲 Bicycles' },
    { id: 'scooter', label: '🛵 Scooters' }
  ];

  return (
    <section id="popular-vehicles" className="py-16 md:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Title */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="text-left flex flex-col gap-3">
            <span className="text-sm font-extrabold text-amber-600 uppercase tracking-widest">Our Fleet</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-800 tracking-tight leading-tight">
              Featured rides near you.
            </h2>
            <div className="w-16 h-1 bg-[#FFD600] rounded-full mt-1"></div>
          </div>
          
          {/* Tabs */}
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  px-4 py-2 rounded-lg text-sm font-bold border transition-all duration-200 cursor-pointer
                  ${activeTab === tab.id
                    ? 'bg-[#FFD600] text-slate-950 border-[#FFD600] shadow-xs'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }
                `}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Loading and Error States */}
        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-3"></div>
            <p className="text-xs font-semibold text-slate-400">Loading featured fleet...</p>
          </div>
        ) : error ? (
          <div className="bg-amber-50 border border-amber-200/50 p-6 rounded-2xl max-w-md mx-auto text-center text-amber-800 text-xs font-semibold">
            <Info className="w-6 h-6 mx-auto mb-2 text-amber-500" />
            <p>{error}</p>
          </div>
        ) : vehicles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {vehicles.map((vehicle) => (
              <VehicleCard
                key={vehicle._id}
                vehicle={vehicle}
                onSelect={() => navigate(`/vehicles?id=${vehicle._id}`)}
                onRentNow={() => onBookQuickly ? onBookQuickly(vehicle) : navigate(`/vehicles?id=${vehicle._id}`)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-10 bg-slate-50 border border-slate-100 rounded-2xl max-w-sm mx-auto flex flex-col gap-2">
            <span className="text-3xl">🚗</span>
            <p className="text-xs font-bold text-slate-400">No vehicles available on the database yet.</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default PopularVehicles;
