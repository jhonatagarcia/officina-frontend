import type { ReactNode } from 'react';
import { formatPlate } from '@/lib/utils';

interface VehicleIdentityCellProps {
  plate?: string | null;
  description?: string | null;
  fallback?: string | null;
}

function splitVehicleFallback(fallback?: string | null) {
  if (!fallback) return { plate: null, description: null };

  const trimmedFallback = fallback.trim();
  const [plate, ...descriptionParts] = trimmedFallback.split(/\s*•\s*/);
  if (descriptionParts.length > 0) {
    return {
      plate: plate?.trim() || null,
      description: descriptionParts.join(' ').trim() || null,
    };
  }

  const plateWithDescription = trimmedFallback.match(/^([A-Z0-9]{3}-?[A-Z0-9]{4})\s+-\s+(.+)$/i);
  if (plateWithDescription) {
    return {
      plate: plateWithDescription[1],
      description: plateWithDescription[2],
    };
  }

  if (/^[A-Z0-9]{3}-?[A-Z0-9]{4}$/i.test(trimmedFallback)) {
    return { plate: trimmedFallback, description: null };
  }

  return {
    plate: null,
    description: trimmedFallback,
  };
}

export function PlateChip({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex rounded-md bg-stone-100 px-2.5 py-1 font-mono text-xs font-bold uppercase tracking-[0.08em] text-foreground">
      {children}
    </span>
  );
}

export function VehicleIdentityCell({ plate, description, fallback }: VehicleIdentityCellProps) {
  const fallbackParts = splitVehicleFallback(fallback);
  const resolvedPlate = plate || fallbackParts.plate;
  const resolvedDescription = description || fallbackParts.description;

  if (!resolvedPlate && !resolvedDescription) return <span className="text-muted-foreground">-</span>;

  return (
    <div className="space-y-1">
      {resolvedDescription ? <p className="text-sm text-muted-foreground">{resolvedDescription}</p> : null}
      {resolvedPlate ? <PlateChip>{formatPlate(resolvedPlate)}</PlateChip> : null}
    </div>
  );
}
