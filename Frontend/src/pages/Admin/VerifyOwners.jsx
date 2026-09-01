import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiRequest, resolveImageUrl } from '../../utils/api';
import { DashboardLayout } from '../../layouts/DashboardLayout';
import { Card } from '../../components/Common/Card';
import { Badge } from '../../components/Common/Badge';
import { Button } from '../../components/Common/Button';
import { Modal } from '../../components/Common/Modal';
import { Check, X, ShieldCheck, Mail, Phone, Building, FileText } from 'lucide-react';

export const VerifyOwners = () => {
  const { verifyOwner } = useAuth();
  const [pendingOwners, setPendingOwners] = useState([]);
  const [loading, setLoading] = useState(true);

  // Reject modal state
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [selectedOwner, setSelectedOwner] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const loadPendingOwners = async () => {
    setLoading(true);
    try {
      const data = await apiRequest('/admin/pending-owners');
      setPendingOwners(data || []);
    } catch (err) {
      console.error('Error fetching unverified owners:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPendingOwners();
  }, []);

  const handleApprove = async (ownerId) => {
    const res = await verifyOwner(ownerId, 'approved');
    if (res.success) {
      setPendingOwners(prev => prev.filter(owner => owner._id !== ownerId));
    } else {
      alert(res.message || 'Verification failed.');
    }
  };

  const handleOpenRejectModal = (owner) => {
    setSelectedOwner(owner);
    setRejectionReason('');
    setIsRejectModalOpen(true);
  };

  const handleConfirmReject = async (e) => {
    e.preventDefault();
    if (!selectedOwner) return;

    const res = await verifyOwner(selectedOwner._id, 'rejected', rejectionReason);
    if (res.success) {
      setPendingOwners(prev => prev.filter(owner => owner._id !== selectedOwner._id));
      setIsRejectModalOpen(false);
      setSelectedOwner(null);
    } else {
      alert(res.message || 'Rejection failed.');
    }
  };

  return (
    <DashboardLayout role="admin">
      <div className="flex flex-col gap-8 text-left">
        {/* Title */}
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight leading-none mb-1">Verify Rental Owners</h1>
          <p className="text-xs font-semibold text-slate-400">Review business registration requests, contact details, verification proof, and approve owner status</p>
        </div>

        {/* Verification Queue */}
        {loading ? (
          <div className="text-center py-20 bg-white border border-slate-100 rounded-2xl shadow-xs">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-3"></div>
            <p className="text-xs font-semibold text-slate-400">Loading pending owner verifications...</p>
          </div>
        ) : pendingOwners.length > 0 ? (
          <div className="flex flex-col gap-4">
            {pendingOwners.map((owner) => (
              <Card key={owner._id} className="flex flex-col sm:flex-row items-center gap-6 p-6 border border-slate-100" hoverable={false}>
                {/* Owner Avatar */}
                <img 
                  src={owner.avatar ? resolveImageUrl(owner.avatar) : 'https://api.dicebear.com/7.x/avataaars/svg?seed=User'} 
                  alt={owner.name} 
                  className="w-12 h-12 rounded-full object-cover border shrink-0" 
                  onError={(e) => {
                    e.target.src = 'https://api.dicebear.com/7.x/avataaars/svg?seed=User';
                  }}
                />
                
                <div className="flex-grow flex flex-col gap-1.5 md:text-left text-center">
                  <div className="flex items-center gap-2 justify-center md:justify-start">
                    <h3 className="text-base font-black text-slate-800 tracking-tight">{owner.name}</h3>
                    <Badge variant="warning">Awaiting Verification</Badge>
                  </div>
                  
                  {/* Contact details */}
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs font-semibold text-slate-400 mt-1">
                    <span className="flex items-center gap-1.5">
                      <Building className="w-4 h-4 text-slate-300" />
                      Company: {owner.company || 'Private Owner'}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1.5">
                      <Phone className="w-4 h-4 text-slate-300" />
                      {owner.phone || 'N/A'}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1.5">
                      <Mail className="w-4 h-4 text-slate-300" />
                      {owner.email}
                    </span>
                  </div>

                  {owner.verificationDoc && (
                    <div className="mt-2">
                      <a 
                        href={resolveImageUrl(owner.verificationDoc)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100"
                      >
                        <FileText className="w-3.5 h-3.5" /> View Submitted Proof Document
                      </a>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    className="hover:border-red-200 hover:bg-red-50 text-red-600 font-bold"
                    onClick={() => handleOpenRejectModal(owner)}
                  >
                    <X className="w-4 h-4 shrink-0" />
                    Reject Owner
                  </Button>

                  <Button
                    variant="primary"
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                    onClick={() => handleApprove(owner._id)}
                  >
                    <Check className="w-4 h-4 shrink-0" />
                    Approve Owner
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
            <h3 className="text-base font-black text-slate-800">All Owners Verified</h3>
            <p className="text-xs text-slate-400 max-w-xs">
              There are currently no rental owners waiting in the verification queue. Newly registered owners will appear here.
            </p>
          </div>
        )}
      </div>

      {/* Reject Reason Dialog Modal */}
      <Modal
        isOpen={isRejectModalOpen}
        onClose={() => setIsRejectModalOpen(false)}
        title={`Reject verification for ${selectedOwner?.name}`}
        footer={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setIsRejectModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleConfirmReject} className="bg-red-600 hover:bg-red-500 font-bold text-white">
              Confirm Rejection
            </Button>
          </div>
        }
      >
        <form onSubmit={handleConfirmReject} className="flex flex-col gap-4 text-left">
          <p className="text-xs text-slate-500 font-semibold">
            Please enter the reason for rejecting this owner. The owner will see this reason on their portal and can update their documents.
          </p>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Rejection Reason</label>
            <textarea
              required
              placeholder="e.g. Invalid business document uploaded / Missing valid phone number..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full text-xs font-semibold rounded-lg border border-slate-200 focus:border-red-500 focus:ring-1 focus:ring-red-500 p-3 h-24 focus:outline-none placeholder-slate-400 bg-white"
            />
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
};

export default VerifyOwners;
