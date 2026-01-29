import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Loader2, Shield } from 'lucide-react';
import { Card, Button, Input } from '@warehousepos/ui';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }
    
    setIsLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back!');
      navigate('/');
    } catch (error: any) {
      toast.error('Login failed', { description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      {/* Logo */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-2xl mb-4">
          <Shield className="w-8 h-8 text-primary-foreground" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Admin Panel</h1>
        <p className="text-muted-foreground">WarehousePOS Platform Management</p>
      </div>

      {/* Form */}
      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="email"
            label="Email"
            placeholder="admin@warehousepos.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            leftIcon={<Mail className="w-5 h-5" />}
            required
          />
          
          <Input
            type="password"
            label="Password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            leftIcon={<Lock className="w-5 h-5" />}
            required
          />
          
          <Button
            type="submit"
            className="w-full h-11"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </Button>
        </form>
      </Card>

      <p className="text-center text-sm text-muted-foreground mt-6">
        Super admin access only
      </p>
    </div>
  );
}
