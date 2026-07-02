import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '../utils/api';
import { Card } from '../components/Common/Card';
import { Badge } from '../components/Common/Badge';
import { StarRating } from '../components/Common/StarRating';
import { Button } from '../components/Common/Button';
import { Calendar, User, Gauge, Info } from 'lucide-react';

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
            <span className="text-sm font-extrabold text-primary uppercase tracking-widest">Our Fleet</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-800 tracking-tight leading-tight">
              Featured rides near you.
            </h2>
            <div className="w-16 h-1 bg-accent rounded-full mt-1"></div>
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
                    ? 'bg-primary text-white border-primary shadow-xs'
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
              <Card 
                key={vehicle._id} 
                className="flex flex-col h-full overflow-hidden p-0 border border-slate-100 hover:shadow-lg transition-shadow duration-300"
                hoverable={true}
              >
                {/* Header Image */}
                <div className="relative h-52 overflow-hidden bg-slate-100 shrink-0">
                  <img
                    src={vehicle.image.startsWith('http') ? vehicle.image : `http://localhost:5000${vehicle.image}`}
                    alt={vehicle.name}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                  />
                  
                  {/* Float badges */}
                  <div className="absolute top-4 left-4 flex gap-1.5 flex-col">
                    <Badge variant="primary" className="shadow-sm uppercase">
                      {vehicle.type}
                    </Badge>
                    {!vehicle.availability && (
                      <Badge variant="warning" className="shadow-sm">
                        Booked Out
                      </Badge>
                    )}
                  </div>

                  <div className="absolute bottom-4 right-4 bg-slate-900/80 backdrop-blur-xs px-3 py-1.5 rounded-lg text-white font-black text-sm shadow-md">
                    ₹{vehicle.pricePerDay}<span className="text-[10px] text-slate-300 font-normal"> / day</span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-6 flex flex-col justify-between flex-grow text-left">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                        {vehicle.brand}
                      </span>
                      
                      {/* Rating */}
                      {vehicle.rating > 0 && (
                        <div className="flex items-center gap-1.5">
                          <StarRating rating={Math.floor(vehicle.rating)} size="sm" />
                          <span className="text-xs font-bold text-slate-700">{vehicle.rating}</span>
                        </div>
                      )}
                    </div>

                    <h3 className="text-lg font-black text-slate-800 tracking-tight leading-none mb-4 truncate">
                      {vehicle.name}
                    </h3>

                    {/* Specs list */}
                    <div className="grid grid-cols-2 gap-3 py-3 border-y border-slate-100/80 text-xs font-medium text-slate-500 mb-6">
                      <div className="flex items-center gap-1.5">
                        <Gauge className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="truncate">{vehicle.specs.fuel}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <User className="w-4 h-4 text-slate-400 shrink-0" />
                        <span>{vehicle.specs.seats} {vehicle.specs.seats > 1 ? 'seats' : 'seat'}</span>
                      </div>
                      <div className="col-span-2 flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="truncate">Range: {vehicle.specs.range}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3 mt-auto w-full pt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-1/2 font-semibold"
                      onClick={() => navigate(`/vehicles?id=${vehicle._id}`)}
                    >
                      Details
                    </Button>
                    
                    <Button
                      variant={vehicle.availability ? 'secondary' : 'outline'}
                      size="sm"
                      disabled={!vehicle.availability}
                      className="w-1/2 shadow-xs font-bold"
                      onClick={() => onBookQuickly && onBookQuickly(vehicle)}
                    >
                      {vehicle.availability ? 'Rent Now' : 'Unavailable'}
                    </Button>
                  </div>
                </div>
              </Card>
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
