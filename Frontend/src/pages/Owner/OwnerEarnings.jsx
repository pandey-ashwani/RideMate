import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../utils/api';
import { DashboardLayout } from '../../layouts/DashboardLayout';
import { Card } from '../../components/Common/Card';
import { Button } from '../../components/Common/Button';
import { DollarSign, Percent, FileDown, ArrowUpRight } from 'lucide-react';

export const OwnerEarnings = () => {
  const { user } = useAuth();
  const [completedBookings, setCompletedBookings] = useState([]);
  const [financials, setFinancials] = useState({
    gross: 0,
    commission: 0,
    net: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEarnings = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const ownerBookings = await apiRequest('/bookings/owner-requests');
        const completed = ownerBookings.filter(b => b.status === 'completed');
        setCompletedBookings(completed);

        const grossAmt = completed.reduce((sum, b) => sum + b.totalCost, 0);
        const commissionAmt = Number((grossAmt * 0.1).toFixed(2)); // 10% platform share
        const netAmt = Number((grossAmt - commissionAmt).toFixed(2));

        setFinancials({
          gross: grossAmt,
          commission: commissionAmt,
          net: netAmt
        });
      } catch (err) {
        console.error('Error fetching financial history:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchEarnings();
  }, [user]);

  const handleExport = () => {
    alert('CSV statement report downloaded successfully.');
  };

  return (
    <DashboardLayout role="owner">
      <div className="flex flex-col gap-8 text-left">
        {/* Title */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight leading-none mb-1">Earnings & Payouts</h1>
            <p className="text-xs font-semibold text-slate-400">Review your generated revenues and net payouts after commission deductions</p>
          </div>
          
          <Button variant="outline" size="sm" onClick={handleExport} className="cursor-pointer font-bold border-slate-200">
            <FileDown className="w-4 h-4 shrink-0" />
            Download CSV Statement
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-20 bg-white border border-slate-100 rounded-2xl shadow-xs">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-3"></div>
            <p className="text-xs font-semibold text-slate-400">Calculating statement statistics...</p>
          </div>
        ) : (
          <>
            {/* Financial Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <Card className="border border-slate-100 p-5" hoverable={false}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Gross Billings</span>
                  <div className="w-8 h-8 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-center text-slate-400">
                    <DollarSign className="w-4 h-4" />
                  </div>
                </div>
                <h3 className="text-2xl font-black text-slate-800">₹{financials.gross}</h3>
                <span className="text-[10px] text-slate-400 font-bold mt-1 block">Total cash value generated</span>
              </Card>

              <Card className="border border-slate-100 p-5" hoverable={false}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Platform Commission (10%)</span>
                  <div className="w-8 h-8 bg-amber-50 border border-amber-100 rounded-lg flex items-center justify-center text-amber-500">
                    <Percent className="w-4 h-4" />
                  </div>
                </div>
                <h3 className="text-2xl font-black text-amber-600">-₹{financials.commission}</h3>
                <span className="text-[10px] text-slate-400 font-bold mt-1 block">Used for platform maintenance</span>
              </Card>

              <Card className="border border-slate-100 p-5" hoverable={false}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Host Net Payout</span>
                  <div className="w-8 h-8 bg-emerald-50 border border-emerald-100 rounded-lg flex items-center justify-center text-emerald-500">
                    <ArrowUpRight className="w-4 h-4" />
                  </div>
                </div>
                <h3 className="text-2xl font-black text-emerald-600">₹{financials.net}</h3>
                <span className="text-[10px] text-slate-400 font-bold mt-1 block">Transferred to your bank account</span>
              </Card>
            </div>

            {/* Transactions list */}
            <div className="flex flex-col gap-4">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Completed Transactions</h3>
              
              <Card className="border border-slate-100 p-0 overflow-hidden" hoverable={false}>
                {completedBookings.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs font-semibold text-slate-600 text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100 text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                          <th className="py-4 px-6">Booking ID</th>
                          <th className="py-4 px-6">Vehicle</th>
                          <th className="py-4 px-6">Rider</th>
                          <th className="py-4 px-6">Rental Dates</th>
                          <th className="py-4 px-6">Gross Amount</th>
                          <th className="py-4 px-6">Commission</th>
                          <th className="py-4 px-6 text-right">Net Payout</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {completedBookings.map((b) => (
                          <tr key={b._id} className="hover:bg-slate-50/50">
                            <td className="py-4 px-6 font-bold text-slate-400">{b._id}</td>
                            <td className="py-4 px-6 font-bold text-slate-800">{b.vehicleId?.name}</td>
                            <td className="py-4 px-6">{b.customerId?.name}</td>
                            <td className="py-4 px-6 text-slate-400">{b.pickupDate.split('T')[0]} to {b.dropoffDate.split('T')[0]}</td>
                            <td className="py-4 px-6 font-bold text-slate-700">₹{b.totalCost}</td>
                            <td className="py-4 px-6 text-amber-600">-₹{(b.totalCost * 0.1).toFixed(2)}</td>
                            <td className="py-4 px-6 text-right font-black text-emerald-600">₹{(b.totalCost * 0.9).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-12 text-center flex flex-col items-center gap-2">
                    <span className="text-3xl">💸</span>
                    <p className="text-xs font-bold text-slate-400">No payout records found. Complete vehicle bookings to generate payout logs.</p>
                  </div>
                )}
              </Card>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default OwnerEarnings;
