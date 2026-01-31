/**
 * Auth Callback Page
 * Handles redirects from Supabase auth (email verification, password reset, etc.)
 */
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { handleAuthCallback } from '@/lib/auth-service';
import { useAuthStore } from '@/stores/authStore';

type CallbackStatus = 'loading' | 'success' | 'error';

export function AuthCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { refreshUser } = useAuthStore();
  
  const [status, setStatus] = useState<CallbackStatus>('loading');
  const [message, setMessage] = useState('Processing...');
  const [callbackType, setCallbackType] = useState<string | null>(null);

  useEffect(() => {
    const processCallback = async () => {
      try {
        // Get the type from query params
        const type = searchParams.get('type');
        setCallbackType(type);

        const result = await handleAuthCallback();
        
        if (result.success) {
          setStatus('success');
          
          // Set appropriate message based on type
          if (result.type === 'signup' || type === 'signup') {
            setMessage('Email verified successfully! Redirecting...');
            // Refresh user data
            await refreshUser();
            // Redirect to setup if they need to complete business setup
            setTimeout(() => navigate('/setup', { replace: true }), 2000);
          } else if (result.type === 'recovery') {
            setMessage('Verified! Redirecting to reset password...');
            setTimeout(() => navigate('/reset-password', { replace: true }), 2000);
          } else {
            setMessage('Authenticated! Redirecting...');
            await refreshUser();
            setTimeout(() => navigate('/dashboard', { replace: true }), 2000);
          }
        } else {
          setStatus('error');
          setMessage(result.error || 'Verification failed. Please try again.');
        }
      } catch (err: any) {
        console.error('Callback error:', err);
        setStatus('error');
        setMessage('An error occurred. Please try again.');
      }
    };

    processCallback();
  }, [navigate, searchParams, refreshUser]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
        {status === 'loading' && (
          <>
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Verifying...
            </h1>
            <p className="text-gray-600">{message}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {callbackType === 'signup' ? 'Email Verified!' : 'Success!'}
            </h1>
            <p className="text-gray-600">{message}</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Verification Failed
            </h1>
            <p className="text-gray-600 mb-6">{message}</p>
            <div className="space-y-3">
              <button
                onClick={() => navigate('/login')}
                className="w-full py-3 px-4 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition-colors"
              >
                Go to Login
              </button>
              <button
                onClick={() => navigate('/register')}
                className="w-full py-3 px-4 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
              >
                Create New Account
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default AuthCallbackPage;
