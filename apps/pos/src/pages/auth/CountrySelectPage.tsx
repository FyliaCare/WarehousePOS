import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@warehousepos/ui';
import { COUNTRIES } from '@warehousepos/utils';
import { useAuthStore } from '@/stores/authStore';
import type { CountryCode } from '@warehousepos/types';

export function CountrySelectPage() {
  const [selected, setSelected] = useState<CountryCode | null>(null);
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  const handleContinue = () => {
    if (selected) {
      if (isAuthenticated) {
        navigate('/dashboard');
      } else {
        navigate('/register', { state: { country: selected } });
      }
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold text-foreground mb-1">Select your country</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Choose where your business is located
      </p>

      <div className="space-y-3 mb-6">
        {Object.entries(COUNTRIES).map(([code, country]) => (
          <button
            key={code}
            onClick={() => setSelected(code as CountryCode)}
            className={`w-full p-4 rounded-lg border-2 transition-all flex items-center gap-4 ${
              selected === code
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50'
            }`}
          >
            <span className="text-3xl">{country.flag}</span>
            <div className="text-left">
              <p className="font-medium text-foreground">{country.name}</p>
              <p className="text-sm text-muted-foreground">
                {country.currency} ({country.currencySymbol})
              </p>
            </div>
            {selected === code && (
              <div className="ml-auto w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-primary-foreground"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            )}
          </button>
        ))}
      </div>

      <Button
        className="w-full"
        disabled={!selected}
        onClick={handleContinue}
      >
        Continue
      </Button>

      <p className="mt-4 text-xs text-muted-foreground text-center">
        Currently available in Ghana and Nigeria.{' '}
        <a href="#" className="text-primary hover:underline">
          Request a new country
        </a>
      </p>
    </div>
  );
}
