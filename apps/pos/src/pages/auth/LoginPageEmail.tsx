import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Loader2, Mail, Lock, Eye, EyeOff, Sparkles, TrendingUp, Users, ShoppingBag, ArrowRight, CheckCircle2 } from 'lucide-react';
import { signInWithEmail, sendPasswordReset } from '@/lib/email-auth-simple';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';

export function LoginPage() {
  const navigate = useNavigate();
  const { user, isInitialized, refreshUser } = useAuthStore();
  
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Redirect if already logged in
  useEffect(() => {
    if (isInitialized && user) {
      navigate('/dashboard');
    }
  }, [isInitialized, user, navigate]);

  // Handle login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast.error('Please enter your email');
      return;
    }
    if (!password) {
      toast.error('Please enter your password');
      return;
    }
    
    setIsLoading(true);
    try {
      const result = await signInWithEmail(email, password);
      
      if (result.success) {
        if (result.needsProfileSetup) {
          toast.info('Please complete your business setup');
          navigate('/setup', { state: { userId: result.user?.id } });
        } else {
          await refreshUser();
          toast.success('Welcome back! 🎉');
          navigate('/dashboard');
        }
      } else {
        toast.error(result.error || 'Login failed');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle forgot password
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast.error('Please enter your email first');
      return;
    }
    
    setIsLoading(true);
    try {
      const result = await sendPasswordReset(email);
      
      if (result.success) {
        toast.success('Password reset link sent! Check your email.');
        setShowForgotPassword(false);
      } else {
        toast.error(result.error || 'Failed to send reset link');
      }
    } catch (error: any) {
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Feature highlights
  const features = [
    { icon: ShoppingBag, text: "Track Sales & Inventory" },
    { icon: Users, text: "Manage Customers" },
    { icon: TrendingUp, text: "Grow Your Business" },
  ];

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Login Form */}
      <div className="w-full lg:w-[45%] min-h-screen bg-white flex flex-col">
        {/* Top Bar */}
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
              className="px-3 py-1.5 bg-gray-900 text-white rounded-full text-sm font-medium hover:bg-gray-800 transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>

        {/* Form Container */}
        <div className="flex-1 flex items-center justify-center px-6 lg:px-12 py-8">
          <div className="w-full max-w-md">
            {/* Header */}
            <div className="mb-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 rounded-full mb-3">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-xs font-medium text-emerald-700">Trusted by 10,000+ businesses</span>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Welcome back!
              </h1>
              <p className="text-gray-600">
                Sign in to manage your business
              </p>
            </div>

            {/* Login Form */}
            <form onSubmit={showForgotPassword ? handleForgotPassword : handleLogin} className="space-y-4">
              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-900 mb-1.5">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 transition-all outline-none text-gray-900 placeholder-gray-400"
                  />
                </div>
              </div>

              {/* Password (hidden during forgot password) */}
              {!showForgotPassword && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="password" className="block text-sm font-semibold text-gray-900">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(true)}
                      className="text-xs font-medium text-emerald-600 hover:text-emerald-700"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      className="w-full pl-10 pr-12 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 transition-all outline-none text-gray-900 placeholder-gray-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              )}

              {/* Back to login link (during forgot password) */}
              {showForgotPassword && (
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(false)}
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  ← Back to login
                </button>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold py-3.5 rounded-xl transition-all transform hover:scale-[1.02] hover:shadow-lg hover:shadow-emerald-500/25 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    <span>Please wait...</span>
                  </>
                ) : showForgotPassword ? (
                  <>
                    <span>Send Reset Link</span>
                    <Mail className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">New to WarehousePOS?</span>
                </div>
              </div>

              {/* Sign Up Link */}
              <Link
                to="/register"
                className="w-full flex items-center justify-center gap-2 py-3.5 border-2 border-gray-200 rounded-xl font-semibold text-gray-700 hover:border-emerald-500 hover:text-emerald-600 transition-all"
              >
                Create an account
                <ArrowRight className="w-4 h-4" />
              </Link>
            </form>
          </div>
        </div>
      </div>

      {/* Right Side - Hero Image/Features */}
      <div className="hidden lg:flex w-[55%] bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 p-12 items-center justify-center relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-64 h-64 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-yellow-400 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 max-w-lg">
          {/* Main Content */}
          <div className="mb-8">
            <h2 className="text-4xl font-bold text-white mb-4">
              Run your business smarter
            </h2>
            <p className="text-emerald-100 text-lg">
              The all-in-one POS solution for West African businesses. Simple, powerful, and built for you.
            </p>
          </div>

          {/* Feature List */}
          <div className="space-y-4">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center gap-3 text-white">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                  <feature.icon className="w-5 h-5" />
                </div>
                <span className="font-medium">{feature.text}</span>
              </div>
            ))}
          </div>

          {/* Testimonial */}
          <div className="mt-10 p-6 bg-white/10 rounded-2xl backdrop-blur-sm">
            <div className="flex items-center gap-1 mb-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <CheckCircle2 key={star} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
              ))}
            </div>
            <p className="text-white italic mb-3">
              "WarehousePOS transformed how we manage our inventory. Sales are up 40% since we started using it!"
            </p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-bold">
                KA
              </div>
              <div>
                <div className="font-semibold text-white">Kwame Asante</div>
                <div className="text-sm text-emerald-200">Store Owner, Accra</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
