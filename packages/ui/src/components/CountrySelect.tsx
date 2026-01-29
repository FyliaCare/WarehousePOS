import { cn } from '@warehousepos/utils';
import { COUNTRIES } from '@warehousepos/utils';
import type { CountryCode } from '@warehousepos/types';

interface CountrySelectProps {
  value?: CountryCode;
  onValueChange: (value: CountryCode) => void;
  className?: string;
}

function CountrySelect({ value, onValueChange, className }: CountrySelectProps) {
  return (
    <div className={cn('grid grid-cols-2 gap-4', className)}>
      {(Object.keys(COUNTRIES) as CountryCode[]).map((code) => {
        const country = COUNTRIES[code];
        const isSelected = value === code;

        return (
          <button
            key={code}
            type="button"
            onClick={() => onValueChange(code)}
            className={cn(
              'relative flex flex-col items-center justify-center rounded-xl border-2 p-6 transition-all duration-200',
              isSelected
                ? 'border-primary bg-primary/5 shadow-md'
                : 'border-border hover:border-primary/50 hover:bg-muted/50'
            )}
          >
            {isSelected && (
              <div className="absolute right-2 top-2">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white">
                  <svg
                    className="h-3 w-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              </div>
            )}
            <span className="text-4xl mb-2">{country.flag}</span>
            <span className="font-semibold text-lg">{country.name}</span>
            <span className="text-sm text-muted-foreground mt-1">
              {country.currencySymbol} {country.currency}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// Compact version for headers/forms
function CountrySelectCompact({
  value,
  onValueChange,
  className,
}: CountrySelectProps) {
  return (
    <div className={cn('flex gap-2', className)}>
      {(Object.keys(COUNTRIES) as CountryCode[]).map((code) => {
        const country = COUNTRIES[code];
        const isSelected = value === code;

        return (
          <button
            key={code}
            type="button"
            onClick={() => onValueChange(code)}
            className={cn(
              'flex items-center gap-2 rounded-lg border px-3 py-2 transition-all',
              isSelected
                ? 'border-primary bg-primary/10'
                : 'border-border hover:border-primary/50'
            )}
          >
            <span className="text-lg">{country.flag}</span>
            <span className="text-sm font-medium">{code}</span>
          </button>
        );
      })}
    </div>
  );
}

export { CountrySelect, CountrySelectCompact };
