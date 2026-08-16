import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../utils/api';
import { Navbar } from '../../components/Navbar/navbar';
import { Footer } from '../../Footer/footer';
import { Button } from '../../components/Common/Button';
import { Input } from '../../components/Common/Input';
import { Modal } from '../../components/Common/Modal';
import { TermsContent } from '../TermsPage';
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

  // Terms & Privacy agreement states
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [activeTermsTab, setActiveTermsTab] = useState('terms');

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

  // OTP Verification states
  const [showOtpStep, setShowOtpStep] = useState(false);
  const [otpValue, setOtpValue] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpTimer, setOtpTimer] = useState(300); // 5 minutes
  const [resendCooldown, setResendCooldown] = useState(60); // 60s cooldown
  const [registeredUserEmail, setRegisteredUserEmail] = useState('');
  const [registeredUserRole, setRegisteredUserRole] = useState('');

  // Countdown timer for OTP
  useEffect(() => {
    let interval = null;
    if (showOtpStep && otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [showOtpStep, otpTimer]);

  // Resend Cooldown timer
  useEffect(() => {
    let interval = null;
    if (showOtpStep && resendCooldown > 0) {
      interval = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [showOtpStep, resendCooldown]);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!agreedTerms) {
      setError('You must accept the RideMate Terms & Conditions and Privacy Policy to register.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (role === 'owner' && (!company || !phone)) {
      setError('Company name and Mobile number are required for vehicle owners.');
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
      setRegisteredUserEmail(res.user?.email || email);
      setRegisteredUserRole(res.user?.role || role);
      setShowOtpStep(true);
      setSuccessMsg('Account created! Enter the 6-digit OTP sent to your contact details.');
    } else {
      setError(res.message || 'Registration failed. Please check your inputs.');
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!otpValue || otpValue.trim().length !== 6) {
      setError('Please enter the 6-digit verification code.');
      return;
    }

    setOtpLoading(true);
    try {
      await apiRequest('/auth/verify-otp', {
        method: 'POST',
        body: JSON.stringify({
          email: registeredUserEmail || email,
          otp: otpValue.trim()
        })
      });

      setSuccessMsg('OTP verified successfully! Redirecting...');
      setTimeout(() => {
        if ((registeredUserRole || role) === 'owner') {
          navigate('/owner');
        } else {
          navigate('/dashboard');
        }
      }, 1200);
    } catch (err) {
      setError(err.message || 'OTP verification failed.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (resendCooldown > 0) return;
    setError('');
    setSuccessMsg('');
    try {
      await apiRequest('/auth/resend-otp', {
        method: 'POST',
        body: JSON.stringify({ email: registeredUserEmail || email })
      });
      setSuccessMsg('A new 6-digit OTP code has been sent.');
      setResendCooldown(60);
      setOtpTimer(300);
    } catch (err) {
      setError(err.message || 'Failed to resend OTP code.');
    }
  };

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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

          {showOtpStep ? (
            <form onSubmit={handleVerifyOTP} className="flex flex-col gap-5 text-left animate-fade-in-up">
              <div className="p-4 bg-blue-50/80 border border-blue-100 rounded-xl text-center flex flex-col gap-1">
                <h4 className="text-sm font-bold text-primary">Verify Your Account OTP</h4>
                <p className="text-xs text-slate-600">
                  Enter the 6-digit verification code sent to <strong className="text-slate-800">{registeredUserEmail}</strong>.
                </p>
                <div className="text-xs font-black text-primary mt-1">
                  Code expires in: {formatTimer(otpTimer)}
                </div>
              </div>

              <Input
                label="6-Digit Verification Code"
                type="text"
                placeholder="123456"
                required
                maxLength={6}
                value={otpValue}
                onChange={(e) => setOtpValue(e.target.value)}
                icon={Lock}
              />

              <Button
                type="submit"
                variant="primary"
                disabled={otpLoading || otpValue.trim().length !== 6}
                className="w-full py-3 font-bold shadow-md cursor-pointer disabled:opacity-50"
              >
                {otpLoading ? 'Verifying Code...' : 'Verify & Activate Account'}
              </Button>

              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-slate-500 font-medium">Didn't receive code?</span>
                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={resendCooldown > 0}
                  className={`font-bold transition-colors cursor-pointer ${
                    resendCooldown > 0 ? 'text-slate-400 cursor-not-allowed' : 'text-primary hover:underline'
                  }`}
                >
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
                </button>
              </div>
            </form>
          ) : (
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

            {/* Terms & Conditions Agreement Section */}
            <div className="flex flex-col gap-2.5 text-left p-3.5 bg-slate-50 border border-slate-200/70 rounded-xl my-1">
              <p className="text-[11px] font-semibold text-slate-500 leading-relaxed">
                By creating a RideMate account, you agree to the{' '}
                <button
                  type="button"
                  onClick={() => { setActiveTermsTab('terms'); setIsTermsModalOpen(true); }}
                  className="text-primary font-bold hover:underline cursor-pointer"
                >
                  RideMate Terms & Conditions
                </button>{' '}
                and{' '}
                <button
                  type="button"
                  onClick={() => { setActiveTermsTab('privacy'); setIsTermsModalOpen(true); }}
                  className="text-primary font-bold hover:underline cursor-pointer"
                >
                  Privacy Policy
                </button>
                . You confirm that the information provided by you is accurate and that you will use RideMate in accordance with applicable laws and platform rules.
              </p>

              <label className="flex items-center gap-2.5 cursor-pointer mt-0.5 select-none">
                <input
                  type="checkbox"
                  required
                  disabled={loading || !!successMsg}
                  checked={agreedTerms}
                  onChange={(e) => setAgreedTerms(e.target.checked)}
                  className="w-4 h-4 text-primary rounded border-slate-300 focus:ring-primary cursor-pointer shrink-0"
                />
                <span className="text-xs font-bold text-slate-700">
                  I agree to the RideMate Terms & Conditions and Privacy Policy
                </span>
              </label>
            </div>

            <Button 
              type="submit" 
              variant="primary" 
              disabled={loading || !!successMsg || !agreedTerms}
              className="w-full py-3 mt-1 font-bold shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Registering Account...' : 'Create Account'}
            </Button>
          </form>
          )}

          <p className="text-center text-xs font-semibold text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="text-primary hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </main>

      {/* Clean Terms & Conditions Modal Overlay */}
      <Modal
        isOpen={isTermsModalOpen}
        onClose={() => setIsTermsModalOpen(false)}
        title={activeTermsTab === 'terms' ? 'RideMate Terms & Conditions' : 'RideMate Privacy Policy'}
        size="lg"
        footer={
          <Button variant="primary" onClick={() => setIsTermsModalOpen(false)} className="font-bold">
            Close & Continue Registration
          </Button>
        }
      >
        <TermsContent activeTab={activeTermsTab} />
      </Modal>

      <Footer />
    </div>
  );
};

export default Register;
