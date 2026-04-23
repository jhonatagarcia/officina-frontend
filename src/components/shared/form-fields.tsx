import { useMemo, useState } from 'react';
import { Controller, type Control, type FieldPath, type FieldValues } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Option } from '@/types/common';

interface FieldWrapperProps {
  label: string;
  error?: string;
  htmlFor?: string;
  children: React.ReactNode;
}

function FieldWrapper({ label, error, htmlFor, children }: FieldWrapperProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}

interface ControlledFieldProps<TFieldValues extends FieldValues> {
  control: Control<TFieldValues>;
  name: FieldPath<TFieldValues>;
  label: string;
  placeholder?: string;
  error?: string;
  type?: React.InputHTMLAttributes<HTMLInputElement>['type'];
  disabled?: boolean;
  inputMode?: React.InputHTMLAttributes<HTMLInputElement>['inputMode'];
  transformValue?: (value: string) => string;
}

export function TextField<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  error,
  type,
  disabled,
  inputMode,
  transformValue,
}: ControlledFieldProps<TFieldValues>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <FieldWrapper label={label} error={error} htmlFor={name}>
          <Input
            id={name}
            disabled={disabled}
            inputMode={inputMode}
            placeholder={placeholder}
            type={type}
            {...field}
            onChange={(event) => field.onChange(transformValue ? transformValue(event.target.value) : event.target.value)}
          />
        </FieldWrapper>
      )}
    />
  );
}

export function TextAreaField<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  error,
  disabled,
  transformValue,
}: ControlledFieldProps<TFieldValues>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <FieldWrapper label={label} error={error} htmlFor={name}>
          <Textarea
            id={name}
            disabled={disabled}
            placeholder={placeholder}
            {...field}
            onChange={(event) => field.onChange(transformValue ? transformValue(event.target.value) : event.target.value)}
          />
        </FieldWrapper>
      )}
    />
  );
}

interface SelectFieldProps<TFieldValues extends FieldValues> extends ControlledFieldProps<TFieldValues> {
  options: Option[];
  searchable?: boolean;
  searchPlaceholder?: string;
}

export function SelectField<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  error,
  options,
  disabled,
  searchable,
  searchPlaceholder,
}: SelectFieldProps<TFieldValues>) {
  const [search, setSearch] = useState('');
  const filteredOptions = useMemo(() => {
    if (!searchable || !search.trim()) return options;

    const normalizedSearch = search.trim().toLowerCase();
    return options.filter((option) => option.label.toLowerCase().includes(normalizedSearch));
  }, [options, search, searchable]);

  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <FieldWrapper label={label} error={error}>
          <Select
            disabled={disabled}
            onOpenChange={(open) => {
              if (!open) setSearch('');
            }}
            onValueChange={field.onChange}
            value={field.value}
          >
            <SelectTrigger>
              <SelectValue placeholder={placeholder ?? 'Selecione'} />
            </SelectTrigger>
            <SelectContent>
              {searchable ? (
                <div className="p-2">
                  <Input
                    placeholder={searchPlaceholder ?? 'Buscar...'}
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    onKeyDown={(event) => event.stopPropagation()}
                  />
                </div>
              ) : null}
              {filteredOptions.length === 0 ? (
                <div className="px-2 py-3 text-sm text-muted-foreground">Nenhum resultado encontrado.</div>
              ) : null}
              {filteredOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldWrapper>
      )}
    />
  );
}
