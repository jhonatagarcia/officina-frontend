import { useEffect, useState } from 'react';
import { usePrefersReducedMotion } from './use-prefers-reduced-motion';

interface UseCountUpOptions {
  duration?: number;
  formatter?: (value: number) => string;
}

/**
 * Conta de 0 até `target` com easing cúbico quando `started` vira true.
 * Com movimento reduzido, pula direto para o valor final.
 */
export function useCountUp(
  target: number,
  started: boolean,
  { duration = 1600, formatter }: UseCountUpOptions = {}
): string {
  const [value, setValue] = useState(0);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (!started) return;
    if (reduced) {
      setValue(target);
      return;
    }

    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      setValue(Math.round((1 - Math.pow(1 - p, 3)) * target));
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, started, duration, reduced]);

  const format = formatter ?? ((v: number) => (target >= 1000 ? v.toLocaleString('pt-BR') : String(v)));
  return format(value);
}
