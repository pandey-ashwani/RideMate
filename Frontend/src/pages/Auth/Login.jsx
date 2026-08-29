import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Navbar } from '../../components/Navbar/navbar';
import { Footer } from '../../Footer/footer';
import { Button } from '../../components/Common/Button';
import { Input } from '../../components/Common/Input';
import { Mail, Lock, ShieldAlert, CheckCircle2, ArrowLeft, KeyRound } from 'lucide-react';

export const Login = () => {
  const { login, forgotPassword, resetPassword, resendOtp } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('customer');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Forgot Password Mode States
  const [isForgotMode, setIsForgotMode] = useState(false);
  const [forgotStep, setForgotStep] = useState('email'); // 'email' | 'reset'
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [devOtpCode, setDevOtpCode] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  React.useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    const res = await login(email, password, role);
    setLoading(false);
    
    if (res.success) {
      setSuccessMsg('Login successful! Redirecting you...');
      
      setTimeout(() => {
        const redirect = searchParams.get('redirect');
        if (redirect === 'book') {
          navigate(-1);
        } else {
          if (role === 'admin') navigate('/admin');
          else if (role === 'owner') navigate('/owner');
          else navigate('/dashboard');
        }
      }, 1200);
    } else {
      setError(res.message || 'Login failed. Please check your credentials.');
    }
  };

  const handleSendResetCode = async (e) => {
    e.preventDefault();
    if (!forgotEmail || !forgotEmail.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    setError('');
    setSuccessMsg('');
    setForgotLoading(true);

    const res = await forgotPassword(forgotEmail.trim());
    setForgotLoading(false);

    if (res.success) {
      if (res.devOtp || res.otp) setDevOtpCode(String(res.devOtp || res.otp));
      setForgotStep('reset');
      setSuccessMsg(res.message || 'Reset code sent to your email.');
    } else {
      setError(res.message || 'Failed to send password reset code.');
    }
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!forgotOtp || forgotOtp.trim().length !== 6) {
      setError('Please enter the 6-digit verification code.');
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }

    setError('');
    setSuccessMsg('');
    setForgotLoading(true);

    const res = await resetPassword(forgotEmail.trim(), forgotOtp.trim(), newPassword);
    setForgotLoading(false);

    if (res.success) {
      setSuccessMsg('Password reset successfully! Please log in with your new password.');
      setEmail(forgotEmail);
      setPassword('');
      setIsForgotMode(false);
      setError('');
    } else {
      setError(res.message || 'Failed to reset password.');
    }
  };

  const handleResendResetCode = async () => {
    if (resendCooldown > 0) return;
    setError('');
    setSuccessMsg('');
    setForgotLoading(true);

    const res = await resendOtp(forgotEmail.trim());
    setForgotLoading(false);

    if (res.success) {
      if (res.devOtp || res.otp) setDevOtpCode(String(res.devOtp || res.otp));
      setSuccessMsg(res.message || 'A new reset code has been sent to your email.');
      setResendCooldown(60);
    } else {
      setError(res.message || 'Failed to resend reset code.');
    }
  };

  return (
    <div className="flex flex-col min-h-screen text-slate-800 bg-slate-50">
      <Navbar />

      <main className="flex-grow flex items-center justify-center py-16 px-4">
        <div className="w-full max-w-md bg-white rounded-2xl border border-slate-100 shadow-xl p-8 flex flex-col gap-6 text-left">
          
          {isForgotMode ? (
            <>
              <div className="text-center flex flex-col gap-2">
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">Reset Password</h2>
                <p className="text-xs font-semibold text-slate-400">
                  {forgotStep === 'email'
                    ? 'Enter your registered email address to receive a 6-digit reset code.'
                    : `Enter the code sent to ${forgotEmail} and your new password.`}
                </p>
              </div>

              {error && (
                <div className="flex items-center gap-2.5 bg-red-50 border border-red-200 text-red-700 p-3.5 rounded-lg text-xs font-semibold">
                  <ShieldAlert className="w-4.5 h-4.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {successMsg && (
                <div className="flex items-center gap-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 p-3.5 rounded-lg text-xs font-semibold">
                  <CheckCircle2 className="w-4.5 h-4.5 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              {devOtpCode && forgotStep === 'reset' && (
                <div
                  onClick={() => setForgotOtp(devOtpCode)}
                  className="bg-amber-100 border border-amber-300 text-amber-900 px-4 py-3 rounded-xl text-center font-black text-lg cursor-pointer hover:bg-amber-200 transition-colors"
                >
                  OTP : {devOtpCode}
                </div>
              )}

              {forgotStep === 'email' ? (
                <form onSubmit={handleSendResetCode} className="flex flex-col gap-4">
                  <Input
                    label="Email Address"
                    type="email"
                    placeholder="e.g. john@example.com"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    icon={Mail}
                  />

                  <Button type="submit" variant="primary" loading={forgotLoading} className="w-full py-3 mt-2 font-bold shadow-md">
                    Send Reset Code
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleResetPasswordSubmit} className="flex flex-col gap-4">
                  <Input
                    label="6-Digit Verification Code"
                    type="text"
                    placeholder="123456"
                    required
                    maxLength={6}
                    value={forgotOtp}
                    onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, ''))}
                    icon={KeyRound}
                  />

                  <Input
                    label="New Password"
                    type="password"
                    placeholder="••••••••"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    icon={Lock}
                  />

                  <Button type="submit" variant="primary" loading={forgotLoading} className="w-full py-3 mt-2 font-bold shadow-md">
                    Reset Password & Save
                  </Button>

                  <button
                    type="button"
                    disabled={resendCooldown > 0 || forgotLoading}
                    onClick={handleResendResetCode}
                    className={`text-xs font-bold self-center transition-colors ${resendCooldown > 0 ? 'text-slate-400 cursor-not-allowed' : 'text-primary hover:underline cursor-pointer'}`}
                  >
                    {resendCooldown > 0 ? `Resend Code in ${resendCooldown}s` : "Didn't receive code? Resend Code"}
                  </button>
                </form>
              )}

              <button
                type="button"
                onClick={() => {
                  setIsForgotMode(false);
                  setError('');
                }}
                className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center justify-center gap-1 mt-2"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Sign In
              </button>
            </>
          ) : (
            <>
              <div className="text-center flex flex-col gap-2">
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">Welcome Back</h2>
                <p className="text-xs font-semibold text-slate-400">Sign in to manage your bookings and rides</p>
              </div>

              {/* Role selector Tabs */}
              <div className="flex border-b border-slate-100">
                {['customer', 'owner', 'admin'].map((roleType) => (
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
                    {roleType}
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
                <div className="flex items-center gap-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 p-3.5 rounded-lg text-xs font-semibold">
                  <CheckCircle2 className="w-4.5 h-4.5 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              <form onSubmit={handleLogin} className="flex flex-col gap-4">
                <Input
                  label="Email Address"
                  type="email"
                  placeholder="e.g. customer@ridemate.com"
                  required
                  disabled={loading || !!successMsg}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  icon={Mail}
                />

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Password</label>
                    <button
                      type="button"
                      onClick={() => {
                        setIsForgotMode(true);
                        setForgotStep('email');
                        setForgotEmail(email);
                        setError('');
                        setSuccessMsg('');
                      }}
                      className="text-xs font-bold text-primary hover:underline"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    required
                    disabled={loading || !!successMsg}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    icon={Lock}
                  />
                </div>

                <Button 
                  type="submit" 
                  variant="primary" 
                  disabled={loading || !!successMsg}
                  className="w-full py-3 mt-2 font-bold shadow-md cursor-pointer"
                >
                  {loading ? 'Signing In...' : 'Sign In'}
                </Button>
              </form>

              <p className="text-center text-xs font-semibold text-slate-500">
                Don't have an account?{' '}
                <Link to={`/register?role=${role}`} className="text-primary hover:underline">
                  Create an account
                </Link>
              </p>
            </>
          )}

        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Login;
