import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Lock, Eye, EyeOff, CheckCircle2, AlertCircle, ArrowRight, KeyRound } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export function ResetPasswordPage() {
  const navigate = useNavigate();
  
  const [isLoading, setIsLoading] = useState(false);
  const [isValidSession, setIsValidSession] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Check if we have a valid recovery session
  useEffect(() => {
    const checkSession = async () => {
      try {
        // The recovery link sets up a session automatically
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Session error:', error);
          setIsValidSession(false);
        } else if (session) {
          // Check if this is a recovery session
          // Supabase sets the session when user clicks the recovery link
          setIsValidSession(true);
        } else {
          setIsValidSession(false);
        }
      } catch (error) {
        console.error('Error checking session:', error);
        setIsValidSession(false);
      } finally {
        setIsCheckingSession(false);
      }
    };

    checkSession();
  }, []);

  // Password validation
  const passwordValidation = {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    matches: password === confirmPassword && password.length > 0,
  };

  const isPasswordValid = 
    passwordValidation.minLength && 
    passwordValidation.hasUppercase && 
    passwordValidation.hasLowercase && 
    passwordValidation.hasNumber &&
    passwordValidation.matches;

  // Handle password reset
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password) {
      toast.error('Please enter a new password');
      return;
    }

    if (!isPasswordValid) {
      toast.error('Please meet all password requirements');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      
      if (error) {
        console.error('Password reset error:', error);
        toast.error(error.message || 'Failed to reset password');
      } else {
        setIsSuccess(true);
        toast.success('Password reset successfully!');
        
        // Sign out to clear the recovery session
        await supabase.auth.signOut();
        
        // Redirect to login after a delay
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      }
    } catch (error: any) {
      console.error('Reset error:', error);
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Loading state while checking session
  if (isCheckingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto mb-4" />
          <p className="text-gray-600">Verifying reset link...</p>
        </div>
      </div>
    );
  }

  // Invalid or expired session
  if (!isValidSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Invalid or Expired Link
          </h1>
          <p className="text-gray-600 mb-6">
            This password reset link is invalid or has expired. Please request a new one.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            Back to Login
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // Success state
  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Password Reset Complete!
          </h1>
          <p className="text-gray-600 mb-6">
            Your password has been successfully reset. You'll be redirected to the login page shortly.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            Go to Login
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // Reset password form
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <img 
            src="/logo black.png" 
            alt="WarehousePOS" 
            className="h-8 w-auto mx-auto mb-4"
          />
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <KeyRound className="w-6 h-6 text-emerald-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Set New Password
            </h1>
            <p className="text-gray-600">
              Create a strong password for your account
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleResetPassword} className="space-y-4">
            {/* New Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-900 mb-1.5">
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter new password"
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

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-900 mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  autoComplete="new-password"
                  className="w-full pl-10 pr-12 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 transition-all outline-none text-gray-900 placeholder-gray-400"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Password Requirements */}
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
                Password Requirements
              </p>
              <ul className="space-y-1.5">
                <PasswordRequirement 
                  met={passwordValidation.minLength} 
                  text="At least 8 characters" 
                />
                <PasswordRequirement 
                  met={passwordValidation.hasUppercase} 
                  text="One uppercase letter" 
                />
                <PasswordRequirement 
                  met={passwordValidation.hasLowercase} 
                  text="One lowercase letter" 
                />
                <PasswordRequirement 
                  met={passwordValidation.hasNumber} 
                  text="One number" 
                />
                <PasswordRequirement 
                  met={passwordValidation.matches} 
                  text="Passwords match" 
                />
              </ul>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || !isPasswordValid}
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold py-3.5 rounded-xl transition-all transform hover:scale-[1.02] hover:shadow-lg hover:shadow-emerald-500/25 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  <span>Resetting Password...</span>
                </>
              ) : (
                <>
                  <span>Reset Password</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Back to login link */}
        <div className="text-center mt-6">
          <button
            onClick={() => navigate('/login')}
            className="text-sm text-gray-600 hover:text-emerald-600 transition-colors"
          >
            ← Back to Login
          </button>
        </div>
      </div>
    </div>
  );
}

// Password requirement indicator component
function PasswordRequirement({ met, text }: { met: boolean; text: string }) {
  return (
    <li className={`flex items-center gap-2 text-sm ${met ? 'text-emerald-600' : 'text-gray-500'}`}>
      {met ? (
        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
      ) : (
        <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
      )}
      <span>{text}</span>
    </li>
  );
}

export default ResetPasswordPage;
