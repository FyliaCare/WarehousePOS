import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, ArrowLeft, Sparkles, TrendingUp, Users, ShoppingBag, Zap, CheckCircle2, Star, Phone, RefreshCw } from 'lucide-react';
import { sendOTP, verifyOTP } from '@/lib/supabase-auth';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import type { CountryCode } from '@warehousepos/types';

type Mode = 'phone' | 'verify-otp';

export function LoginPage() {
  const navigate = useNavigate();
  const { user, isInitialized, refreshUser } = useAuthStore();
  
  const [mode, setMode] = useState<Mode>('phone');
  const [isLoading, setIsLoading] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  
  const [country, setCountry] = useState<CountryCode>('GH');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [formattedPhone, setFormattedPhone] = useState('');

  const isGhana = country === 'GH';

  // Redirect if already logged in
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

  // Send OTP to phone
  const handleSendOTP = async () => {
    if (!phone.trim()) {
      toast.error('Please enter your phone number');
      return;
    }
    
    // Store formatted phone for display
    const prefix = isGhana ? '+233' : '+234';
    const cleanPhone = phone.replace(/^0+/, ''); // Remove leading zeros
    setFormattedPhone(`${prefix}${cleanPhone}`);
    
    setIsLoading(true);
    try {
      const result = await sendOTP(phone, country, 'login');
      
      if (result.success) {
        setMode('verify-otp');
        setResendCountdown(60);
        toast.success('OTP sent to your phone! 📱');
        if (result.devOTP && import.meta.env.DEV) {
          toast.info(`Dev OTP: ${result.devOTP}`, { duration: 6000 });
        }
      } else {
        toast.error(result.error || 'Failed to send OTP');
      }
    } catch (error) {
      logger.error('Send OTP error:', error);
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Verify OTP and complete login
  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      toast.error('Please enter the 6-digit OTP');
      return;
    }
    
    setIsLoading(true);
    try {
      const result = await verifyOTP(phone, country, otp, 'login');
      
      if (result.success) {
        // Check if user needs to complete registration
        if (result.needsProfileSetup) {
          toast.info('Please complete your registration');
          navigate('/register', { state: { phone, country, userId: result.user?.id } });
          setIsLoading(false);
          return;
        }
        
        // User has a profile - refresh user data from auth state
        try {
          await refreshUser();
          toast.success('Login successful! 🎉');
          navigate('/dashboard');
        } catch (e) {
          logger.error('Failed to refresh user', { error: String(e) });
          toast.error('Login succeeded but failed to load profile. Please try logging in again.');
          setIsLoading(false);
          // Stay on login page - user can retry
        }
      } else {
        toast.error(result.error || 'Invalid OTP');
        setIsLoading(false);
      }
    } catch (error) {
      logger.error('Verify OTP error:', error);
      toast.error('An error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  // Resend OTP
  const handleResendOTP = async () => {
    if (resendCountdown > 0) return;
    
    setIsLoading(true);
    try {
      const result = await sendOTP(phone, country, 'login');
      
      if (result.success) {
        setOtp(''); // Clear old OTP input
        setResendCountdown(60);
        toast.success('New OTP sent! 📱');
        if (result.devOTP && import.meta.env.DEV) {
          toast.info(`Dev OTP: ${result.devOTP}`, { duration: 6000 });
        }
      } else {
        toast.error(result.error || 'Failed to resend OTP');
      }
    } catch (error) {
      logger.error('Resend OTP error:', error);
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (mode === 'phone') handleSendOTP();
      else if (mode === 'verify-otp') handleVerifyOTP();
    }
  };

  // Feature highlights for social proof
  const features = [
    { icon: ShoppingBag, text: "Track Sales & Inventory" },
    { icon: Users, text: "Manage Customers" },
    { icon: TrendingUp, text: "Grow Your Business" },
  ];

  // Stats for social proof
  const stats = [
    { value: "10K+", label: "Active Vendors" },
    { value: "₵2M+", label: "Daily Transactions" },
    { value: "99.9%", label: "Uptime" },
  ];

  return (
    <div className="h-screen flex overflow-hidden">
      {/* Left Side - Login Form */}
      <div className="w-full lg:w-[45%] h-screen bg-white flex flex-col overflow-y-auto">
        {/* Top Bar */}
        <div className="p-4 flex items-center justify-between shrink-0">
          <img 
            src="/logo black.png" 
            alt="WarehousePOS" 
            className="h-7 w-auto"
          />
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-500 hidden sm:inline">New here?</span>
            <button 
              onClick={() => navigate('/register')}
              className="px-3 py-1.5 bg-gray-900 text-white rounded-full text-sm font-medium hover:bg-gray-800 transition-colors"
            >
              Get Started
            </button>
          </div>
        </div>

        {/* Form Container */}
        <div className="flex-1 flex items-center justify-center px-6 lg:px-12 py-4">
          <div className="w-full max-w-md">
            {/* Header */}
            <div className="mb-5">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 rounded-full mb-3">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-xs font-medium text-emerald-700">Trusted by 10,000+ businesses</span>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {mode === 'phone' ? 'Welcome back!' : 'Verify your phone'}
              </h1>
              <p className="text-gray-600">
                {mode === 'phone' 
                  ? "Enter your phone number to receive a verification code." 
                  : `Enter the 6-digit code sent to ${formattedPhone}`}
              </p>
            </div>

            {/* Form */}
            <div className="space-y-4">
              {/* Country Selection */}
              {mode === 'phone' && (
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
              )}

              {/* Phone Number */}
              {mode === 'phone' && (
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
                  <p className="mt-1.5 text-xs text-gray-500 flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    We'll send a verification code via SMS
                  </p>
                </div>
              )}

              {/* OTP Input */}
              {mode === 'verify-otp' && (
                <div>
                  <label htmlFor="otp" className="block text-sm font-semibold text-gray-900 mb-1.5">
                    Verification code
                  </label>
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
                  
                  {/* Resend OTP */}
                  <div className="mt-3 text-center">
                    {resendCountdown > 0 ? (
                      <p className="text-sm text-gray-500">
                        Resend code in <span className="font-semibold text-emerald-600">{resendCountdown}s</span>
                      </p>
                    ) : (
                      <button
                        type="button"
                        onClick={handleResendOTP}
                        disabled={isLoading}
                        className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1.5 mx-auto"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Resend code
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Action Button */}
              <button
                onClick={mode === 'phone' ? handleSendOTP : handleVerifyOTP}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold py-3.5 rounded-xl transition-all transform hover:scale-[1.02] hover:shadow-lg hover:shadow-emerald-500/25 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    <span>Please wait...</span>
                  </>
                ) : mode === 'phone' ? (
                  <>
                    <span>Send Verification Code</span>
                    <Zap className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    <span>Verify & Sign In</span>
                    <CheckCircle2 className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Back Link */}
              {mode === 'verify-otp' && (
                <button
                  type="button"
                  onClick={() => {
                    setMode('phone');
                    setOtp('');
                  }}
                  className="w-full flex items-center justify-center gap-2 text-gray-600 hover:text-gray-900 font-medium py-1"
                >
                  <ArrowLeft size={16} />
                  Change phone number
                </button>
              )}
            </div>

            {/* Features Strip */}
            {mode === 'phone' && (
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
              <span className="text-white/90 text-xs font-medium">Africa's #1 Business Management Platform</span>
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
