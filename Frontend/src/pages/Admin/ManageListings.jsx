import React, { useState, useEffect } from 'react';
import { apiRequest, resolveImageUrl } from '../../utils/api';
import { DashboardLayout } from '../../layouts/DashboardLayout';
import { Card } from '../../components/Common/Card';
import { Badge } from '../../components/Common/Badge';
import { Button } from '../../components/Common/Button';
import { Check, Trash2, MapPin } from 'lucide-react';

export const ManageListings = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadVehicles = async () => {
    setLoading(true);
    try {
      const data = await apiRequest('/admin/listings');
      setVehicles(data || []);
    } catch (err) {
      console.error('Error fetching global listings queue:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVehicles();
  }, []);

  const handleApprove = async (vehicleId) => {
    try {
      await apiRequest(`/admin/listings/${vehicleId}/approve`, {
        method: 'PUT'
      });
      loadVehicles();
    } catch (err) {
      console.error('Error approving vehicle listing:', err);
      alert(err.message || 'Approval failed.');
    }
  };

  const handleDelete = async (vehicleId) => {
    if (confirm('Are you sure you want to reject/delete this vehicle listing?')) {
      try {
        await apiRequest(`/vehicles/${vehicleId}`, {
          method: 'DELETE'
        });
        loadVehicles();
      } catch (err) {
        console.error('Error rejecting/deleting listing:', err);
        alert(err.message || 'Deletion failed.');
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'success';
      case 'pending': return 'warning';
      default: return 'neutral';
    }
  };

  // Sort: pending first, then approved
  const sortedVehicles = [...vehicles].sort((a, b) => {
    if (a.status === 'pending' && b.status !== 'pending') return -1;
    if (a.status !== 'pending' && b.status === 'pending') return 1;
    return 0;
  });

  return (
    <DashboardLayout role="admin">
      <div className="flex flex-col gap-8 text-left">
        {/* Title */}
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight leading-none mb-1">Global Vehicle Listings</h1>
          <p className="text-xs font-semibold text-slate-400">Review newly listed fleet items from owners, audit compliance and approve listings</p>
        </div>

        {/* Listings queue */}
        {loading ? (
          <div className="text-center py-20 bg-white border border-slate-100 rounded-2xl shadow-xs">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-3"></div>
            <p className="text-xs font-semibold text-slate-400">Loading global fleet list...</p>
          </div>
        ) : sortedVehicles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedVehicles.map((vehicle) => {
              return (
                <Card key={vehicle._id} className="flex flex-col overflow-hidden p-0 border border-slate-100" hoverable={false}>
                  <div className="relative h-44 bg-slate-50 shrink-0">
                    <img 
                      src={resolveImageUrl(vehicle.image)} 
                      alt={vehicle.name} 
                      className="w-full h-full object-cover" 
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=500';
                      }}
                    />
                    <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                      <Badge variant="primary" className="uppercase">{vehicle.type}</Badge>
                      <Badge variant={getStatusColor(vehicle.status)} className="capitalize">
                        {vehicle.status}
                      </Badge>
                    </div>
                    <div className="absolute bottom-3 right-3 bg-slate-900/80 backdrop-blur-xs px-2.5 py-1 rounded-md text-white font-extrabold text-xs">
                      ₹{vehicle.pricePerDay}/day
                    </div>
                  </div>

                  <div className="p-5 text-left flex flex-col flex-grow justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">
                          {vehicle.ownerId?.company ? `🏢 ${vehicle.ownerId.company}` : vehicle.brand || 'RideMate Fleet'}
                        </span>
                      </div>
                      
                      <h3 className="text-base font-black text-slate-800 tracking-tight leading-none mb-2 truncate">
                        {vehicle.name}
                      </h3>
                      
                      <p className="text-xs text-slate-400 font-semibold flex items-center gap-1 mb-4">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>{vehicle.location || 'Local Fleet'}</span>
                      </p>
                    </div>

                    <div className="border-t border-slate-100 pt-4 flex items-center gap-2">
                      {vehicle.status === 'pending' && (
                        <Button
                          variant="primary"
                          size="sm"
                          className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                          onClick={() => handleApprove(vehicle._id)}
                        >
                          <Check className="w-3.5 h-3.5 shrink-0" />
                          Approve
                        </Button>
                      )}
                      
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 hover:border-red-200 hover:bg-red-50 text-red-600 font-bold"
                        onClick={() => handleDelete(vehicle._id)}
                      >
                        <Trash2 className="w-3.5 h-3.5 shrink-0" />
                        {vehicle.status === 'pending' ? 'Reject' : 'Delete'}
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center shadow-xs flex flex-col items-center gap-4">
            <span className="text-4xl">🚗</span>
            <h3 className="text-base font-black text-slate-800">No Listings in Database</h3>
            <p className="text-xs text-slate-400 max-w-xs">
              There are currently no listed vehicles on the platform. Listings will show up here.
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ManageListings;
