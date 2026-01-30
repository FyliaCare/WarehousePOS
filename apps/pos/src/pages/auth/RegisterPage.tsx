import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Loader2, ArrowLeft, TrendingUp, Users, ShoppingBag, Zap, CheckCircle2, Star, Building2, UserCircle2, Mail, Phone, Rocket, RefreshCw } from 'lucide-react';
import { sendOTP, verifyOTP, createUserProfile, formatPhone } from '@/lib/supabase-auth';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';
import type { CountryCode } from '@warehousepos/types';

type Step = 'country' | 'phone' | 'otp' | 'details' | 'success';

export function RegisterPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isInitialized, refreshUser } = useAuthStore();
  
  const [step, setStep] = useState<Step>('country');
  const [isLoading, setIsLoading] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  
  // Form data
  const [country, setCountry] = useState<CountryCode>('GH');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  
  // Temp auth user ID (before profile is created)
  const [tempAuthUserId, setTempAuthUserId] = useState<string | null>(null);
  
  // Dev OTP for testing
  const [devOTP, setDevOTP] = useState<string | null>(null);
  
  const steps: Step[] = ['country', 'phone', 'otp', 'details'];
  const currentStepIndex = steps.indexOf(step);
  const progress = step === 'success' ? 100 : ((currentStepIndex + 1) / steps.length) * 100;
  
  const isGhana = country === 'GH';

  // Handle redirect from login (user verified but needs profile)
  useEffect(() => {
    const state = location.state as { phone?: string; country?: CountryCode; userId?: string } | null;
    if (state?.userId) {
      setTempAuthUserId(state.userId);
      if (state.phone) setPhone(state.phone);
      if (state.country) setCountry(state.country);
      setStep('details'); // Skip to details step
    }
  }, [location.state]);

  // Redirect if already fully logged in (has profile)
  useEffect(() => {
    if (isInitialized && user) {
      navigate('/dashboard');
    }
  }, [isInitialized, user, navigate]);

  // Countdown timer for resend OTP
  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCountdown]);

  const handleSendOTP = async () => {
    if (!phone.trim()) {
      toast.error('Please enter your phone number');
      return;
    }
    
    setIsLoading(true);
    try {
      const result = await sendOTP(phone, country, 'registration');
      
      if (result.success) {
        toast.success('OTP sent to your phone! 📱');
        setResendCountdown(60);
        if (result.devOTP) {
          setDevOTP(result.devOTP);
        }
        setStep('otp');
      } else {
        toast.error(result.error || 'Failed to send OTP');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to send OTP');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      toast.error('Please enter the 6-digit OTP');
      return;
    }
    
    setIsLoading(true);
    try {
      console.log('Verifying OTP for registration...');
      const result = await verifyOTP(phone, country, otp, 'registration');
      console.log('Verify OTP result:', result);
      
      if (result.success) {
        toast.success('Phone verified! ✅');
        // Get user ID from result or from session
        const userId = result.user?.id;
        if (userId) {
          setTempAuthUserId(userId);
        }
        setStep('details');
        setIsLoading(false);
      } else {
        toast.error(result.error || 'Invalid OTP');
        setIsLoading(false);
      }
    } catch (error: any) {
      console.error('Verify OTP exception:', error);
      toast.error(error.message || 'Failed to verify OTP');
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (resendCountdown > 0) return;
    
    setIsLoading(true);
    try {
      const result = await sendOTP(phone, country, 'registration');
      
      if (result.success) {
        setResendCountdown(60);
        if (result.devOTP) {
          setDevOTP(result.devOTP);
        }
        toast.success('New OTP sent! 📱');
      } else {
        toast.error(result.error || 'Failed to resend OTP');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to resend OTP');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleRegister = async () => {
    if (!businessName.trim()) {
      toast.error('Please enter your business name');
      return;
    }
    if (!fullName.trim()) {
      toast.error('Please enter your full name');
      return;
    }
    if (!tempAuthUserId) {
      toast.error('Session expired. Please start over.');
      setStep('phone');
      return;
    }
    
    console.log('Creating user profile...', { tempAuthUserId, businessName, fullName, phone, country });
    setIsLoading(true);
    try {
      const result = await createUserProfile({
        userId: tempAuthUserId,
        phone,
        country,
        businessName: businessName.trim(),
        fullName: fullName.trim(),
        email: email.trim() || undefined,
      });
      
      console.log('Create profile result:', result);
      
      if (result.success) {
        setStep('success');
        toast.success('Account created successfully! 🎉');
        
        // Refresh user data and redirect
        await refreshUser();
        
        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      } else {
        toast.error(result.error || 'Registration failed');
      }
    } catch (error: any) {
      toast.error(error.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (step === 'phone') handleSendOTP();
      else if (step === 'otp') handleVerifyOTP();
      else if (step === 'details') handleRegister();
    }
  };

  const goBack = () => {
    if (step === 'phone') setStep('country');
    else if (step === 'otp') setStep('phone');
    else if (step === 'details') setStep('otp');
  };

  // Feature highlights
  const features = [
    { icon: ShoppingBag, text: "Manage Inventory" },
    { icon: Users, text: "Track Customers" },
    { icon: TrendingUp, text: "Grow Sales" },
  ];

  // Stats for social proof
  const stats = [
    { value: "10K+", label: "Active Vendors" },
    { value: "₵2M+", label: "Daily Transactions" },
    { value: "99.9%", label: "Uptime" },
  ];

  // Step titles
  const stepTitles: Record<Step, { title: string; subtitle: string }> = {
    country: {
      title: "Let's get started!",
      subtitle: "Select your country to begin"
    },
    phone: {
      title: "Your phone number",
      subtitle: "We'll send you a verification code"
    },
    otp: {
      title: "Verify your phone",
      subtitle: `Enter the 6-digit code sent to ${formatPhone(phone, country)}`
    },
    details: {
      title: "Almost there!",
      subtitle: "Tell us about your business"
    },
    success: {
      title: "Welcome aboard! 🎉",
      subtitle: "Your account has been created"
    }
  };

  return (
    <div className="h-screen flex overflow-hidden">
      {/* Left Side - Registration Form */}
      <div className="w-full lg:w-[45%] h-screen bg-white flex flex-col overflow-y-auto">
        {/* Top Bar */}
        <div className="p-4 flex items-center justify-between shrink-0">
          <img 
            src="/logo black.png" 
            alt="WarehousePOS" 
            className="h-7 w-auto"
          />
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-500 hidden sm:inline">Already have an account?</span>
            <button 
              onClick={() => navigate('/login')}
              className="px-3 py-1.5 bg-gray-900 text-white rounded-full text-sm font-medium hover:bg-gray-800 transition-colors"
            >
              Sign In
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        {step !== 'success' && (
          <div className="px-6 lg:px-12 shrink-0">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-500">Step {currentStepIndex + 1} of {steps.length}</span>
              <span className="text-xs font-medium text-emerald-600">{Math.round(progress)}%</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Form Container */}
        <div className="flex-1 flex items-center justify-center px-6 lg:px-12 py-4">
          <div className="w-full max-w-md">
            {/* Back Button */}
            {step !== 'country' && step !== 'success' && (
              <button
                onClick={goBack}
                className="flex items-center gap-1.5 text-gray-500 hover:text-gray-900 text-sm font-medium mb-4 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
            )}

            {/* Header */}
            <div className="mb-5">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 rounded-full mb-3">
                <Rocket className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-xs font-medium text-emerald-700">Free to start, no credit card</span>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {stepTitles[step].title}
              </h1>
              <p className="text-gray-600">
                {stepTitles[step].subtitle}
              </p>
            </div>

            {/* Form Steps */}
            <div className="space-y-4">
              {/* Step: Country */}
              {step === 'country' && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Select your country
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setCountry('GH')}
                        className={`relative p-3 rounded-xl border-2 transition-all group ${
                          country === 'GH'
                            ? 'border-emerald-500 bg-gradient-to-br from-emerald-50 to-teal-50 shadow-md shadow-emerald-500/20'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        {country === 'GH' && (
                          <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                            <CheckCircle2 className="w-3 h-3 text-white" />
                          </div>
                        )}
                        <div className="text-2xl mb-1">🇬🇭</div>
                        <div className="font-bold text-gray-900 text-sm">Ghana</div>
                        <div className="text-xs text-gray-500">GHS (₵)</div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setCountry('NG')}
                        className={`relative p-3 rounded-xl border-2 transition-all group ${
                          country === 'NG'
                            ? 'border-emerald-500 bg-gradient-to-br from-emerald-50 to-teal-50 shadow-md shadow-emerald-500/20'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        {country === 'NG' && (
                          <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                            <CheckCircle2 className="w-3 h-3 text-white" />
                          </div>
                        )}
                        <div className="text-2xl mb-1">🇳🇬</div>
                        <div className="font-bold text-gray-900 text-sm">Nigeria</div>
                        <div className="text-xs text-gray-500">NGN (₦)</div>
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={() => setStep('phone')}
                    className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold py-3.5 rounded-xl transition-all transform hover:scale-[1.02] hover:shadow-lg hover:shadow-emerald-500/25 active:scale-[0.98] flex items-center justify-center gap-2"
                  >
                    <span>Continue</span>
                    <Zap className="w-4 h-4" />
                  </button>
                </>
              )}

              {/* Step: Phone */}
              {step === 'phone' && (
                <>
                  <div>
                    <label htmlFor="phone" className="block text-sm font-semibold text-gray-900 mb-1.5">
                      Phone number
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
                        onKeyPress={handleKeyPress}
                        placeholder={isGhana ? '24 123 4567' : '803 123 4567'}
                        autoComplete="tel-national"
                        className="w-full pl-28 pr-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 transition-all outline-none text-gray-900 placeholder-gray-400"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleSendOTP}
                    disabled={isLoading || !phone.trim()}
                    className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold py-3.5 rounded-xl transition-all transform hover:scale-[1.02] hover:shadow-lg hover:shadow-emerald-500/25 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="animate-spin" size={20} />
                        <span>Sending code...</span>
                      </>
                    ) : (
                      <>
                        <span>Send Verification Code</span>
                        <Phone className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </>
              )}

              {/* Step: OTP */}
              {step === 'otp' && (
                <>
                  <div>
                    <label htmlFor="otp" className="block text-sm font-semibold text-gray-900 mb-1.5">
                      Verification code
                    </label>
                    
                    {/* Development OTP Display */}
                    {devOTP && (
                      <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <p className="text-xs text-amber-600 font-medium">Development Mode</p>
                        <p className="text-lg font-mono font-bold text-amber-800 tracking-widest">{devOTP}</p>
                      </div>
                    )}
                    
                    <input
                      id="otp"
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      onKeyPress={handleKeyPress}
                      placeholder="000000"
                      maxLength={6}
                      autoFocus
                      autoComplete="one-time-code"
                      className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 transition-all outline-none text-gray-900 text-xl text-center tracking-[0.75em] placeholder-gray-300"
                    />
                  </div>

                  <button
                    onClick={handleVerifyOTP}
                    disabled={isLoading || otp.length !== 6}
                    className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold py-3.5 rounded-xl transition-all transform hover:scale-[1.02] hover:shadow-lg hover:shadow-emerald-500/25 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="animate-spin" size={20} />
                        <span>Verifying...</span>
                      </>
                    ) : (
                      <>
                        <span>Verify Code</span>
                        <CheckCircle2 className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  {/* Resend OTP */}
                  <div className="text-center">
                    {resendCountdown > 0 ? (
                      <p className="text-sm text-gray-500">
                        Resend code in <span className="font-semibold text-emerald-600">{resendCountdown}s</span>
                      </p>
                    ) : (
                      <button
                        onClick={handleResendOTP}
                        disabled={isLoading}
                        className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1.5 mx-auto"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Resend code
                      </button>
                    )}
                  </div>
                </>
              )}

              {/* Step: Details */}
              {step === 'details' && (
                <>
                  <div>
                    <label htmlFor="businessName" className="block text-sm font-semibold text-gray-900 mb-1.5">
                      Business name
                    </label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <input
                        id="businessName"
                        type="text"
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder={isGhana ? "e.g., Kwame's Electronics" : "e.g., Ade's Superstore"}
                        autoComplete="organization"
                        className="w-full pl-11 pr-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 transition-all outline-none text-gray-900 placeholder-gray-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="fullName" className="block text-sm font-semibold text-gray-900 mb-1.5">
                      Your full name
                    </label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                        <UserCircle2 className="w-5 h-5" />
                      </div>
                      <input
                        id="fullName"
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder={isGhana ? "e.g., Kwame Mensah" : "e.g., Adewale Johnson"}
                        autoComplete="name"
                        className="w-full pl-11 pr-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 transition-all outline-none text-gray-900 placeholder-gray-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-semibold text-gray-900 mb-1.5">
                      Email <span className="text-gray-400 font-normal">(optional)</span>
                    </label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                        <Mail className="w-5 h-5" />
                      </div>
                      <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="your@email.com"
                        autoComplete="email"
                        className="w-full pl-11 pr-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 transition-all outline-none text-gray-900 placeholder-gray-400"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleRegister}
                    disabled={isLoading || !businessName.trim() || !fullName.trim()}
                    className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold py-3.5 rounded-xl transition-all transform hover:scale-[1.02] hover:shadow-lg hover:shadow-emerald-500/25 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="animate-spin" size={20} />
                        <span>Creating account...</span>
                      </>
                    ) : (
                      <>
                        <span>Create Account</span>
                        <Rocket className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  <p className="text-center text-xs text-gray-500">
                    By creating an account, you agree to our{' '}
                    <Link to="/terms" className="text-emerald-600 hover:underline">Terms</Link>
                    {' '}and{' '}
                    <Link to="/privacy" className="text-emerald-600 hover:underline">Privacy Policy</Link>
                  </p>
                </>
              )}

              {/* Step: Success */}
              {step === 'success' && (
                <div className="text-center py-8">
                  <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/30">
                    <CheckCircle2 className="w-10 h-10 text-white" />
                  </div>
                  
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome aboard! 🎉</h2>
                  <p className="text-gray-600 mb-6">
                    Your account has been created successfully.
                    <br />
                    Redirecting to login...
                  </p>
                  
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-emerald-500" />
                </div>
              )}
            </div>

            {/* Features Strip */}
            {step === 'country' && (
              <div className="mt-6 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between gap-2">
                  {features.map((feature, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-gray-500">
                      <feature.icon className="w-3.5 h-3.5" />
                      <span className="text-xs font-medium hidden sm:inline">{feature.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 text-center text-xs text-gray-400 shrink-0">
          ©{new Date().getFullYear()} WarehousePOS • Built with 💚 for Africa
        </div>
      </div>

      {/* Right Side - Hero Visual */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          {/* Gradient Orbs */}
          <div className="absolute top-10 right-10 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 left-10 w-60 h-60 bg-cyan-400/20 rounded-full blur-3xl animate-pulse"></div>
          
          {/* Grid Pattern */}
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)',
            backgroundSize: '40px 40px'
          }}></div>
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full p-6 xl:p-8 w-full">
          {/* Top Section */}
          <div className="shrink-0">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-md rounded-full border border-white/20">
              <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
              <span className="text-white/90 text-xs font-medium">Join 10,000+ African Entrepreneurs</span>
            </div>
          </div>

          {/* Center - Main Visual */}
          <div className="flex-1 flex items-center justify-center py-4">
            <div className="relative">
              {/* Floating Cards - positioned outside phone with higher z-index */}
              <div className="absolute -left-4 xl:-left-16 top-4 z-20 bg-white rounded-xl shadow-2xl p-3 transform -rotate-6 hover:rotate-0 transition-transform duration-500 animate-float">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500">Today's Sales</p>
                    <p className="text-sm font-bold text-gray-900">₵12,450</p>
                  </div>
                </div>
              </div>

              <div className="absolute -right-4 xl:-right-12 top-8 z-20 bg-white rounded-xl shadow-2xl p-3 transform rotate-6 hover:rotate-0 transition-transform duration-500 animate-float" style={{ animationDelay: '0.3s' }}>
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-gradient-to-br from-violet-400 to-purple-500 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500">New Customers</p>
                    <p className="text-sm font-bold text-gray-900">+24</p>
                  </div>
                </div>
              </div>

              <div className="absolute -left-2 xl:-left-12 bottom-16 z-20 bg-white rounded-xl shadow-2xl p-3 transform rotate-3 hover:rotate-0 transition-transform duration-500 animate-float" style={{ animationDelay: '0.7s' }}>
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center">
                    <ShoppingBag className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500">Orders Today</p>
                    <p className="text-sm font-bold text-gray-900">156</p>
                  </div>
                </div>
              </div>

              {/* Main Phone Mockup */}
              <div className="relative z-10">
                <div className="w-[240px] xl:w-[280px] h-[480px] xl:h-[540px] bg-gray-900 rounded-[2.5rem] xl:rounded-[3rem] p-2 xl:p-2.5 shadow-2xl shadow-black/30 border-[8px] xl:border-[10px] border-gray-800">
                  {/* Phone Screen */}
                  <div className="w-full h-full bg-white rounded-[2rem] xl:rounded-[2.3rem] overflow-hidden relative">
                    {/* Dynamic Island */}
                    <div className="absolute top-2 left-1/2 -translate-x-1/2 w-20 xl:w-24 h-5 xl:h-6 bg-gray-900 rounded-full z-10"></div>
                    
                    {/* Screen Content */}
                    <div className="h-full bg-gradient-to-b from-gray-50 to-white">
                      {/* Status Bar */}
                      <div className="pt-8 xl:pt-10 px-4 flex items-center justify-between text-[10px] text-gray-500">
                        <span>9:41</span>
                        <div className="flex items-center gap-1">
                          <div className="flex gap-0.5">
                            <div className="w-0.5 h-2 bg-gray-900 rounded-full"></div>
                            <div className="w-0.5 h-2.5 bg-gray-900 rounded-full"></div>
                            <div className="w-0.5 h-3 bg-gray-900 rounded-full"></div>
                            <div className="w-0.5 h-3.5 bg-gray-900 rounded-full"></div>
                          </div>
                          <span className="ml-1">5G</span>
                          <div className="w-5 h-2.5 border border-gray-900 rounded-sm ml-1 relative">
                            <div className="absolute inset-0.5 bg-emerald-500 rounded-sm" style={{width: '80%'}}></div>
                          </div>
                        </div>
                      </div>

                      {/* App Header */}
                      <div className="px-4 pt-2 pb-1">
                        <img src="/logo black.png" alt="Logo" className="h-4 xl:h-5 w-auto" />
                      </div>

                      {/* Dashboard Preview */}
                      <div className="px-3 mt-1">
                        <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl p-3 text-white">
                          <p className="text-[10px] opacity-80">Today's Revenue</p>
                          <p className="text-lg xl:text-xl font-bold">₵12,450.00</p>
                          <div className="flex items-center gap-1 mt-1 text-[10px]">
                            <TrendingUp className="w-2.5 h-2.5" />
                            <span>+23% from yesterday</span>
                          </div>
                        </div>

                        {/* Quick Stats */}
                        <div className="grid grid-cols-3 gap-1.5 mt-2">
                          <div className="bg-white border border-gray-100 rounded-lg p-2 text-center shadow-sm">
                            <p className="text-sm font-bold text-gray-900">156</p>
                            <p className="text-[8px] text-gray-500">Orders</p>
                          </div>
                          <div className="bg-white border border-gray-100 rounded-lg p-2 text-center shadow-sm">
                            <p className="text-sm font-bold text-gray-900">24</p>
                            <p className="text-[8px] text-gray-500">New</p>
                          </div>
                          <div className="bg-white border border-gray-100 rounded-lg p-2 text-center shadow-sm">
                            <p className="text-sm font-bold text-emerald-600">98%</p>
                            <p className="text-[8px] text-gray-500">Rating</p>
                          </div>
                        </div>

                        {/* Recent Orders */}
                        <div className="mt-2">
                          <p className="text-[10px] font-semibold text-gray-700 mb-1">Recent Orders</p>
                          {[
                            { name: 'Kofi A.', amount: '₵145.00', time: '2m ago' },
                            { name: 'Amara K.', amount: '₵89.50', time: '5m ago' },
                            { name: 'Emeka O.', amount: '₵234.00', time: '12m ago' },
                          ].map((order, i) => (
                            <div key={i} className="flex items-center justify-between py-1.5 border-b border-gray-50">
                              <div className="flex items-center gap-1.5">
                                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-[10px] font-bold">
                                  {order.name.charAt(0)}
                                </div>
                                <div>
                                  <p className="text-[10px] font-medium text-gray-900">{order.name}</p>
                                  <p className="text-[8px] text-gray-500">{order.time}</p>
                                </div>
                              </div>
                              <span className="text-[10px] font-bold text-emerald-600">{order.amount}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Bottom Nav */}
                      <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-2">
                        <div className="flex items-center justify-around">
                          <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center">
                            <ShoppingBag className="w-4 h-4 text-white" />
                          </div>
                          <TrendingUp className="w-5 h-5 text-gray-400" />
                          <Users className="w-5 h-5 text-gray-400" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Section - Stats */}
          <div className="shrink-0">
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
              <div className="grid grid-cols-3 gap-4">
                {stats.map((stat, i) => (
                  <div key={i} className="text-center">
                    <p className="text-xl xl:text-2xl font-bold text-white">{stat.value}</p>
                    <p className="text-white/70 text-xs">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
            <p className="text-white/60 text-center text-xs mt-3">
              Powering businesses across Ghana 🇬🇭 and Nigeria 🇳🇬
            </p>
          </div>
        </div>
      </div>

      {/* CSS for float animation */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
