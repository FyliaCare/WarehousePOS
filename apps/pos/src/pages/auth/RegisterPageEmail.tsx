import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Loader2, Mail, Lock, Eye, EyeOff, User, Building2, Sparkles, CheckCircle2, ArrowRight, ArrowLeft } from 'lucide-react';
import { signUpWithEmail, setupBusinessProfile } from '@/lib/email-auth';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';
import type { CountryCode } from '@warehousepos/types';

type Step = 'account' | 'business' | 'success';

export function RegisterPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isInitialized, refreshUser } = useAuthStore();
  
  const [step, setStep] = useState<Step>('account');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Account info
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  
  // Business info
  const [businessName, setBusinessName] = useState('');
  const [country, setCountry] = useState<CountryCode>('GH');
  const [phone, setPhone] = useState('');
  
  // User ID from sign up
  const [userId, setUserId] = useState<string | null>(null);

  // Handle redirect from login (user needs profile setup)
  useEffect(() => {
    const state = location.state as { userId?: string } | null;
    if (state?.userId) {
      setUserId(state.userId);
      setStep('business');
    }
  }, [location.state]);

  // Redirect if already logged in with profile
  useEffect(() => {
    if (isInitialized && user) {
      navigate('/dashboard');
    }
  }, [isInitialized, user, navigate]);

  const isGhana = country === 'GH';
  const progress = step === 'account' ? 50 : step === 'business' ? 75 : 100;

  // Handle account creation
  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast.error('Please enter your email');
      return;
    }
    if (!password) {
      toast.error('Please enter a password');
      return;
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (!fullName.trim()) {
      toast.error('Please enter your full name');
      return;
    }
    
    setIsLoading(true);
    try {
      const result = await signUpWithEmail(email, password, fullName);
      
      if (result.success) {
        setUserId(result.user?.id || null);
        
        if (result.needsEmailVerification) {
          toast.success('Account created! Please check your email to verify.');
          // For now, proceed to business setup anyway
          // Email verification can be enforced later
        }
        
        setStep('business');
        toast.success('Account created! Now set up your business.');
      } else {
        toast.error(result.error || 'Failed to create account');
      }
    } catch (error: any) {
      console.error('Sign up error:', error);
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle business setup
  const handleSetupBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!businessName.trim()) {
      toast.error('Please enter your business name');
      return;
    }
    
    if (!userId) {
      toast.error('Session expired. Please sign up again.');
      setStep('account');
      return;
    }
    
    setIsLoading(true);
    try {
      const formattedPhone = phone ? (isGhana ? '+233' : '+234') + phone.replace(/^0+/, '') : undefined;
      
      const result = await setupBusinessProfile({
        userId,
        businessName: businessName.trim(),
        fullName: fullName.trim() || 'Business Owner',
        country,
        phone: formattedPhone,
      });
      
      if (result.success) {
        setStep('success');
        toast.success('Business setup complete! 🎉');
        
        // Refresh user data
        await refreshUser();
        
        // Redirect after a short delay
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      } else {
        toast.error(result.error || 'Failed to set up business');
      }
    } catch (error: any) {
      console.error('Business setup error:', error);
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Form */}
      <div className="w-full lg:w-[45%] min-h-screen bg-white flex flex-col">
        {/* Top Bar */}
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
              className="px-3 py-1.5 bg-gray-900 text-white rounded-full text-sm font-medium hover:bg-gray-800 transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="px-6 lg:px-12">
          <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Form Container */}
        <div className="flex-1 flex items-center justify-center px-6 lg:px-12 py-8">
          <div className="w-full max-w-md">
            
            {/* Step: Account */}
            {step === 'account' && (
              <>
                <div className="mb-6">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 rounded-full mb-3">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-xs font-medium text-emerald-700">Step 1 of 2</span>
                  </div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    Create your account
                  </h1>
                  <p className="text-gray-600">
                    Start your 14-day free trial. No credit card required.
                  </p>
                </div>

                <form onSubmit={handleCreateAccount} className="space-y-4">
                  {/* Full Name */}
                  <div>
                    <label htmlFor="fullName" className="block text-sm font-semibold text-gray-900 mb-1.5">
                      Full name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        id="fullName"
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="John Doe"
                        autoComplete="name"
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 transition-all outline-none text-gray-900 placeholder-gray-400"
                      />
                    </div>
                  </div>

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

                  {/* Password */}
                  <div>
                    <label htmlFor="password" className="block text-sm font-semibold text-gray-900 mb-1.5">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="At least 6 characters"
                        autoComplete="new-password"
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

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold py-3.5 rounded-xl transition-all transform hover:scale-[1.02] hover:shadow-lg hover:shadow-emerald-500/25 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="animate-spin" size={20} />
                        <span>Creating account...</span>
                      </>
                    ) : (
                      <>
                        <span>Continue</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  <p className="text-xs text-center text-gray-500 mt-4">
                    By signing up, you agree to our Terms of Service and Privacy Policy
                  </p>
                </form>
              </>
            )}

            {/* Step: Business */}
            {step === 'business' && (
              <>
                <div className="mb-6">
                  <button
                    onClick={() => setStep('account')}
                    className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </button>
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 rounded-full mb-3">
                    <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-xs font-medium text-emerald-700">Step 2 of 2</span>
                  </div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    Set up your business
                  </h1>
                  <p className="text-gray-600">
                    Tell us about your business to get started
                  </p>
                </div>

                <form onSubmit={handleSetupBusiness} className="space-y-4">
                  {/* Country Selection */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Country
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setCountry('GH')}
                        className={`relative p-3 rounded-xl border-2 transition-all ${
                          country === 'GH'
                            ? 'border-emerald-500 bg-emerald-50 shadow-md'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        {country === 'GH' && (
                          <CheckCircle2 className="absolute -top-1.5 -right-1.5 w-5 h-5 text-emerald-500 bg-white rounded-full" />
                        )}
                        <div className="text-2xl mb-1">🇬🇭</div>
                        <div className="font-bold text-gray-900 text-sm">Ghana</div>
                        <div className="text-xs text-gray-500">GHS (₵)</div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setCountry('NG')}
                        className={`relative p-3 rounded-xl border-2 transition-all ${
                          country === 'NG'
                            ? 'border-emerald-500 bg-emerald-50 shadow-md'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        {country === 'NG' && (
                          <CheckCircle2 className="absolute -top-1.5 -right-1.5 w-5 h-5 text-emerald-500 bg-white rounded-full" />
                        )}
                        <div className="text-2xl mb-1">🇳🇬</div>
                        <div className="font-bold text-gray-900 text-sm">Nigeria</div>
                        <div className="text-xs text-gray-500">NGN (₦)</div>
                      </button>
                    </div>
                  </div>

                  {/* Business Name */}
                  <div>
                    <label htmlFor="businessName" className="block text-sm font-semibold text-gray-900 mb-1.5">
                      Business name
                    </label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        id="businessName"
                        type="text"
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        placeholder="My Awesome Store"
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 transition-all outline-none text-gray-900 placeholder-gray-400"
                      />
                    </div>
                  </div>

                  {/* Phone (Optional) */}
                  <div>
                    <label htmlFor="phone" className="block text-sm font-semibold text-gray-900 mb-1.5">
                      Phone number <span className="font-normal text-gray-400">(optional)</span>
                    </label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-gray-700 font-medium border-r border-gray-200 pr-2 text-sm">
                        <span>{isGhana ? '🇬🇭' : '🇳🇬'}</span>
                        <span>{isGhana ? '+233' : '+234'}</span>
                      </div>
                      <input
                        id="phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                        placeholder={isGhana ? '24 123 4567' : '803 123 4567'}
                        className="w-full pl-28 pr-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 transition-all outline-none text-gray-900 placeholder-gray-400"
                      />
                    </div>
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold py-3.5 rounded-xl transition-all transform hover:scale-[1.02] hover:shadow-lg hover:shadow-emerald-500/25 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="animate-spin" size={20} />
                        <span>Setting up...</span>
                      </>
                    ) : (
                      <>
                        <span>Complete Setup</span>
                        <CheckCircle2 className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              </>
            )}

            {/* Step: Success */}
            {step === 'success' && (
              <div className="text-center">
                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="w-10 h-10 text-emerald-600" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  You're all set! 🎉
                </h1>
                <p className="text-gray-600 mb-6">
                  Your business is ready. Redirecting to your dashboard...
                </p>
                <Loader2 className="w-6 h-6 animate-spin text-emerald-600 mx-auto" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Side - Hero */}
      <div className="hidden lg:flex w-[55%] bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 p-12 items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-64 h-64 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-yellow-400 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 max-w-lg">
          <h2 className="text-4xl font-bold text-white mb-4">
            Start your free trial today
          </h2>
          <p className="text-emerald-100 text-lg mb-8">
            Join thousands of businesses across West Africa using WarehousePOS to grow their sales.
          </p>

          <div className="space-y-4">
            {[
              '14-day free trial',
              'No credit card required',
              'Full access to all features',
              'Cancel anytime',
            ].map((feature, index) => (
              <div key={index} className="flex items-center gap-3 text-white">
                <CheckCircle2 className="w-5 h-5 text-yellow-400" />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
