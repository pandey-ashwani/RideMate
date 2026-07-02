import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Calendar, Compass } from 'lucide-react';
import { Button } from '../components/Common/Button';

export const SearchBar = ({ initialType = 'all', initialLocation = '' }) => {
  const navigate = useNavigate();
  const [location, setLocation] = useState(initialLocation);
  const [vehicleType, setVehicleType] = useState(initialType);
  const [pickupDate, setPickupDate] = useState('');
  const [dropoffDate, setDropoffDate] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (location) params.append('location', location);
    if (vehicleType !== 'all') params.append('type', vehicleType);
    if (pickupDate) params.append('pickup', pickupDate);
    if (dropoffDate) params.append('dropoff', dropoffDate);
    
    navigate(`/vehicles?${params.toString()}`);
  };

  return (
    <form
      onSubmit={handleSearch}
      className="bg-white rounded-2xl shadow-xl border border-slate-100 p-5 md:p-6 max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-4 items-end animate-fade-in-up text-slate-800"
    >
      {/* Location */}
      <div className="flex flex-col gap-1.5 md:col-span-4 text-left">
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 select-none">
          <MapPin className="w-3.5 h-3.5 text-primary-light" />
          Where to rent?
        </label>
        <div className="relative">
          <input
            type="text"
            placeholder="e.g. Srinagar Garhwal, Uttarakhand"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full text-sm font-semibold rounded-lg bg-slate-50 hover:bg-slate-100/75 border border-slate-200 focus:bg-white focus:border-primary focus:outline-none py-3 px-4 transition-colors"
          />
        </div>
      </div>

      {/* Vehicle Type */}
      <div className="flex flex-col gap-1.5 md:col-span-3 text-left">
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 select-none">
          <Compass className="w-3.5 h-3.5 text-primary-light" />
          Vehicle Type
        </label>
        <select
          value={vehicleType}
          onChange={(e) => setVehicleType(e.target.value)}
          className="w-full text-sm font-semibold rounded-lg bg-slate-50 hover:bg-slate-100/75 border border-slate-200 focus:bg-white focus:border-primary focus:outline-none py-3 px-4 transition-colors cursor-pointer appearance-none"
        >
          <option value="all">All Vehicles</option>
          <option value="car">Cars</option>
          <option value="bike">Bicycles</option>
          <option value="scooter">Electric Scooters</option>
        </select>
      </div>

      {/* Pickup Date */}
      <div className="flex flex-col gap-1.5 md:col-span-2 text-left">
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 select-none">
          <Calendar className="w-3.5 h-3.5 text-primary-light" />
          From
        </label>
        <input
          type="date"
          value={pickupDate}
          min={new Date().toISOString().split('T')[0]}
          onChange={(e) => setPickupDate(e.target.value)}
          className="w-full text-sm font-semibold rounded-lg bg-slate-50 hover:bg-slate-100/75 border border-slate-200 focus:bg-white focus:border-primary focus:outline-none py-3 px-4 transition-colors cursor-pointer"
        />
      </div>

      {/* Dropoff Date */}
      <div className="flex flex-col gap-1.5 md:col-span-2 text-left">
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 select-none">
          <Calendar className="w-3.5 h-3.5 text-primary-light" />
          Until
        </label>
        <input
          type="date"
          value={dropoffDate}
          min={pickupDate || new Date().toISOString().split('T')[0]}
          onChange={(e) => setDropoffDate(e.target.value)}
          className="w-full text-sm font-semibold rounded-lg bg-slate-50 hover:bg-slate-100/75 border border-slate-200 focus:bg-white focus:border-primary focus:outline-none py-3 px-4 transition-colors cursor-pointer"
        />
      </div>

      {/* Search Button */}
      <div className="md:col-span-1 flex items-stretch">
        <Button
          type="submit"
          variant="primary"
          className="w-full py-3 h-[46px] shadow-md bg-primary hover:bg-primary-light text-white font-bold"
        >
          <Search className="w-5 h-5 shrink-0" />
          <span className="md:hidden ml-1">Search</span>
        </Button>
      </div>
    </form>
  );
};

export default SearchBar;
