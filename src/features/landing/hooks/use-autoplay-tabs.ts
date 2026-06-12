import { useCallback, useEffect, useRef, useState } from 'react';
import { usePrefersReducedMotion } from './use-prefers-reduced-motion';

interface UseAutoplayTabsOptions {
  interval?: number;
  /** Tempo de pausa após interação manual antes de retomar o autoplay. */
  resumeDelay?: number;
}

/**
 * Avança tabs automaticamente em ciclo; interação manual pausa o autoplay
 * e o retoma após `resumeDelay`. Desativado com prefers-reduced-motion.
 */
export function useAutoplayTabs(
  count: number,
  { interval = 3500, resumeDelay = 9000 }: UseAutoplayTabsOptions = {}
) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduced = usePrefersReducedMotion();
  const resumeTimer = useRef<number>();

  useEffect(() => {
    if (reduced || paused || count <= 1) return;
    const id = window.setInterval(() => setActive((i) => (i + 1) % count), interval);
    return () => window.clearInterval(id);
  }, [reduced, paused, count, interval]);

  useEffect(() => () => window.clearTimeout(resumeTimer.current), []);

  const select = useCallback(
    (index: number) => {
      setActive(index);
      setPaused(true);
      window.clearTimeout(resumeTimer.current);
      resumeTimer.current = window.setTimeout(() => setPaused(false), resumeDelay);
    },
    [resumeDelay]
  );

  return { active, select };
}
