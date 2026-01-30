import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Truck, Shield, ChevronRight, ArrowLeft } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';

// Premium theme configuration
const themes = {
  GH: {
    primary: '#FFD000',
    primaryLight: '#FFF8E0',
    primaryMid: '#FFE566',
    primaryDark: '#D4A900',
    accent: '#1A1A1A',
    textOnPrimary: '#1A1400',
    flag: '🇬🇭',
    country: 'Ghana',
    phonePrefix: '+233',
    phonePlaceholder: '24 XXX XXXX',
  },
  NG: {
    primary: '#008751',
    primaryLight: '#E8F5EE',
    primaryMid: '#66B894',
    primaryDark: '#006B41',
    accent: '#FFFFFF',
    textOnPrimary: '#FFFFFF',
    flag: '🇳🇬',
    country: 'Nigeria',
    phonePrefix: '+234',
    phonePlaceholder: '803 XXX XXXX',
  },
};

type CountryCode = 'GH' | 'NG';

export function LoginPage() {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [isLoading, setIsLoading] = useState(false);
  const [country, setCountry] = useState<CountryCode>('GH');
  const [countdown, setCountdown] = useState(0);
  const { requestOTP, login, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const theme = themes[country];

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  // Countdown timer for resend OTP
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleRequestOTP = async () => {
    if (!phone || phone.length < 9) {
      toast.error('Please enter a valid phone number');
      return;
    }
    
    setIsLoading(true);
    try {
      const fullPhone = `${theme.phonePrefix}${phone.replace(/\s/g, '')}`;
      await requestOTP(fullPhone);
      setStep('otp');
      setCountdown(60);
      toast.success('OTP sent to your phone');
    } catch (error: any) {
      toast.error(error.message || 'Failed to send OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!otp || otp.length < 4) {
      toast.error('Please enter the OTP');
      return;
    }
    
    setIsLoading(true);
    try {
      const fullPhone = `${theme.phonePrefix}${phone.replace(/\s/g, '')}`;
      await login(fullPhone, otp);
      toast.success('Welcome back!');
      navigate('/');
    } catch (error: any) {
      toast.error(error.message || 'Invalid OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (countdown > 0) return;
    setIsLoading(true);
    try {
      const fullPhone = `${theme.phonePrefix}${phone.replace(/\s/g, '')}`;
      await requestOTP(fullPhone);
      setCountdown(60);
      toast.success('New OTP sent');
    } catch (error: any) {
      toast.error(error.message || 'Failed to resend OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const formatPhoneInput = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 10)}`;
  };

  return (
    <div 
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: theme.primaryLight }}
    >
      {/* Header Section */}
      <div 
        className="pt-12 pb-16 px-6 relative overflow-hidden"
        style={{ backgroundColor: theme.primary }}
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-4 left-4 w-24 h-24 rounded-full border-4" style={{ borderColor: theme.accent }} />
          <div className="absolute top-20 right-8 w-16 h-16 rounded-full border-4" style={{ borderColor: theme.accent }} />
          <div className="absolute bottom-4 left-1/3 w-12 h-12 rounded-full border-4" style={{ borderColor: theme.accent }} />
        </div>

        {/* Country Selector */}
        <div className="flex justify-end mb-6 relative z-10">
          <div className="flex bg-white/20 backdrop-blur-sm rounded-full p-1">
            {(['GH', 'NG'] as CountryCode[]).map((c) => (
              <button
                key={c}
                onClick={() => setCountry(c)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  country === c
                    ? 'bg-white shadow-lg'
                    : 'hover:bg-white/30'
                }`}
                style={{ color: country === c ? theme.primary : theme.textOnPrimary }}
              >
                {themes[c].flag} {c}
              </button>
            ))}
          </div>
        </div>

        {/* Logo & Title */}
        <div className="text-center relative z-10">
          <div 
            className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-4 shadow-xl"
            style={{ backgroundColor: theme.accent }}
          >
            <Truck className="w-10 h-10" style={{ color: theme.primary }} />
          </div>
          <h1 
            className="text-3xl font-bold mb-2"
            style={{ color: theme.textOnPrimary }}
          >
            Rider Portal
          </h1>
          <p 
            className="text-sm opacity-80"
            style={{ color: theme.textOnPrimary }}
          >
            WarehousePOS Delivery System
          </p>
        </div>
      </div>

      {/* Form Section */}
      <div className="flex-1 px-6 -mt-8">
        <div className="bg-white rounded-3xl shadow-xl p-6 max-w-md mx-auto">
          {step === 'phone' ? (
            <div className="space-y-5">
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-zinc-900">Sign In</h2>
                <p className="text-sm text-zinc-500 mt-1">
                  Enter your phone number to continue
                </p>
              </div>

              {/* Phone Input */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">
                  Phone Number
                </label>
                <div className="flex items-center border-2 rounded-xl overflow-hidden focus-within:border-opacity-100 transition-colors"
                  style={{ borderColor: `${theme.primary}50` }}
                >
                  <div 
                    className="px-4 py-3.5 font-medium border-r"
                    style={{ backgroundColor: theme.primaryLight, borderColor: `${theme.primary}30` }}
                  >
                    <span className="text-zinc-700">{theme.phonePrefix}</span>
                  </div>
                  <input
                    type="tel"
                    placeholder={theme.phonePlaceholder}
                    value={phone}
                    onChange={(e) => setPhone(formatPhoneInput(e.target.value))}
                    className="flex-1 px-4 py-3.5 text-lg outline-none"
                    maxLength={12}
                  />
                </div>
              </div>

              {/* Continue Button */}
              <button
                onClick={handleRequestOTP}
                disabled={isLoading || phone.length < 9}
                className="w-full py-4 rounded-xl font-semibold text-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                style={{ 
                  backgroundColor: theme.primary, 
                  color: theme.textOnPrimary,
                }}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Sending OTP...
                  </>
                ) : (
                  <>
                    Continue
                    <ChevronRight className="w-5 h-5" />
                  </>
                )}
              </button>

              {/* Features */}
              <div className="pt-4 space-y-3">
                <div className="flex items-center gap-3 text-sm text-zinc-600">
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: theme.primaryLight }}
                  >
                    <Shield className="w-4 h-4" style={{ color: theme.primaryDark }} />
                  </div>
                  <span>Secure OTP verification</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-zinc-600">
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: theme.primaryLight }}
                  >
                    <Truck className="w-4 h-4" style={{ color: theme.primaryDark }} />
                  </div>
                  <span>Manage your deliveries on the go</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Back Button */}
              <button
                onClick={() => setStep('phone')}
                className="flex items-center gap-2 text-sm text-zinc-600 hover:text-zinc-900 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Change number
              </button>

              <div className="text-center">
                <h2 className="text-xl font-bold text-zinc-900">Enter OTP</h2>
                <p className="text-sm text-zinc-500 mt-1">
                  Code sent to {theme.phonePrefix} {phone}
                </p>
              </div>

              {/* OTP Input */}
              <div>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Enter 6-digit code"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full px-4 py-4 text-2xl text-center tracking-[0.5em] font-mono border-2 rounded-xl outline-none focus:border-opacity-100 transition-colors"
                  style={{ borderColor: `${theme.primary}50` }}
                  maxLength={6}
                  autoFocus
                />
              </div>

              {/* Verify Button */}
              <button
                onClick={handleLogin}
                disabled={isLoading || otp.length < 4}
                className="w-full py-4 rounded-xl font-semibold text-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                style={{ 
                  backgroundColor: theme.primary, 
                  color: theme.textOnPrimary,
                }}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Verify & Login'
                )}
              </button>

              {/* Resend OTP */}
              <div className="text-center">
                {countdown > 0 ? (
                  <p className="text-sm text-zinc-500">
                    Resend code in <span className="font-semibold" style={{ color: theme.primary }}>{countdown}s</span>
                  </p>
                ) : (
                  <button
                    onClick={handleResendOTP}
                    disabled={isLoading}
                    className="text-sm font-medium hover:underline"
                    style={{ color: theme.primary }}
                  >
                    Didn't receive code? Resend
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="p-6 text-center">
        <p className="text-xs text-zinc-500">
          © 2026 WarehousePOS • Rider App v1.0
        </p>
      </div>
    </div>
  );
}