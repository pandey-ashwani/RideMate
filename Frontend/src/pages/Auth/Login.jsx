import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Navbar } from '../../components/Navbar/navbar';
import { Footer } from '../../Footer/footer';
import { Button } from '../../components/Common/Button';
import { Input } from '../../components/Common/Input';
import { Mail, Lock, ShieldAlert, CheckCircle2 } from 'lucide-react';

export const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('customer'); // Default role
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

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
          navigate(-1); // Go back to vehicle book modal
        } else {
          // Redirect to appropriate dashboard
          if (role === 'admin') navigate('/admin');
          else if (role === 'owner') navigate('/owner');
          else navigate('/dashboard');
        }
      }, 1500);
    } else {
      setError(res.message || 'Login failed. Please check your credentials.');
    }
  };

  return (
    <div className="flex flex-col min-h-screen text-slate-800 bg-slate-50">
      <Navbar />

      <main className="flex-grow flex items-center justify-center py-16 px-4">
        <div className="w-full max-w-md bg-white rounded-2xl border border-slate-100 shadow-xl p-8 flex flex-col gap-6">
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

          {role === 'admin' && (
            <div className="bg-blue-50 border border-blue-200/60 p-3 rounded-lg text-blue-800 text-[11px] font-semibold flex flex-col gap-0.5 text-left">
              <span className="font-extrabold uppercase tracking-wide text-blue-900">Platform Admin Access</span>
              <p>Default Admin: <span className="font-mono bg-blue-100/80 px-1 py-0.5 rounded text-blue-900">admin@ridemate.com</span> | Pass: <span className="font-mono bg-blue-100/80 px-1 py-0.5 rounded text-blue-900">adminpassword123</span></p>
            </div>
          )}

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
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Login;
