import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Navbar } from '../../components/Navbar/navbar';
import { Footer } from '../../Footer/footer';
import { Button } from '../../components/Common/Button';
import { Input } from '../../components/Common/Input';
import { Mail, KeyRound, ShieldAlert, CheckCircle2, RefreshCw, ArrowLeft } from 'lucide-react';

export const VerifyOtp = () => {
  const { sendOtp, verifyOtp, resendOtp, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('email'); // 'email' | 'otp'
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [devOtpCode, setDevOtpCode] = useState('');

  useEffect(() => {
    const emailParam = searchParams.get('email') || (user ? user.email : '');
    if (emailParam) {
      setEmail(emailParam);
      setStep('otp');
    }
  }, [searchParams, user]);

  // Resend cooldown timer
  useEffect(() => {
    let interval = null;
    if (resendCooldown > 0) {
      interval = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendCooldown]);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setError('');
    setSuccessMsg('');
    setLoading(true);

    const res = await sendOtp(email.trim());
    setLoading(false);

    if (res.success) {
      setStep('otp');
      setResendCooldown(60);
      if (res.devOtp) setDevOtpCode(res.devOtp);
      setSuccessMsg(res.message || 'Verification code sent to your email.');
    } else {
      setError(res.message || 'Failed to send verification code.');
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp || otp.trim().length !== 6) {
      setError('Please enter the complete 6-digit verification code.');
      return;
    }

    setError('');
    setSuccessMsg('');
    setLoading(true);

    const res = await verifyOtp(email.trim(), otp.trim());
    setLoading(false);

    if (res.success) {
      setSuccessMsg('Email verified successfully! Redirecting...');
      setTimeout(() => {
        if (res.user?.role === 'owner') {
          navigate('/owner');
        } else if (res.user?.role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/dashboard');
        }
      }, 1200);
    } else {
      setError(res.message || 'OTP verification failed.');
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || resendLoading) return;
    setError('');
    setSuccessMsg('');
    setResendLoading(true);

    const res = await resendOtp(email.trim());
    setResendLoading(false);

    if (res.success) {
      setResendCooldown(60);
      if (res.devOtp) setDevOtpCode(res.devOtp);
      setSuccessMsg('A new 6-digit code has been sent to your email.');
    } else {
      setError(res.message || 'Failed to resend verification code.');
    }
  };

  return (
    <div className="flex flex-col min-h-screen text-slate-800 bg-slate-50">
      <Navbar />

      <main className="flex-grow flex items-center justify-center py-16 px-4">
        <div className="w-full max-w-md bg-white rounded-2xl border border-slate-100 shadow-xl p-8 flex flex-col gap-6 text-left">
          
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">
              {step === 'email' ? 'Email Verification' : 'Verify 6-Digit Code'}
            </h1>
            <p className="text-xs font-semibold text-slate-400">
              {step === 'email'
                ? 'Enter your email address to receive a verification code.'
                : `Enter the 6-digit code sent to ${email}`}
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 rounded-xl p-3.5 flex items-center gap-3 text-red-600 text-xs font-semibold">
              <ShieldAlert className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3.5 flex items-center gap-3 text-emerald-600 text-xs font-semibold">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {devOtpCode && (
            <div
              onClick={() => setOtp(devOtpCode)}
              className="bg-amber-100 border border-amber-300 text-amber-900 px-4 py-3 rounded-xl text-center font-black text-lg cursor-pointer hover:bg-amber-200 transition-colors"
            >
              OTP : {devOtpCode}
            </div>
          )}

          {step === 'email' ? (
            <form onSubmit={handleSendOtp} className="flex flex-col gap-4">
              <Input
                label="Email Address"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                icon={Mail}
              />
              <Button type="submit" loading={loading} className="w-full py-3">
                Send Verification Code
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  6-Digit OTP Code
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    maxLength={6}
                    required
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-center text-2xl font-black tracking-[8px] focus:outline-none focus:border-primary focus:bg-white transition-all"
                  />
                </div>
              </div>

              <Button type="submit" loading={loading} className="w-full py-3">
                Verify Code & Sign In
              </Button>

              <div className="flex items-center justify-between text-xs pt-2">
                <button
                  type="button"
                  onClick={() => setStep('email')}
                  className="text-slate-400 hover:text-slate-600 font-semibold flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Change Email
                </button>

                <button
                  type="button"
                  disabled={resendCooldown > 0 || resendLoading}
                  onClick={handleResend}
                  className="text-primary hover:underline font-bold disabled:text-slate-400 flex items-center gap-1"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${resendLoading ? 'animate-spin' : ''}`} />
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
                </button>
              </div>
            </form>
          )}

          <div className="text-center text-xs text-slate-400 border-t border-slate-100 pt-4">
            Already have an account?{' '}
            <Link to="/login" className="text-primary font-bold hover:underline">
              Sign In
            </Link>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
};

export default VerifyOtp;
