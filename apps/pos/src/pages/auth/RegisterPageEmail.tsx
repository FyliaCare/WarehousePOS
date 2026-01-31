/**
 * Register Page
 * Clean, multi-step registration with business setup
 */
import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { 
  Loader2, Mail, Lock, Eye, EyeOff, User, Building2, 
  Sparkles, CheckCircle2, ArrowRight, AlertCircle, RefreshCw
} from 'lucide-react';
import { signUp, setupBusiness, getCurrentUser, resendVerificationEmail } from '@/lib/auth-service';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';

type Step = 'account' | 'verify-email' | 'business' | 'success';
type Country = 'GH' | 'NG';

export function RegisterPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, isInitialized, refreshUser } = useAuthStore();
  
  const [step, setStep] = useState<Step>('account');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [resendingEmail, setResendingEmail] = useState(false);
  
  // Account info
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  
  // Business info
  const [businessName, setBusinessName] = useState('');
  const [country, setCountry] = useState<Country>('GH');
  const [phone, setPhone] = useState('');

  // Check if user came from login (needs business setup)
  useEffect(() => {
    const checkExistingUser = async () => {
      const state = location.state as { fromLogin?: boolean } | null;
      
      if (state?.fromLogin) {
        // User signed in but needs business setup
        const { user, needsBusinessSetup } = await getCurrentUser();
        
        if (user && needsBusinessSetup) {
          setFullName(user.fullName || '');
          setStep('business');
        }
      }
    };
    
    checkExistingUser();
  }, [location.state]);

  // Redirect if already logged in with complete profile
  useEffect(() => {
    if (isInitialized && isAuthenticated) {
      // Check if they have business setup
      const checkProfile = async () => {
        const { needsBusinessSetup } = await getCurrentUser();
        if (!needsBusinessSetup) {
          navigate('/dashboard', { replace: true });
        } else {
          setStep('business');
        }
      };
      checkProfile();
    }
  }, [isInitialized, isAuthenticated, navigate]);

  // Clear error when inputs change
  useEffect(() => {
    setError(null);
  }, [email, password, fullName, businessName, phone]);

  const progress = step === 'account' ? 33 : step === 'verify-email' ? 50 : step === 'business' ? 75 : 100;

  // Handle account creation
  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!fullName.trim()) {
      setError('Please enter your full name');
      return;
    }
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }
    if (!password) {
      setError('Please create a password');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const result = await signUp(email, password, fullName);
      
      if (!result.success) {
        setError(result.error || 'Failed to create account');
        return;
      }
      
      // Check if email verification is required
      if (result.needsEmailVerification) {
        toast.success('Account created! Please check your email to verify.');
        setStep('verify-email');
      } else {
        // Email verification not required (disabled in Supabase)
        toast.success('Account created! Now set up your business.');
        setStep('business');
      }
    } catch (err: any) {
      console.error('Signup error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle resend verification email
  const handleResendVerification = async () => {
    if (resendingEmail) return;
    
    setResendingEmail(true);
    try {
      const result = await resendVerificationEmail(email);
      if (result.success) {
        toast.success('Verification email sent! Check your inbox.');
      } else {
        toast.error(result.error || 'Failed to resend email');
      }
    } catch (err) {
      toast.error('Failed to resend verification email');
    } finally {
      setResendingEmail(false);
    }
  };

  // Handle business setup
  const handleSetupBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!businessName.trim()) {
      setError('Please enter your business name');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const result = await setupBusiness({
        businessName: businessName.trim(),
        fullName: fullName.trim() || 'Business Owner',
        country,
        phone: phone.trim() || undefined,
      });
      
      if (!result.success) {
        setError(result.error || 'Failed to set up business');
        return;
      }
      
      setStep('success');
      toast.success('Business setup complete! 🎉');
      
      // Refresh user data and redirect
      await refreshUser();
      
      setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 2000);
    } catch (err: any) {
      console.error('Business setup error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Success view
  if (step === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 text-center">
          <div className="w-20 h-20 mx-auto mb-6 bg-emerald-100 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">You're All Set! 🎉</h1>
          <p className="text-gray-600 mb-6">
            Your business <strong>{businessName}</strong> is ready to go.
          </p>
          <div className="animate-pulse text-sm text-gray-500">
            Redirecting to dashboard...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Form */}
      <div className="w-full lg:w-[45%] min-h-screen bg-white flex flex-col">
        {/* Header */}
        <div className="p-4 flex items-center justify-between shrink-0">
          <img 
            src="/logo black.png" 
            alt="WarehousePOS" 
            className="h-7 w-auto"
          />
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-500 hidden sm:inline">Already have an account?</span>
            <Link 
              to="/login"
              className="px-4 py-2 bg-gray-900 text-white rounded-full text-sm font-medium hover:bg-gray-800 transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="px-6 lg:px-12">
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Form Container */}
        <div className="flex-1 flex items-center justify-center px-6 lg:px-12 py-8">
          <div className="w-full max-w-md">
            
            {/* STEP 1: Account */}
            {step === 'account' && (
              <>
                <div className="mb-8">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 rounded-full mb-4">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-medium text-emerald-700">Step 1 of 3</span>
                  </div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    Create your account
                  </h1>
                  <p className="text-gray-600">
                    Start your 14-day free trial. No credit card required.
                  </p>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="mb-4 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}

                <form onSubmit={handleCreateAccount} className="space-y-5">
                  {/* Full Name */}
                  <div>
                    <label htmlFor="fullName" className="block text-sm font-semibold text-gray-900 mb-2">
                      Full name
                    </label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        id="fullName"
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="John Doe"
                        autoComplete="name"
                        disabled={isLoading}
                        className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all disabled:bg-gray-50"
                      />
                    </div>
                  </div>

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

                  {/* Password */}
                  <div>
                    <label htmlFor="password" className="block text-sm font-semibold text-gray-900 mb-2">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Create a strong password"
                        autoComplete="new-password"
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
                    <p className="mt-2 text-xs text-gray-500">
                      Must be at least 6 characters
                    </p>
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-semibold hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Creating account...
                      </>
                    ) : (
                      <>
                        Continue
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </form>

                <p className="mt-6 text-center text-sm text-gray-500">
                  By signing up, you agree to our{' '}
                  <a href="#" className="text-emerald-600 hover:underline">Terms</a>
                  {' '}and{' '}
                  <a href="#" className="text-emerald-600 hover:underline">Privacy Policy</a>
                </p>
              </>
            )}

            {/* STEP 2: Email Verification */}
            {step === 'verify-email' && (
              <>
                <div className="mb-8 text-center">
                  <div className="w-20 h-20 mx-auto mb-6 bg-emerald-100 rounded-full flex items-center justify-center">
                    <Mail className="w-10 h-10 text-emerald-600" />
                  </div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 rounded-full mb-4">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-medium text-emerald-700">Step 2 of 3</span>
                  </div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    Check your email
                  </h1>
                  <p className="text-gray-600">
                    We sent a verification link to:
                  </p>
                  <p className="font-semibold text-gray-900 mt-1">{email}</p>
                </div>

                <div className="bg-emerald-50 rounded-xl p-4 mb-6">
                  <h3 className="font-semibold text-gray-900 mb-2">What to do:</h3>
                  <ol className="text-sm text-gray-700 space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="w-5 h-5 bg-emerald-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">1</span>
                      Check your inbox for an email from WarehousePOS
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-5 h-5 bg-emerald-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">2</span>
                      Click the verification link in the email
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-5 h-5 bg-emerald-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">3</span>
                      Complete your business setup
                    </li>
                  </ol>
                </div>

                <div className="text-center space-y-4">
                  <p className="text-sm text-gray-500">
                    Didn't receive the email?
                  </p>
                  <button
                    onClick={handleResendVerification}
                    disabled={resendingEmail}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 disabled:opacity-50 transition-colors"
                  >
                    {resendingEmail ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4" />
                        Resend verification email
                      </>
                    )}
                  </button>

                  <div className="pt-4 border-t border-gray-200">
                    <button
                      onClick={() => {
                        setStep('account');
                        setEmail('');
                        setPassword('');
                        setFullName('');
                      }}
                      className="text-sm text-gray-600 hover:text-gray-900"
                    >
                      Use a different email address
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* STEP 3: Business Setup */}
            {step === 'business' && (
              <>
                <div className="mb-8">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 rounded-full mb-4">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-medium text-emerald-700">Step 3 of 3</span>
                  </div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    Set up your business
                  </h1>
                  <p className="text-gray-600">
                    Tell us about your business to get started
                  </p>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="mb-4 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}

                <form onSubmit={handleSetupBusiness} className="space-y-5">
                  {/* Business Name */}
                  <div>
                    <label htmlFor="businessName" className="block text-sm font-semibold text-gray-900 mb-2">
                      Business name
                    </label>
                    <div className="relative">
                      <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        id="businessName"
                        type="text"
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        placeholder="My Awesome Store"
                        disabled={isLoading}
                        className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all disabled:bg-gray-50"
                      />
                    </div>
                  </div>

                  {/* Country Selection */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Country
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { code: 'GH' as Country, name: 'Ghana', flag: '🇬🇭', currency: 'GHS' },
                        { code: 'NG' as Country, name: 'Nigeria', flag: '🇳🇬', currency: 'NGN' },
                      ].map((c) => (
                        <button
                          key={c.code}
                          type="button"
                          onClick={() => setCountry(c.code)}
                          className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                            country === c.code
                              ? 'border-emerald-500 bg-emerald-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <span className="text-2xl">{c.flag}</span>
                          <div className="text-left">
                            <p className="font-semibold text-gray-900">{c.name}</p>
                            <p className="text-xs text-gray-500">{c.currency}</p>
                          </div>
                          {country === c.code && (
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 ml-auto" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Phone (Optional) */}
                  <div>
                    <label htmlFor="phone" className="block text-sm font-semibold text-gray-900 mb-2">
                      Phone number <span className="font-normal text-gray-400">(optional)</span>
                    </label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-1 text-gray-500">
                        <span className="text-sm">{country === 'GH' ? '🇬🇭 +233' : '🇳🇬 +234'}</span>
                      </div>
                      <input
                        id="phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                        placeholder={country === 'GH' ? '24 123 4567' : '801 234 5678'}
                        disabled={isLoading}
                        className="w-full pl-24 pr-4 py-3.5 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all disabled:bg-gray-50"
                      />
                    </div>
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-semibold hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Setting up...
                      </>
                    ) : (
                      <>
                        Launch My Business
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </form>
              </>
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
            Start Your Business<br />Journey Today
          </h2>
          <p className="text-emerald-100 text-lg mb-8">
            Join thousands of businesses using WarehousePOS to track sales and grow revenue.
          </p>
          <div className="space-y-4 text-left max-w-sm mx-auto">
            {[
              { icon: CheckCircle2, text: '14-day free trial' },
              { icon: CheckCircle2, text: 'No credit card required' },
              { icon: CheckCircle2, text: 'Cancel anytime' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 text-white">
                <item.icon className="w-5 h-5 text-emerald-300" />
                <span>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;
