import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Navbar } from '../../components/Navbar/navbar';
import { Footer } from '../../Footer/footer';
import { Button } from '../../components/Common/Button';
import { Input } from '../../components/Common/Input';
import { User, Mail, Lock, ShieldAlert, Phone, Building, CheckCircle2 } from 'lucide-react';

export const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('customer');
  
  // Owner specific states
  const [company, setCompany] = useState('');
  const [phone, setPhone] = useState('');

  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Sync role with query param if present
  useEffect(() => {
    const roleParam = searchParams.get('role');
    if (roleParam === 'owner' || roleParam === 'customer') {
      setRole(roleParam);
    }
  }, [searchParams]);

  // Profile Picture optional file state
  const [avatarFile, setAvatarFile] = useState(null);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (role === 'owner' && (!company || !phone)) {
      setError('Company name and Phone number are required for vehicle owners.');
      return;
    }

    setLoading(true);

    let avatarPath = '';
    if (avatarFile) {
      try {
        const formData = new FormData();
        formData.append('image', avatarFile);
        const uploadRes = await apiRequest('/upload', {
          method: 'POST',
          body: formData
        });
        avatarPath = uploadRes.path;
      } catch (err) {
        console.error('Avatar upload failed during registration:', err);
      }
    }

    const res = await register(name, email, password, role, company, phone, avatarPath);
    setLoading(false);

    if (res.success) {
      setSuccessMsg('Registration successful! Redirecting you...');
      
      setTimeout(() => {
        if (role === 'owner') {
          // Redirect to owner dashboard
          navigate('/owner');
        } else {
          navigate('/dashboard');
        }
      }, 1500);
    } else {
      setError(res.message || 'Registration failed. Please check your inputs.');
    }
  };

  return (
    <div className="flex flex-col min-h-screen text-slate-800 bg-slate-50">
      <Navbar />

      <main className="flex-grow flex items-center justify-center py-16 px-4">
        <div className="w-full max-w-md bg-white rounded-2xl border border-slate-100 shadow-xl p-8 flex flex-col gap-6">
          <div className="text-center flex flex-col gap-2">
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Create Account</h2>
            <p className="text-xs font-semibold text-slate-400">Join RideMate to find rides or list your fleet</p>
          </div>

          {/* Role selector Tabs */}
          <div className="flex border-b border-slate-100">
            {['customer', 'owner'].map((roleType) => (
              <button
                key={roleType}
                onClick={() => {
                  if (!successMsg) setRole(roleType);
                }}
                disabled={!!successMsg}
                className={`
                  flex-1 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors cursor-pointer
                  ${role === roleType 
                    ? 'border-primary text-primary' 
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                  }
                  ${successMsg ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                {roleType === 'owner' ? '🔑 Register as Owner' : '👤 Register as Customer'}
              </button>
            ))}
          </div>

          {error && (
            <div className="flex items-center gap-2.5 bg-red-50 border border-red-200 text-red-700 p-3.5 rounded-lg text-xs font-semibold">
              <ShieldAlert className="w-4.5 h-4.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-center gap-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 p-3.5 rounded-lg text-xs font-semibold animate-fade-in-up">
              <CheckCircle2 className="w-4.5 h-4.5 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleRegister} className="flex flex-col gap-4">
            <Input
              label="Full Name"
              type="text"
              placeholder="e.g. John Doe"
              required
              disabled={loading || !!successMsg}
              value={name}
              onChange={(e) => setName(e.target.value)}
              icon={User}
            />

            <Input
              label="Email Address"
              type="email"
              placeholder="e.g. john@example.com"
              required
              disabled={loading || !!successMsg}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={Mail}
            />

            {role === 'owner' && (
              <>
                <Input
                  label="Company Name"
                  type="text"
                  placeholder="e.g. JD Eco Rentals"
                  required
                  disabled={loading || !!successMsg}
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  icon={Building}
                />
                
                <Input
                  label="Phone Number"
                  type="tel"
                  placeholder="e.g. +1 (555) 000-0000"
                  required
                  disabled={loading || !!successMsg}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  icon={Phone}
                />
              </>
            )}

            <div className="flex flex-col gap-1.5 text-left">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Profile Picture / Logo (Optional)
              </label>
              <input
                type="file"
                accept="image/*"
                disabled={loading || !!successMsg}
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setAvatarFile(e.target.files[0]);
                  }
                }}
                className="w-full text-xs font-semibold px-3 py-2 rounded-lg border border-slate-200 bg-slate-50/50 file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-bold file:bg-primary file:text-white hover:file:bg-primary-dark cursor-pointer"
              />
            </div>

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              required
              disabled={loading || !!successMsg}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={Lock}
            />

            <Input
              label="Confirm Password"
              type="password"
              placeholder="••••••••"
              required
              disabled={loading || !!successMsg}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              icon={Lock}
            />

            <Button 
              type="submit" 
              variant="primary" 
              disabled={loading || !!successMsg}
              className="w-full py-3 mt-2 font-bold shadow-md cursor-pointer"
            >
              {loading ? 'Registering Account...' : 'Create Account'}
            </Button>
          </form>

          <p className="text-center text-xs font-semibold text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="text-primary hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Register;
