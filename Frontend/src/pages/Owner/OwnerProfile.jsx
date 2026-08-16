import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../utils/api';
import { DashboardLayout } from '../../layouts/DashboardLayout';
import { Card } from '../../components/Common/Card';
import { Input } from '../../components/Common/Input';
import { Button } from '../../components/Common/Button';
import { Badge } from '../../components/Common/Badge';
import { ShieldCheck, User, Mail, Phone, Building, Upload, AlertCircle, Clock } from 'lucide-react';

export const OwnerProfile = () => {
  const { user, updateProfile } = useAuth();
  
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [company, setCompany] = useState(user?.company || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [verificationDoc, setVerificationDoc] = useState(user?.verificationDoc || '');
  const [docFile, setDocFile] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess(false);

    let docUrl = verificationDoc;
    let avatarUrl = avatar;

    if (avatarFile) {
      setUploading(true);
      try {
        const formData = new FormData();
        formData.append('image', avatarFile);
        const uploadRes = await apiRequest('/upload', {
          method: 'POST',
          body: formData
        });
        avatarUrl = uploadRes.path;
        setAvatar(avatarUrl);
      } catch (err) {
        console.error('Avatar upload failed:', err);
        alert('Profile picture upload failed.');
      } finally {
        setUploading(false);
      }
    }

    if (docFile) {
      setUploading(true);
      try {
        const formData = new FormData();
        formData.append('image', docFile);
        const uploadRes = await apiRequest('/upload', {
          method: 'POST',
          body: formData
        });
        docUrl = uploadRes.path;
        setVerificationDoc(docUrl);
      } catch (err) {
        console.error('Document upload failed:', err);
        alert('Verification document upload failed.');
      } finally {
        setUploading(false);
      }
    }

    const payload = {
      name,
      email,
      avatar: avatarUrl,
      company,
      phone,
      verificationDoc: docUrl,
      // If user was rejected or pending and submits, request re-review
      resubmitVerification: !user?.isVerified
    };

    const res = await updateProfile(payload);
    if (res.success) {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }
  };

  return (
    <DashboardLayout role="owner">
      <div className="max-w-xl text-left flex flex-col gap-6">
        {/* Title */}
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight leading-none mb-1">Owner Profile & Verification</h1>
          <p className="text-xs font-semibold text-slate-400">Configure your business credentials, company contact information, and verification documents</p>
        </div>

        {/* Verification Status Card */}
        <Card className="border border-slate-100 p-5 bg-white" hoverable={false}>
          <div className="flex items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Current Account Status</span>
              <div className="flex items-center gap-2">
                {user?.isVerified ? (
                  <Badge variant="success" className="px-3 py-1 text-xs">
                    <ShieldCheck className="w-4 h-4" /> Verified Owner
                  </Badge>
                ) : user?.verificationStatus === 'rejected' ? (
                  <Badge variant="danger" className="px-3 py-1 text-xs">
                    <AlertCircle className="w-4 h-4" /> Verification Rejected
                  </Badge>
                ) : (
                  <Badge variant="warning" className="px-3 py-1 text-xs">
                    <Clock className="w-4 h-4" /> Pending Admin Approval
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {user?.verificationStatus === 'rejected' && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 font-semibold">
              <p className="font-extrabold mb-0.5">Rejection Reason:</p>
              <p>{user.rejectionReason || 'Uploaded details did not meet platform requirements.'}</p>
              <p className="text-[11px] text-red-600 font-normal mt-1">
                Please update your company info or upload a valid business/ID document proof below, then click Save to resubmit for Admin review.
              </p>
            </div>
          )}
        </Card>

        {/* Profile Form Card */}
        <Card className="border border-slate-100 p-6" hoverable={false}>
          {success && (
            <div className="mb-5 flex items-center gap-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 p-3.5 rounded-lg text-xs font-semibold">
              <ShieldCheck className="w-4.5 h-4.5 shrink-0" />
              <span>Profile & verification details updated successfully!</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Input
                label="Avatar / Logo URL (or upload photo below)"
                value={avatar}
                onChange={(e) => setAvatar(e.target.value)}
                icon={User}
              />

              <div className="flex flex-col gap-1.5 mt-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Upload Profile Picture / Business Logo (Optional)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setAvatarFile(e.target.files[0]);
                    }
                  }}
                  className="w-full text-xs font-semibold px-3 py-2 rounded-lg border border-slate-200 bg-slate-50/50 file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-bold file:bg-primary file:text-white hover:file:bg-primary-dark cursor-pointer"
                />
              </div>
            </div>

            <Input
              label="Full Name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              icon={User}
            />

            <Input
              label="Company / Rental Business Name"
              required
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              icon={Building}
            />

            <Input
              label="Phone Number"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              icon={Phone}
            />

            <Input
              label="Email Address"
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={Mail}
            />

            <div className="border-t border-slate-100 pt-4 flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Business / Identity Verification Document</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setDocFile(e.target.files[0]);
                  }
                }}
                className="w-full text-xs font-semibold px-3 py-2 rounded-lg border border-slate-200 bg-slate-50/50 file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-bold file:bg-primary file:text-white hover:file:bg-primary-dark cursor-pointer"
              />
              {verificationDoc && (
                <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 mt-1">
                  ✓ Document Uploaded ({verificationDoc})
                </span>
              )}
            </div>

            <Button type="submit" variant="primary" disabled={uploading} className="py-2.5 font-bold shadow-xs mt-2 w-fit">
              {uploading ? 'Uploading Document...' : !user?.isVerified ? 'Save & Resubmit Verification' : 'Save Profile Changes'}
            </Button>
          </form>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default OwnerProfile;
