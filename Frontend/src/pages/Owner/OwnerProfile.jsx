import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { DashboardLayout } from '../../layouts/DashboardLayout';
import { Card } from '../../components/Common/Card';
import { Input } from '../../components/Common/Input';
import { Button } from '../../components/Common/Button';
import { ShieldCheck, User, Mail, Phone, Building } from 'lucide-react';

export const OwnerProfile = () => {
  const { user, updateProfile } = useAuth();
  
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [company, setCompany] = useState(user?.company || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSuccess(false);

    const res = updateProfile({ name, email, avatar, company, phone });
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
          <h1 className="text-2xl font-black text-slate-800 tracking-tight leading-none mb-1">Host Profile Settings</h1>
          <p className="text-xs font-semibold text-slate-400">Configure your business credentials and company contact information</p>
        </div>

        {/* Profile Card Form */}
        <Card className="border border-slate-100 p-6" hoverable={false}>
          {success && (
            <div className="mb-5 flex items-center gap-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 p-3.5 rounded-lg text-xs font-semibold">
              <ShieldCheck className="w-4.5 h-4.5 shrink-0" />
              <span>Profile details updated successfully!</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              label="Avatar / Logo URL"
              value={avatar}
              onChange={(e) => setAvatar(e.target.value)}
              icon={User}
            />

            <Input
              label="Full Name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              icon={User}
            />

            <Input
              label="Company Name"
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

            <Button type="submit" variant="primary" className="py-2.5 font-bold shadow-xs mt-2 w-fit">
              Save Changes
            </Button>
          </form>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default OwnerProfile;
