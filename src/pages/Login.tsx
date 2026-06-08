import { useState, FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, Eye, EyeOff, EyeIcon } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Login() {
  const { login, signup, guestLogin } = useAuth();
  const [isSignup, setIsSignup] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isSignup) {
        await signup(email, password, name);
        toast.success('Account created! You can now sign in.');
        setIsSignup(false);
      } else {
        await login(email, password);
        toast.success('Welcome back!');
      }
    } catch (err: any) {
      toast.error(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-primary-400 to-primary-700 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary-500/30">
            <Shield className="text-white" size={32} />
          </div>
          <h1 className="text-3xl font-bold text-white mb-1">DIX Job Portal</h1>
          <p className="text-white/70">Digital Innovation & Experience</p>
        </div>

        <div className="glass-dark p-8">
          <h2 className="text-xl font-bold text-gray-800 mb-6">{isSignup ? 'Create Account' : 'Sign In'}</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignup && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 bg-white/60 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                  placeholder="Your name" required />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-white/60 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                placeholder="admin@dix.local" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-white/60 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all pr-12"
                  placeholder="Enter password" required minLength={6} />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-primary-500 to-primary-700 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-primary-500/30 transition-all disabled:opacity-50">
              {loading ? 'Please wait...' : isSignup ? 'Create Account' : 'Sign In'}
            </button>
          </form>

          <div className="mt-4 text-center">
            <button onClick={() => setIsSignup(!isSignup)} className="text-sm text-primary-600 hover:text-primary-700">
              {isSignup ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
            </button>
          </div>

          {!isSignup && (
            <div className="mt-4 pt-4 border-t border-gray-200/50">
              <button
                onClick={async () => {
                  setGuestLoading(true);
                  try {
                    const ok = await guestLogin();
                    if (!ok) {
                      toast.error('Guest account not found. Ask admin to create a guest user (guest@dix.local) first.');
                    } else {
                      toast.success('Welcome, Guest! You are in preview mode (read-only).');
                    }
                  } catch {
                    toast.error('Guest login failed');
                  } finally {
                    setGuestLoading(false);
                  }
                }}
                disabled={guestLoading}
                className="w-full py-3 bg-white/60 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-white/80 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <EyeIcon size={18} />
                {guestLoading ? 'Loading...' : 'Guest Preview (Read-Only)'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
