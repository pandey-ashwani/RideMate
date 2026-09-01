import React from 'react';
import { Card } from '../Common/Card';
import { Button } from '../Common/Button';
import { MapPin } from 'lucide-react';
import { resolveImageUrl } from '../../utils/api';

export const VehicleCard = ({ vehicle, onSelect, onRentNow, showActions = true }) => {
  const imageUrl = resolveImageUrl(vehicle?.image);
  const brandOrCompany = vehicle?.ownerId?.company
    ? `🏢 ${vehicle.ownerId.company}`
    : vehicle?.brand || 'RideMate Fleet';

  const getTypeBadgeClass = (type) => {
    switch (type?.toLowerCase()) {
      case 'car':
        return 'bg-slate-100 text-slate-800 border-slate-200';
      case 'scooter':
        return 'bg-amber-50 text-amber-900 border-amber-200';
      case 'bike':
        return 'bg-purple-50 text-purple-900 border-purple-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <Card
      className="flex flex-col h-full overflow-hidden p-0 rounded-2xl border border-slate-200/80 hover:border-amber-400 hover:shadow-xl transition-all duration-300 bg-white group cursor-pointer"
      hoverable={true}
      onClick={onSelect}
    >
      {/* Header Image with Badges */}
      <div className="relative h-48 sm:h-52 w-full overflow-hidden bg-slate-100 shrink-0">
        <img
          src={imageUrl}
          alt={vehicle?.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=500';
          }}
        />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
          <span className={`text-[10px] font-black tracking-wider uppercase px-2.5 py-1 rounded-md border shadow-xs ${getTypeBadgeClass(vehicle?.type)}`}>
            {vehicle?.type?.toUpperCase() || 'VEHICLE'}
          </span>
          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border shadow-xs ${
            vehicle?.availability
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-rose-50 text-rose-700 border-rose-200'
          }`}>
            {vehicle?.availability ? 'Available' : 'Rented'}
          </span>
        </div>

        {/* Price Tag Overlay */}
        <div className="absolute bottom-3 right-3 bg-slate-950/85 backdrop-blur-xs px-3 py-1.5 rounded-lg text-white shadow-md flex items-baseline gap-1">
          <span className="text-base font-black text-white">₹{vehicle?.pricePerDay}</span>
          <span className="text-[10px] text-slate-300 font-medium">/day</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col justify-between flex-grow text-left">
        <div>
          {/* Brand / Company Row */}
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="text-[11px] font-black text-amber-600 uppercase tracking-wider truncate">
              {brandOrCompany}
            </span>
          </div>

          {/* Vehicle Name */}
          <h3 className="text-lg font-black text-slate-900 tracking-tight leading-snug mb-1.5 truncate group-hover:text-amber-600 transition-colors">
            {vehicle?.name}
          </h3>

          {/* Location */}
          <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5 mb-4">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{vehicle?.location || 'Local Fleet'}</span>
          </p>
        </div>

        {/* Footer Row */}
        <div className="pt-3 border-t border-slate-100 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Daily Rate</span>
              <div className="flex items-baseline gap-0.5">
                <span className="text-xl font-black text-slate-900">₹{vehicle?.pricePerDay}</span>
                <span className="text-xs font-semibold text-slate-500">/day</span>
              </div>
            </div>

            <span className={`text-xs font-black px-3 py-1 rounded-full ${
              vehicle?.availability
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-rose-50 text-rose-700'
            }`}>
              {vehicle?.availability ? 'Available' : 'Rented'}
            </span>
          </div>

          {showActions && (
            <div className="grid grid-cols-2 gap-2 mt-1" onClick={(e) => e.stopPropagation()}>
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs font-bold border-slate-200 hover:bg-slate-50 text-slate-700"
                onClick={onSelect}
              >
                Details
              </Button>
              <Button
                variant={vehicle?.availability ? 'primary' : 'outline'}
                size="sm"
                disabled={!vehicle?.availability}
                className={`w-full text-xs font-black shadow-xs ${
                  vehicle?.availability
                    ? 'bg-[#FFD600] hover:bg-[#E6C200] text-slate-950 border-none'
                    : 'bg-slate-100 text-slate-400 border-slate-200'
                }`}
                onClick={onRentNow || onSelect}
              >
                {vehicle?.availability ? 'Rent Now' : 'Unavailable'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default VehicleCard;
