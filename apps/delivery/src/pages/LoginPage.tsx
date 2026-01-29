import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, Loader2 } from 'lucide-react';
import { Button, Input } from '@warehousepos/ui';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';

export function LoginPage() {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [isLoading, setIsLoading] = useState(false);
  const { requestOTP, login } = useAuthStore();
  const navigate = useNavigate();

  const handleRequestOTP = async () => {
    if (!phone || phone.length < 10) {
      toast.error('Please enter a valid phone number');
      return;
    }
    
    setIsLoading(true);
    try {
      await requestOTP(phone);
      setStep('otp');
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
      await login(phone, otp);
      toast.success('Welcome back!');
      navigate('/');
    } catch (error: any) {
      toast.error(error.message || 'Invalid OTP');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-primary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-primary rounded-2xl mb-4">
            <svg
              className="w-12 h-12 text-primary-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Delivery App</h1>
          <p className="text-muted-foreground">WarehousePOS Rider Portal</p>
        </div>

        {/* Form */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-lg">
          {step === 'phone' ? (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground text-center">
                Sign in with your phone
              </h2>
              
              <Input
                type="tel"
                placeholder="Enter phone number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                leftIcon={<Phone className="w-5 h-5" />}
              />
              
              <Button
                className="w-full h-12"
                onClick={handleRequestOTP}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Get OTP'
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground text-center">
                Enter OTP
              </h2>
              <p className="text-sm text-muted-foreground text-center">
                We sent a code to {phone}
              </p>
              
              <Input
                type="text"
                placeholder="Enter OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                maxLength={6}
                className="text-center text-2xl tracking-widest"
              />
              
              <Button
                className="w-full h-12"
                onClick={handleLogin}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Verify & Login'
                )}
              </Button>
              
              <button
                onClick={() => setStep('phone')}
                className="w-full text-sm text-primary hover:underline"
              >
                Change phone number
              </button>
            </div>
          )}
        </div>
        
        <p className="text-center text-sm text-muted-foreground mt-6">
          Contact your store admin if you need help
        </p>
      </div>
    </div>
  );
}
