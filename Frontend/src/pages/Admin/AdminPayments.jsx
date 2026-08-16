import { useEffect, useState } from 'react';
import { apiRequest } from '../../utils/api';
import { DashboardLayout } from '../../layouts/DashboardLayout';
import { Card } from '../../components/Common/Card';
import { Button } from '../../components/Common/Button';
import { Input } from '../../components/Common/Input';
import { Percent, Settings, ShieldCheck, DollarSign, Wallet } from 'lucide-react';

export const AdminPayments = () => {
  const [commissionRate, setCommissionRate] = useState(10);
  const [success, setSuccess] = useState(false);
  const [financials, setFinancials] = useState({
    gross: 0,
    commission: 0,
    payout: 0
  });
  const [hostPayouts, setHostPayouts] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadFinancials = async () => {
    setLoading(true);
    try {
      const data = await apiRequest('/admin/stats');
      const metrics = data.metrics || {};
      setFinancials({
        gross: metrics.totalRevenue || 0,
        commission: metrics.totalCommission || 0,
        payout: metrics.totalPayouts || 0
      });
      setCommissionRate(metrics.commissionRate || 10);

      // Load bookings and calculate payout per host dynamically
      const bookings = await apiRequest('/admin/bookings');
      const completed = bookings.filter(b => b.status === 'completed');
      
      const hostMap = {};
      completed.forEach(b => {
        const hostId = b.ownerId?._id || 'unknown';
        const hostName = b.ownerId?.name || 'Private Owner';
        const companyName = b.ownerId?.company || 'N/A';
        const cost = b.totalCost;

        if (!hostMap[hostId]) {
          hostMap[hostId] = {
            hostName,
            companyName,
            transactions: 0,
            grossShared: 0
          };
        }
        hostMap[hostId].transactions += 1;
        hostMap[hostId].grossShared += cost;
      });

      setHostPayouts(Object.values(hostMap));
    } catch (err) {
      console.error('Error fetching financial dashboard statistics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFinancials();
  }, []);

  const handleUpdateSettings = async (e) => {
    e.preventDefault();
    setSuccess(false);
    try {
      await apiRequest('/admin/payments/commission', {
        method: 'PUT',
        body: JSON.stringify({ rate: Number(commissionRate) })
      });
      setSuccess(true);
      loadFinancials();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving commission config:', err);
      alert(err.message || 'Could not update commission rate.');
    }
  };

  return (
    <DashboardLayout role="admin">
      <div className="flex flex-col gap-8 text-left">
        {/* Title */}
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight leading-none mb-1">Platform Reports & Activity</h1>
          <p className="text-xs font-semibold text-slate-400">View overall platform billing volume, owner payout distributions, and rental activity metrics</p>
        </div>

        {loading ? (
          <div className="text-center py-20 bg-white border border-slate-100 rounded-2xl shadow-xs">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-3"></div>
            <p className="text-xs font-semibold text-slate-400">Loading platform reports...</p>
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            {/* Statistics ledger */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <Card className="border border-slate-100 p-5" hoverable={false}>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-3">Gross Rental Volume</p>
                <h3 className="text-2xl font-black text-slate-800">₹{financials.gross}</h3>
                <span className="text-[10px] text-slate-400 font-bold block mt-1">Total billing processed</span>
              </Card>

              <Card className="border border-slate-100 p-5" hoverable={false}>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-3">Owner Payouts Volume</p>
                <h3 className="text-2xl font-black text-slate-800">₹{financials.payout}</h3>
                <span className="text-[10px] text-slate-400 font-bold block mt-1">Total revenues for vehicle owners</span>
              </Card>

              <Card className="border border-slate-100 p-5" hoverable={false}>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-3">Platform Activity</p>
                <h3 className="text-2xl font-black text-emerald-600">₹{financials.commission}</h3>
                <span className="text-[10px] text-slate-400 font-bold block mt-1">Platform volume total</span>
              </Card>
            </div>

            {/* Payout History Ledger */}
            <div className="flex flex-col gap-4">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Owner Rental Activity Summary</h3>
              <Card className="border border-slate-100 p-0 overflow-hidden" hoverable={false}>
                {hostPayouts.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left text-slate-600 border-collapse font-semibold">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100 text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                          <th className="py-4 px-6">Owner Account</th>
                          <th className="py-4 px-6">Company / Business</th>
                          <th className="py-4 px-6">Completed Bookings</th>
                          <th className="py-4 px-6 text-right">Gross Rental Earnings</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {hostPayouts.map((hp, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="py-4 px-6 font-bold text-slate-800">{hp.hostName}</td>
                            <td className="py-4 px-6 text-slate-400 font-bold">{hp.companyName}</td>
                            <td className="py-4 px-6">{hp.transactions} completed rental(s)</td>
                            <td className="py-4 px-6 text-right font-black text-emerald-600">₹{hp.grossShared}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-12 text-center flex flex-col items-center gap-2">
                    <span className="text-3xl">📊</span>
                    <p className="text-xs font-bold text-slate-400">No activity records found yet. Complete vehicle rentals to populate report logs.</p>
                  </div>
                )}
              </Card>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminPayments;
