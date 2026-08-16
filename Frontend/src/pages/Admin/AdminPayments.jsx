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
  const [ownerPayouts, setOwnerPayouts] = useState([]);
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

      // Load bookings and calculate payout per owner dynamically
      const bookings = await apiRequest('/admin/bookings');
      const completed = bookings.filter(b => b.status === 'completed');
      
      const ownerMap = {};
      completed.forEach(b => {
        const ownerId = b.ownerId?._id || 'unknown';
        const ownerName = b.ownerId?.name || 'Private Owner';
        const companyName = b.ownerId?.company || 'N/A';
        const cost = Number(b.totalCost) || 0;

        if (!ownerMap[ownerId]) {
          ownerMap[ownerId] = {
            ownerName,
            companyName,
            transactions: 0,
            grossShared: 0
          };
        }
        ownerMap[ownerId].transactions += 1;
        ownerMap[ownerId].grossShared += cost;
      });

      setOwnerPayouts(Object.values(ownerMap));
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
      await apiRequest('/admin/commission', {
        method: 'PUT',
        body: JSON.stringify({ rate: Number(commissionRate) })
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      loadFinancials();
    } catch (err) {
      console.error('Error updating platform commission rate:', err);
      alert(err.message || 'Could not update commission settings.');
    }
  };

  return (
    <DashboardLayout role="admin">
      <div className="flex flex-col gap-8 text-left">
        {/* Title */}
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight leading-none mb-1">Platform Revenue & Payouts</h1>
          <p className="text-xs font-semibold text-slate-400">Configure global platform commission percentage and monitor total system revenues</p>
        </div>

        {loading ? (
          <div className="text-center py-20 bg-white border border-slate-100 rounded-2xl shadow-xs">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-3"></div>
            <p className="text-xs font-semibold text-slate-400">Loading payout records...</p>
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            {/* Financial Metrics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <Card className="border border-slate-100 p-5" hoverable={false}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Gross System Revenue</span>
                  <div className="w-8 h-8 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-center text-slate-400">
                    <DollarSign className="w-4 h-4" />
                  </div>
                </div>
                <h3 className="text-2xl font-black text-slate-800">₹{financials.gross}</h3>
                <span className="text-[10px] text-slate-400 font-bold mt-1 block">Total customer bookings volume</span>
              </Card>

              <Card className="border border-slate-100 p-5" hoverable={false}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Platform Earnings ({commissionRate}%)</span>
                  <div className="w-8 h-8 bg-emerald-50 border border-emerald-100 rounded-lg flex items-center justify-center text-emerald-500">
                    <Percent className="w-4 h-4" />
                  </div>
                </div>
                <h3 className="text-2xl font-black text-emerald-600">+₹{financials.commission}</h3>
                <span className="text-[10px] text-slate-400 font-bold mt-1 block">Platform commission retained</span>
              </Card>

              <Card className="border border-slate-100 p-5" hoverable={false}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Owner Net Payouts</span>
                  <div className="w-8 h-8 bg-blue-50 border border-blue-100 rounded-lg flex items-center justify-center text-primary">
                    <Wallet className="w-4 h-4" />
                  </div>
                </div>
                <h3 className="text-2xl font-black text-slate-800">₹{financials.payout}</h3>
                <span className="text-[10px] text-slate-400 font-bold mt-1 block">Transferred to vehicle owners</span>
              </Card>
            </div>

            {/* Commission Settings Card */}
            <Card className="border border-slate-100 p-6 max-w-xl" hoverable={false}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600">
                  <Settings className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">Commission Rate Settings</h3>
                  <p className="text-xs text-slate-400 font-semibold">Set the default platform share deducted from completed rentals</p>
                </div>
              </div>

              {success && (
                <div className="mb-4 flex items-center gap-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 p-3 rounded-lg text-xs font-semibold">
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <span>Commission rate updated to {commissionRate}%</span>
                </div>
              )}

              <form onSubmit={handleUpdateSettings} className="flex flex-col sm:flex-row items-end gap-3">
                <div className="flex-grow">
                  <Input
                    label="Platform Commission (%)"
                    type="number"
                    min="0"
                    max="100"
                    required
                    value={commissionRate}
                    onChange={(e) => setCommissionRate(e.target.value)}
                  />
                </div>
                <Button type="submit" variant="primary" className="py-2.5 font-bold shadow-xs">
                  Save Settings
                </Button>
              </form>
            </Card>

            {/* Payout History Ledger */}
            <div className="flex flex-col gap-4">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Owner Rental Activity Summary</h3>
              <Card className="border border-slate-100 p-0 overflow-hidden" hoverable={false}>
                {ownerPayouts.length > 0 ? (
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
                        {ownerPayouts.map((hp, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="py-4 px-6 font-bold text-slate-800">{hp.ownerName}</td>
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
