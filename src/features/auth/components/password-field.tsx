import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface PasswordFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string | undefined;
  placeholder?: string | undefined;
  disabled?: boolean | undefined;
  autoComplete?: string | undefined;
  inputClassName?: string | undefined;
  labelClassName?: string | undefined;
}

export function PasswordField({
  id,
  label,
  value,
  onChange,
  error,
  placeholder = 'Digite sua senha',
  disabled,
  autoComplete,
  inputClassName,
  labelClassName,
}: PasswordFieldProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="space-y-2">
      <Label htmlFor={id} className={labelClassName}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          autoComplete={autoComplete}
          className={cn('pr-11', inputClassName)}
          disabled={disabled}
          invalid={Boolean(error)}
          placeholder={placeholder}
          type={isVisible ? 'text' : 'password'}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
        <Button
          aria-label={isVisible ? 'Ocultar senha' : 'Mostrar senha'}
          className="absolute right-1 top-1 size-8 rounded-md text-muted-foreground hover:text-foreground"
          disabled={disabled}
          size="icon"
          type="button"
          variant="ghost"
          onClick={() => setIsVisible((current) => !current)}
        >
          {isVisible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </Button>
      </div>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
