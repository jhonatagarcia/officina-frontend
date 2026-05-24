import type { ReactNode } from 'react';

interface VehicleIdentityCellProps {
  plate?: string | null;
  description?: string | null;
  fallback?: string | null;
}

function splitVehicleFallback(fallback?: string | null) {
  if (!fallback) return { plate: null, description: null };

  const [plate, ...descriptionParts] = fallback.split(/\s*[•-]\s*/);
  return {
    plate: plate?.trim() || null,
    description: descriptionParts.join(' ').trim() || fallback,
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
      {resolvedPlate ? <PlateChip>{resolvedPlate}</PlateChip> : null}
      {resolvedDescription ? <p className="text-sm text-muted-foreground">{resolvedDescription}</p> : null}
    </div>
  );
}
