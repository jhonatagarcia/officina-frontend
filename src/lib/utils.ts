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

export function normalizePlate(value: string) {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

export function capitalizeFirstLetter(value: string) {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function normalizeNullableString(value?: string | null) {
  return value && value.trim() ? value : null;
}

export function formatPhone(value?: string | null) {
  const digits = value?.replace(/\D/g, '').slice(0, 11) ?? '';
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

export function buildWhatsAppUrl(phone?: string | null, message?: string) {
  const digits = phone?.replace(/\D/g, '') ?? '';
  if (!digits) return null;

  const phoneWithCountryCode =
    digits.length === 10 || digits.length === 11
      ? `55${digits}`
      : digits;

  const encodedMessage = encodeURIComponent(message ?? '');
  return `https://wa.me/${phoneWithCountryCode}?text=${encodedMessage}`;
}

export function formatCpfCnpj(value?: string | null) {
  const digits = value?.replace(/\D/g, '').slice(0, 14) ?? '';
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

export function formatarMoeda(valorDigitado: string) {
  const numeros = valorDigitado.replace(/\D/g, '');
  const valorNumerico = Number(numeros) / 100;

  return valorNumerico.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

export function parseCurrencyInput(value: string) {
  const digits = value.replace(/\D/g, '');
  return Number(digits) / 100;
}
