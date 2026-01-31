/**
 * Login Page
 * Clean, robust login with proper error handling
 */
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Loader2, Mail, Lock, Eye, EyeOff, Sparkles, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { signIn, sendPasswordReset } from '@/lib/auth-service';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';

export function LoginPage() {
  const navigate = useNavigate();
  const { isAuthenticated, isInitialized, refreshUser } = useAuthStore();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect if already logged in
  useEffect(() => {
    if (isInitialized && isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isInitialized, isAuthenticated, navigate]);

  // Clear error when inputs change
  useEffect(() => {
    setError(null);
  }, [email, password]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }
    if (!password) {
      setError('Please enter your password');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const result = await signIn(email, password);
      
      if (!result.success) {
        setError(result.error || 'Login failed');
        return;
      }
      
      if (result.needsBusinessSetup) {
        toast.info('Please complete your business setup');
        navigate('/setup', { state: { fromLogin: true } });
      } else {
        await refreshUser();
        toast.success('Welcome back! 🎉');
        navigate('/dashboard', { replace: true });
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!email.trim()) {
      setError('Please enter your email address first');
      return;
    }
    
    setIsLoading(true);
    
    try {
      await sendPasswordReset(email);
      setResetSent(true);
      toast.success('If an account exists, a reset link has been sent!');
    } catch (err: any) {
      // Don't show error for security (don't reveal if email exists)
      setResetSent(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Password reset sent success view
  if (resetSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-emerald-100 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Check Your Email</h1>
          <p className="text-gray-600 mb-6">
            If an account exists for <strong>{email}</strong>, we've sent a password reset link.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Didn't receive the email? Check your spam folder or try again.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => { setResetSent(false); setShowForgotPassword(false); }}
              className="w-full py-3 bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-800 transition-colors"
            >
              Back to Login
            </button>
            <button
              onClick={() => setResetSent(false)}
              className="w-full py-3 text-gray-600 hover:text-gray-900 text-sm"
            >
              Try a different email
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Login Form */}
      <div className="w-full lg:w-[45%] min-h-screen bg-white flex flex-col">
        {/* Header */}
        <div className="p-4 flex items-center justify-between shrink-0">
          <img 
            src="/logo black.png" 
            alt="WarehousePOS" 
            className="h-7 w-auto"
          />
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-500 hidden sm:inline">New here?</span>
            <Link 
              to="/register"
              className="px-4 py-2 bg-gray-900 text-white rounded-full text-sm font-medium hover:bg-gray-800 transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>

        {/* Form Container */}
        <div className="flex-1 flex items-center justify-center px-6 lg:px-12 py-8">
          <div className="w-full max-w-md">
            {/* Header */}
            <div className="mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 rounded-full mb-4">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-medium text-emerald-700">
                  Trusted by 10,000+ businesses
                </span>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {showForgotPassword ? 'Reset Password' : 'Welcome back!'}
              </h1>
              <p className="text-gray-600">
                {showForgotPassword 
                  ? 'Enter your email and we\'ll send you a reset link'
                  : 'Sign in to manage your business'
                }
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={showForgotPassword ? handleForgotPassword : handleLogin} className="space-y-5">
              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-900 mb-2">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                    disabled={isLoading}
                    className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all disabled:bg-gray-50"
                  />
                </div>
              </div>

              {/* Password (hidden in forgot password mode) */}
              {!showForgotPassword && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label htmlFor="password" className="block text-sm font-semibold text-gray-900">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(true)}
                      className="text-sm font-medium text-emerald-600 hover:text-emerald-700"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      autoComplete="current-password"
                      disabled={isLoading}
                      className="w-full pl-12 pr-12 py-3.5 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all disabled:bg-gray-50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-semibold hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {showForgotPassword ? 'Sending...' : 'Signing in...'}
                  </>
                ) : (
                  <>
                    {showForgotPassword ? 'Send Reset Link' : 'Sign In'}
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>

              {/* Back to login button (in forgot password mode) */}
              {showForgotPassword && (
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(false)}
                  className="w-full py-3 text-gray-600 hover:text-gray-900 text-sm font-medium"
                >
                  ← Back to Login
                </button>
              )}
            </form>

            {/* Register Link */}
            {!showForgotPassword && (
              <p className="mt-8 text-center text-gray-600">
                Don't have an account?{' '}
                <Link to="/register" className="font-semibold text-emerald-600 hover:text-emerald-700">
                  Start free trial
                </Link>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Right Side - Decorative (Desktop) */}
      <div className="hidden lg:flex lg:w-[55%] bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 p-12 items-center justify-center">
        <div className="max-w-lg text-center">
          <div className="mb-8">
            <div className="w-24 h-24 mx-auto bg-white/10 backdrop-blur-sm rounded-3xl flex items-center justify-center mb-6">
              <img src="/logo white.png" alt="" className="h-12 w-auto" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">
            Manage Your Business<br />From Anywhere
          </h2>
          <p className="text-emerald-100 text-lg mb-8">
            Track sales, manage inventory, and grow your business with our powerful POS system.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {['Sales Tracking', 'Inventory', 'Reports', 'Multi-Store'].map((feature) => (
              <div
                key={feature}
                className="px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-white text-sm font-medium"
              >
                {feature}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
