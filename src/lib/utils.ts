import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function toNumber(value: number | string | null | undefined) {
  if (value === null || value === undefined) return 0;
  return typeof value === 'number' ? value : Number(value);
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function formatServiceOrderNumber(orderNumber?: string | null) {
  if (!orderNumber) return '-';

  const normalizedNumber = orderNumber.match(/^(?:TMP-)?OS-?(\d+)$/)?.[1];
  if (!normalizedNumber) return orderNumber;

  return `OS${normalizedNumber.padStart(6, '0')}`;
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR').format(new Date(value));
}

export function formatDateOnly(value: string) {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);

  if (!match) {
    return formatDate(value);
  }

  const [, year, month, day] = match;
  return `${day}/${month}/${year}`;
}

export function onlyDigits(value?: string | null) {
  return value?.replace(/\D/g, '') ?? '';
}

export function normalizePlate(value?: string | null) {
  return value?.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 7) ?? '';
}

export function formatPlate(value?: string | null) {
  const normalized = normalizePlate(value);
  if (normalized.length <= 3) return normalized;
  return `${normalized.slice(0, 3)}-${normalized.slice(3)}`;
}

export function capitalizeFirstLetter(value: string) {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function normalizeNullableString(value?: string | null) {
  return value && value.trim() ? value : null;
}

export function formatPhone(value?: string | null) {
  const digits = onlyDigits(value).slice(0, 11);
  if (!digits) return '-';

  if (digits.length <= 10) {
    return digits
      .replace(/^(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2');
  }

  return digits
    .replace(/^(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2');
}

export function formatCpfCnpj(value?: string | null) {
  const digits = onlyDigits(value).slice(0, 14);
  if (!digits) return '-';

  if (digits.length <= 11) {
    return digits
      .replace(/^(\d{3})(\d)/, '$1.$2')
      .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1-$2');
  }

  return digits
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
}

export function parseCurrencyInput(value: string) {
  const digits = onlyDigits(value);
  return Number(digits) / 100;
}
