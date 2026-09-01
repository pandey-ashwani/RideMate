import React, { useState, useEffect } from 'react';
import { apiRequest, resolveImageUrl } from '../../utils/api';
import { DashboardLayout } from '../../layouts/DashboardLayout';
import { Card } from '../../components/Common/Card';
import { Badge } from '../../components/Common/Badge';
import { Calendar, User } from 'lucide-react';

export const ViewAllBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  const loadBookings = async () => {
    setLoading(true);
    try {
      const data = await apiRequest('/admin/bookings');
      setBookings(data || []);
    } catch (err) {
      console.error('Error fetching global bookings history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'success';
      case 'completed': return 'info';
      case 'pending': return 'warning';
      case 'rejected': return 'danger';
      default: return 'neutral';
    }
  };

  const filteredBookings = filter === 'all' 
    ? bookings 
    : bookings.filter(b => b.status === filter);

  return (
    <DashboardLayout role="admin">
      <div className="flex flex-col gap-8 text-left">
        {/* Title */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight leading-none mb-1">Global Booking Audit</h1>
            <p className="text-xs font-semibold text-slate-400">Audit all transactions, bookings status, and reservations logs globally</p>
          </div>
          
          {/* Status Filter tabs */}
          <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
            {['all', 'pending', 'approved', 'completed', 'rejected'].map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`
                  px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer
                  ${filter === s
                    ? 'bg-white text-slate-800 shadow-xs'
                    : 'text-slate-500 hover:text-slate-700'
                  }
                `}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Bookings table */}
        <Card className="border border-slate-100 p-0 overflow-hidden" hoverable={false}>
          {loading ? (
            <div className="text-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-3"></div>
              <p className="text-xs font-semibold text-slate-400">Loading global transaction history...</p>
            </div>
          ) : filteredBookings.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-slate-600 border-collapse font-semibold">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                    <th className="py-4 px-6">ID</th>
                    <th className="py-4 px-6">Vehicle</th>
                    <th className="py-4 px-6">Rider</th>
                    <th className="py-4 px-6">Rental Dates</th>
                    <th className="py-4 px-6">Gross Cost</th>
                    <th className="py-4 px-6 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredBookings.map((b) => (
                    <tr key={b._id} className="hover:bg-slate-50/50">
                      <td className="py-4 px-6 font-bold text-slate-400">{b._id}</td>
                      <td className="py-4 px-6 font-bold text-slate-800 flex items-center gap-3">
                        <img 
                          src={resolveImageUrl(b.vehicleId?.image)} 
                          alt={b.vehicleId?.name} 
                          className="w-10 h-7 object-cover rounded-md border" 
                          onError={(e) => {
                            e.target.src = 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=500';
                          }}
                        />
                        <span>{b.vehicleId?.name}</span>
                      </td>
                      <td className="py-4 px-6">
                        <span className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-slate-300" />
                          {b.customerId?.name}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-slate-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-300" />
                          {b.pickupDate.split('T')[0]} to {b.dropoffDate.split('T')[0]}
                        </span>
                      </td>
                      <td className="py-4 px-6 font-black text-slate-700">₹{b.totalCost}</td>
                      <td className="py-4 px-6 text-right">
                        <Badge variant={getStatusColor(b.status)} className="capitalize py-0.5 px-2">
                          {b.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center flex flex-col items-center gap-2">
              <span className="text-3xl">📭</span>
              <p className="text-xs font-bold text-slate-400">No booking requests found for status "{filter}".</p>
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ViewAllBookings;
