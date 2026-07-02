import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../utils/api';
import { DashboardLayout } from '../../layouts/DashboardLayout';
import { Card } from '../../components/Common/Card';
import { Badge } from '../../components/Common/Badge';
import { Button } from '../../components/Common/Button';
import { Check, ShieldCheck, Mail, Phone, Building } from 'lucide-react';

export const VerifyOwners = () => {
  const { verifyOwner } = useAuth();
  const [pendingHosts, setPendingHosts] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadPendingHosts = async () => {
    setLoading(true);
    try {
      const data = await apiRequest('/admin/pending-hosts');
      setPendingHosts(data || []);
    } catch (err) {
      console.error('Error fetching unverified owners:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPendingHosts();
  }, []);

  const handleVerify = async (hostId) => {
    const res = await verifyOwner(hostId);
    if (res.success) {
      setPendingHosts(prev => prev.filter(host => host._id !== hostId));
    } else {
      alert(res.message || 'Verification failed.');
    }
  };

  return (
    <DashboardLayout role="admin">
      <div className="flex flex-col gap-8 text-left">
        {/* Title */}
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight leading-none mb-1">Verify Rental Hosts</h1>
          <p className="text-xs font-semibold text-slate-400">Review business registration requests, contact details, and approve host status</p>
        </div>

        {/* Verification Queue */}
        {loading ? (
          <div className="text-center py-20 bg-white border border-slate-100 rounded-2xl shadow-xs">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-3"></div>
            <p className="text-xs font-semibold text-slate-400">Loading pending verifications...</p>
          </div>
        ) : pendingHosts.length > 0 ? (
          <div className="flex flex-col gap-4">
            {pendingHosts.map((host) => (
              <Card key={host._id} className="flex flex-col sm:flex-row items-center gap-6 p-6 border border-slate-100" hoverable={false}>
                {/* Host Info */}
                <img src={host.avatar} alt={host.name} className="w-12 h-12 rounded-full object-cover border shrink-0" />
                
                <div className="flex-grow flex flex-col gap-1.5 md:text-left text-center">
                  <div className="flex items-center gap-2 justify-center md:justify-start">
                    <h3 className="text-base font-black text-slate-800 tracking-tight">{host.name}</h3>
                    <Badge variant="warning">Awaiting Verification</Badge>
                  </div>
                  
                  {/* Contact details */}
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs font-semibold text-slate-400 mt-1">
                    <span className="flex items-center gap-1.5">
                      <Building className="w-4 h-4 text-slate-300" />
                      Company: {host.company || 'Private Owner'}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1.5">
                      <Phone className="w-4 h-4 text-slate-300" />
                      {host.phone || 'N/A'}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1.5">
                      <Mail className="w-4 h-4 text-slate-300" />
                      {host.email}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="shrink-0">
                  <Button
                    variant="primary"
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                    onClick={() => handleVerify(host._id)}
                  >
                    <Check className="w-4 h-4 shrink-0" />
                    Approve Host
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center shadow-xs flex flex-col items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center mb-2">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h3 className="text-base font-black text-slate-800">All Hosts Verified</h3>
            <p className="text-xs text-slate-400 max-w-xs">
              There are currently no rental owners waiting in the verification queue. Newly signed-up hosts will appear here.
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default VerifyOwners;
