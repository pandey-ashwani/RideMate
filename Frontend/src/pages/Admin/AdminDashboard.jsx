import { useEffect, useState } from 'react';
import { apiRequest } from '../../utils/api';
import { DashboardLayout } from '../../layouts/DashboardLayout';
import { Card } from '../../components/Common/Card';
import { Badge } from '../../components/Common/Badge';
import { Button } from '../../components/Common/Button';
import { Users, Car, ShieldCheck, DollarSign, Wallet, Inbox } from 'lucide-react';
import { Link } from 'react-router-dom';

export const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalOwners: 0,
    pendingHosts: 0,
    totalVehicles: 0,
    totalRevenue: 0,
    totalCommission: 0,
    totalPayouts: 0,
    commissionRate: 10
  });
  const [txHistory, setTxHistory] = useState([]);
  const [pendingListingsCount, setPendingListingsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminStats = async () => {
      setLoading(true);
      try {
        const data = await apiRequest('/admin/stats');
        setStats(data.metrics || {});
        setTxHistory(data.recentTransactions || []);

        // Fetch pending listings count
        const listings = await apiRequest('/admin/listings');
        const pendingListings = listings.filter(v => v.status === 'pending').length;
        setPendingListingsCount(pendingListings);
      } catch (err) {
        console.error('Error fetching admin statistics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminStats();
  }, []);

  return (
    <DashboardLayout role="admin">
      <div className="flex flex-col gap-8 text-left">
        {/* Title */}
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight leading-none mb-1">Admin Control Overview</h1>
          <p className="text-xs font-semibold text-slate-400">Monitor system registrations, vehicle approval queues and ledger payouts</p>
        </div>

        {loading ? (
          <div className="text-center py-20 bg-white border border-slate-100 rounded-2xl shadow-xs">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-3"></div>
            <p className="text-xs font-semibold text-slate-400">Fetching administrative analytics...</p>
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <Card className="flex items-center gap-4 border border-slate-100" hoverable={false}>
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-primary border border-blue-100 flex items-center justify-center shrink-0">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Total Users</p>
                  <h3 className="text-xl font-extrabold text-slate-800">{stats.totalCustomers + stats.totalOwners}</h3>
                </div>
              </Card>

              <Card className="flex items-center gap-4 border border-slate-100" hoverable={false}>
                <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center shrink-0">
                  <Car className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Global Inventory</p>
                  <h3 className="text-xl font-extrabold text-slate-800">{stats.totalVehicles} Listed</h3>
                </div>
              </Card>

              <Card className="flex items-center gap-4 border border-slate-100" hoverable={false}>
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
                  <DollarSign className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Gross Billing Volume</p>
                  <h3 className="text-xl font-extrabold text-slate-800">₹{stats.totalRevenue}</h3>
                </div>
              </Card>

              <Card className="flex items-center gap-4 border border-slate-100" hoverable={false}>
                <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center shrink-0">
                  <Wallet className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Net Commissions</p>
                  <h3 className="text-xl font-extrabold text-slate-800">₹{stats.totalCommission}</h3>
                </div>
              </Card>
            </div>

            {/* Lower layout panels */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Recent Payments Transactions */}
              <Card className="lg:col-span-8 border border-slate-100 p-0 overflow-hidden" hoverable={false}>
                <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">System Audit Ledger</h3>
                  <Badge variant="primary">Recent</Badge>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left text-slate-600 border-collapse font-semibold">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                        <th className="py-4 px-6">Tx Reference</th>
                        <th className="py-4 px-6">Customer</th>
                        <th className="py-4 px-6">Rental Host</th>
                        <th className="py-4 px-6">Gross Booking</th>
                        <th className="py-4 px-6 text-right">Commission Fee ({stats.commissionRate}%)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {txHistory.length > 0 ? (
                        txHistory.map((tx) => (
                          <tr key={tx._id} className="hover:bg-slate-50/50">
                            <td className="py-4 px-6 font-bold text-slate-400 uppercase">{tx.transactionId}</td>
                            <td className="py-4 px-6 font-bold text-slate-800">{tx.customerId?.name}</td>
                            <td className="py-4 px-6">{tx.ownerId?.name || 'Private Owner'}</td>
                            <td className="py-4 px-6 font-bold text-slate-700">₹{tx.amount}</td>
                            <td className="py-4 px-6 text-right font-black text-emerald-600">+₹{tx.commission}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="5" className="py-8 text-center text-slate-400 font-semibold">
                            No ledger records generated yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>

              {/* Quick Actions Panel */}
              <Card className="lg:col-span-4 border border-slate-100 p-6 flex flex-col justify-between" hoverable={false}>
                <div className="flex flex-col gap-5">
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Platform Controls</h3>
                  
                  <div className="flex flex-col gap-3">
                    <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between">
                      <div className="text-left">
                        <p className="text-xs font-bold text-slate-700">Pending Owners</p>
                        <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">Verification requests</span>
                      </div>
                      <Badge variant={stats.pendingHosts > 0 ? 'warning' : 'neutral'} className="text-xs">
                        {stats.pendingHosts} Pending
                      </Badge>
                    </div>

                    <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between">
                      <div className="text-left">
                        <p className="text-xs font-bold text-slate-700">Total Registered Owners</p>
                        <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">Platform rental owners</span>
                      </div>
                      <Badge variant="primary" className="text-xs">
                        {stats.totalOwners} Owners
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-4 mt-6 flex flex-col gap-2">
                  <Link to="/admin/verify-owners">
                    <Button variant="primary" size="sm" className="w-full font-bold">
                      Owner Verification
                    </Button>
                  </Link>
                  <Link to="/admin/users">
                    <Button variant="outline" size="sm" className="w-full font-bold border-slate-200">
                      Manage Platform Users
                    </Button>
                  </Link>
                </div>
              </Card>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
