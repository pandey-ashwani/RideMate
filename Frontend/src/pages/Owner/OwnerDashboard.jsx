import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../utils/api';
import { DashboardLayout } from '../../layouts/DashboardLayout';
import { Card } from '../../components/Common/Card';
import { Button } from '../../components/Common/Button';
import { DollarSign, Car, CalendarClock, TrendingUp, Inbox, Info } from 'lucide-react';
import { Link } from 'react-router-dom';

export const OwnerDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalEarnings: 0,
    activeRentals: 0,
    totalBookings: 0,
    utilizationRate: 0,
    monthlyEarnings: []
  });
  const [myVehicles, setMyVehicles] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardDetails = async () => {
      if (!user) return;
      setLoading(true);
      try {
        // Load owner's bookings
        const ownerBookings = await apiRequest('/bookings/owner-requests');
        
        // Load owner's vehicles (fetch all and filter locally by ownerId)
        const allVehiclesData = await apiRequest('/vehicles?pageSize=100');
        const ownerVehicles = (allVehiclesData.vehicles || []).filter(v => v.ownerId === user._id);
        setMyVehicles(ownerVehicles);

        // Derive statistics
        const completedBookings = ownerBookings.filter(b => b.status === 'completed');
        const grossEarnings = completedBookings.reduce((sum, b) => sum + (Number(b.totalCost) || 0), 0);
        const activeRentals = ownerBookings.filter(b => b.status === 'approved' || b.status === 'confirmed' || b.status === 'owner_accepted').length;
        const pending = ownerBookings.filter(b => b.status === 'pending');
        setPendingRequests(pending);

        // Dynamic Monthly Earnings calculation
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        
        // Use the current calendar year or last 6 months. Let's build a last 6 months tracker.
        const currentMonthIdx = new Date().getMonth();
        const last6Months = [];
        for (let i = 5; i >= 0; i--) {
          const idx = (currentMonthIdx - i + 12) % 12;
          last6Months.push({ month: months[idx], monthIndex: idx, earnings: 0 });
        }

        completedBookings.forEach(b => {
          const date = new Date(b.pickupDate);
          const monthIdx = date.getMonth();
          const match = last6Months.find(m => m.monthIndex === monthIdx);
          if (match) {
            match.earnings += (Number(b.totalCost) || 0);
          }
        });

        // Utilization: ratio of approved/completed booking days over total fleet capacity
        const totalRentalsCount = ownerBookings.filter(b => b.status === 'approved' || b.status === 'completed').length;
        const utilizationRate = ownerVehicles.length > 0 
          ? Math.min(100, Math.round((totalRentalsCount / (ownerVehicles.length * 3)) * 100)) 
          : 0;

        setStats({
          totalEarnings: grossEarnings,
          activeRentals,
          totalBookings: ownerBookings.length,
          utilizationRate,
          monthlyEarnings: last6Months
        });
      } catch (err) {
        console.error('Error fetching owner dashboard metrics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardDetails();
  }, [user]);

  return (
    <DashboardLayout role="owner">
      <div className="flex flex-col gap-8 text-left">
        {/* Title */}
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight leading-none mb-1">Owner Dashboard</h1>
          <p className="text-xs font-semibold text-slate-400">Manage your rental business, list vehicles, handle booking requests, and view earnings</p>
        </div>

        {/* Owner Verification Status Banner */}
        {user && !user.isVerified && (
          <div className={`p-4 rounded-2xl border text-xs font-semibold flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
            user.verificationStatus === 'rejected'
              ? 'bg-red-50 border-red-200 text-red-800'
              : 'bg-amber-50 border-amber-200 text-amber-800'
          }`}>
            <div className="flex items-start gap-3">
              <div className="text-xl shrink-0">
                {user.verificationStatus === 'rejected' ? '❌' : '⏳'}
              </div>
              <div>
                <h4 className="font-extrabold text-sm mb-0.5">
                  {user.verificationStatus === 'rejected' ? 'Owner Verification Rejected' : 'Owner Verification Pending'}
                </h4>
                <p>
                  {user.verificationStatus === 'rejected'
                    ? `Reason: ${user.rejectionReason || 'Uploaded business info was rejected.'} Please update your verification documents.`
                    : 'Your business details are under review by RideMate Admin. Once approved, your listed vehicles will appear in public search.'}
                </p>
              </div>
            </div>
            <Link to="/owner/profile">
              <Button size="sm" variant={user.verificationStatus === 'rejected' ? 'primary' : 'outline'} className="font-bold shrink-0">
                {user.verificationStatus === 'rejected' ? 'Update & Resubmit Info' : 'View Verification Info'}
              </Button>
            </Link>
          </div>
        )}

        {loading ? (
          <div className="text-center py-20 bg-white border border-slate-100 rounded-2xl shadow-xs">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-3"></div>
            <p className="text-xs font-semibold text-slate-400">Fetching owner metrics...</p>
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <Card className="flex items-center gap-4 border border-slate-100" hoverable={false}>
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
                  <DollarSign className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Total Earnings</p>
                  <h3 className="text-xl font-extrabold text-slate-800">₹{stats.totalEarnings}</h3>
                </div>
              </Card>

              <Card className="flex items-center gap-4 border border-slate-100" hoverable={false}>
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-primary border border-blue-100 flex items-center justify-center shrink-0">
                  <Car className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">My Fleet Listings</p>
                  <h3 className="text-xl font-extrabold text-slate-800">{myVehicles.length} Listed</h3>
                </div>
              </Card>

              <Card className="flex items-center gap-4 border border-slate-100" hoverable={false}>
                <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center shrink-0">
                  <CalendarClock className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Active Bookings</p>
                  <h3 className="text-xl font-extrabold text-slate-800">{stats.activeRentals} Rentals</h3>
                </div>
              </Card>

              <Card className="flex items-center gap-4 border border-slate-100" hoverable={false}>
                <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center shrink-0">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Fleet Utilization</p>
                  <h3 className="text-xl font-extrabold text-slate-800">{stats.utilizationRate}%</h3>
                </div>
              </Card>
            </div>

            {/* Dashboard Panels */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Earnings Chart */}
              <Card className="lg:col-span-8 flex flex-col justify-between border border-slate-100 min-h-[300px] p-6" hoverable={false}>
                <div>
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-6">Earnings Trend (Last 6 Months)</h3>
                  
                  {/* Custom CSS Bar Chart */}
                  <div className="flex justify-between items-end gap-3 h-44 border-b border-slate-100 pb-2 relative z-10 px-2 mt-4">
                    {stats.monthlyEarnings.map((data, idx) => {
                      const maxEarnings = Math.max(...stats.monthlyEarnings.map(m => m.earnings)) || 100;
                      const percentage = Math.round((data.earnings / maxEarnings) * 100);
                      
                      return (
                        <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                          {/* Bar fill */}
                          <div className="w-full bg-slate-100 group-hover:bg-primary/5 rounded-t-md transition-colors h-36 flex items-end">
                            <div 
                              style={{ height: `${percentage}%` }}
                              className="w-full bg-primary hover:bg-primary-light rounded-t-md transition-all duration-500 relative flex justify-center group-hover:scale-y-[1.02] origin-bottom shadow-xs cursor-pointer"
                            >
                              {/* Tooltip */}
                              <div className="absolute -top-7 scale-0 group-hover:scale-100 transition-transform duration-150 bg-slate-900 text-white font-bold text-[10px] py-1 px-2 rounded-md shadow-md whitespace-nowrap z-20">
                                ₹{data.earnings}
                              </div>
                            </div>
                          </div>
                          
                          {/* Month Label */}
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{data.month}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </Card>

              {/* Pending Alerts / Info Box */}
              <Card className="lg:col-span-4 border border-slate-100 flex flex-col justify-between p-6" hoverable={false}>
                <div className="flex flex-col gap-4">
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Alerts & Notifications</h3>
                  
                  {pendingRequests.length > 0 ? (
                    <div className="flex flex-col gap-3">
                      <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-800 rounded-xl text-xs flex gap-2 font-semibold">
                        <Inbox className="w-4 h-4 shrink-0 text-amber-500" />
                        <div>
                          <p>Pending Booking Actions</p>
                          <span className="text-[10px] text-slate-500 font-normal mt-0.5 block">
                            You have {pendingRequests.length} vehicle rent request(s) awaiting your decision.
                          </span>
                        </div>
                      </div>
                      
                      <Link to="/owner/bookings">
                        <Button variant="secondary" size="sm" className="w-full font-bold">
                          View Bookings Queue
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="text-center py-10 flex flex-col items-center gap-2">
                      <span className="text-2xl text-slate-300"></span>
                      <p className="text-xs font-semibold text-slate-400">All caught up! No alerts.</p>
                    </div>
                  )}
                </div>

                <div className="border-t border-slate-100 pt-4 mt-6 text-xs text-slate-400 font-semibold flex flex-col gap-2">
                  <p>Quick Links:</p>
                  <div className="flex flex-wrap gap-2">
                    <Link to="/owner/vehicles" className="text-primary hover:underline">List New Vehicle</Link>
                    <span>•</span>
                    <Link to="/owner/earnings" className="text-primary hover:underline">Financial Statements</Link>
                  </div>
                </div>
              </Card>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default OwnerDashboard;
