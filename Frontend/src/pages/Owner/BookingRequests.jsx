import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../utils/api';
import { DashboardLayout } from '../../layouts/DashboardLayout';
import { Card } from '../../components/Common/Card';
import { Badge } from '../../components/Common/Badge';
import { Button } from '../../components/Common/Button';
import { Check, X, Calendar, User, CheckCircle2 } from 'lucide-react';

export const BookingRequests = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadRequests = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await apiRequest('/bookings/owner-requests');
      // Sort status priority: pending, approved, completed, rejected
      const order = { 'pending': 1, 'approved': 2, 'completed': 3, 'rejected': 4 };
      data.sort((a, b) => order[a.status] - order[b.status]);
      setRequests(data || []);
    } catch (err) {
      console.error('Error loading host booking queue:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, [user]);

  const handleAction = async (bookingId, actionStatus) => {
    try {
      await apiRequest(`/bookings/${bookingId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: actionStatus })
      });
      loadRequests();
    } catch (err) {
      console.error('Error updating booking status:', err);
      alert(err.message || 'Could not update booking status.');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
      case 'approved': return 'success';
      case 'owner_accepted': return 'warning';
      case 'completed': return 'info';
      case 'pending': return 'warning';
      case 'rejected': return 'danger';
      default: return 'neutral';
    }
  };

  return (
    <DashboardLayout role="owner">
      <div className="flex flex-col gap-8 text-left">
        {/* Title */}
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight leading-none mb-1">Rental Booking Requests</h1>
          <p className="text-xs font-semibold text-slate-400">Accept or reject inbound rental bookings for your vehicles</p>
        </div>

        {/* Requests List */}
        {loading ? (
          <div className="text-center py-20 bg-white border border-slate-100 rounded-2xl shadow-xs">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-3"></div>
            <p className="text-xs font-semibold text-slate-400">Loading incoming requests...</p>
          </div>
        ) : requests.length > 0 ? (
          <div className="flex flex-col gap-4">
            {requests.map((req) => (
              <Card key={req._id} className="flex flex-col md:flex-row items-center gap-5 p-5 border border-slate-100" hoverable={false}>
                {/* Vehicle image */}
                <img
                  src={req.vehicleId?.image.startsWith('http') ? req.vehicleId.image : `http://localhost:5000${req.vehicleId?.image}`}
                  alt={req.vehicleId?.name}
                  className="w-28 h-18 object-cover rounded-xl border border-slate-100 shrink-0"
                />

                {/* Metadata */}
                <div className="flex-grow flex flex-col gap-1.5 md:text-left text-center">
                  <div className="flex items-center gap-2 md:justify-start justify-center flex-wrap">
                    <span className="text-[10px] font-bold text-slate-400">REQUEST ID: {req._id}</span>
                    <Badge variant={getStatusColor(req.status)} className="capitalize py-0.5 px-2 text-[10px]">
                      {req.status === 'owner_accepted' ? 'Accepted (Awaiting Customer Details)' : req.status}
                    </Badge>
                  </div>
                  <h4 className="text-base font-black text-slate-800 tracking-tight leading-none">{req.vehicleId?.name}</h4>
                  
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs font-semibold text-slate-500 mt-1">
                    <span className="flex items-center gap-1">
                      <User className="w-4 h-4 text-slate-400 shrink-0" />
                      Client: {req.customerId?.name}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                      {req.pickupDate?.split('T')[0]} to {req.dropoffDate?.split('T')[0]}
                    </span>
                  </div>

                  {/* Confirmed Details Block */}
                  {(req.status === 'confirmed' || req.status === 'completed') && (
                    <div className="mt-2 p-3 bg-slate-50 border border-slate-200/60 rounded-xl text-xs font-semibold flex flex-col gap-1 text-slate-700">
                      <p className="font-extrabold uppercase text-[10px] text-slate-400 tracking-wider">Confirmed Rental Details</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-0.5">
                        <div><span className="text-slate-400">Driving License:</span> <span className="font-bold">{req.drivingLicense || 'N/A'}</span></div>
                        <div><span className="text-slate-400">Pickup Location:</span> <span className="font-bold">{req.pickupLocation || 'N/A'}</span></div>
                      </div>
                      {req.pickupNotes && (
                        <div><span className="text-slate-400">Pickup Notes:</span> <span>{req.pickupNotes}</span></div>
                      )}
                      {req.licenseDoc && (
                        <div className="mt-1">
                          <a 
                            href={req.licenseDoc.startsWith('http') ? req.licenseDoc : `http://localhost:5000${req.licenseDoc}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-primary font-bold hover:underline inline-flex items-center gap-1"
                          >
                            📄 View Driving License Photo
                          </a>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Earnings & Actions */}
                <div className="flex flex-col items-center md:items-end gap-3 shrink-0">
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Expected Payout</p>
                    <h3 className="text-lg font-black text-primary">₹{req.totalCost}</h3>
                  </div>

                  {req.status === 'pending' && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="hover:border-red-200 hover:bg-red-50 text-red-600 font-bold"
                        onClick={() => handleAction(req._id, 'rejected')}
                      >
                        <X className="w-4 h-4 shrink-0" />
                        Reject Request
                      </Button>
                      
                      <Button
                        variant="primary"
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                        onClick={() => handleAction(req._id, 'owner_accepted')}
                      >
                        <Check className="w-4 h-4 shrink-0" />
                        Accept Request
                      </Button>
                    </div>
                  )}

                  {req.status === 'owner_accepted' && (
                    <span className="text-[11px] font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
                      Waiting for Customer to submit DL & Pickup Details
                    </span>
                  )}

                  {(req.status === 'confirmed' || req.status === 'approved') && (
                    <Button
                      variant="primary"
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-500 text-white font-bold"
                      onClick={() => handleAction(req._id, 'completed')}
                    >
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      Complete Rental
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center shadow-xs flex flex-col items-center gap-4">
            <span className="text-4xl">📬</span>
            <h3 className="text-base font-black text-slate-800">No requests found</h3>
            <p className="text-xs text-slate-400 max-w-xs">
              You haven't received any rental booking requests yet. Once users rent your approved fleet items, they will appear here.
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default BookingRequests;
