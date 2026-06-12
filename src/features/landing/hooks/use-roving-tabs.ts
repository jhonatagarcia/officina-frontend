import { useCallback, useRef, type KeyboardEvent } from 'react';

/**
 * Navegação por teclado em tablists (setas esquerda/direita, Home/End),
 * movendo seleção e foco juntos, conforme o padrão WAI-ARIA de tabs.
 */
export function useRovingTabs(count: number, select: (index: number) => void) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const setTabRef = useCallback((index: number) => {
    return (el: HTMLButtonElement | null) => {
      refs.current[index] = el;
    };
  }, []);

  const onKeyDown = useCallback(
    (event: KeyboardEvent<HTMLElement>, current: number) => {
      let next: number | null = null;
      if (event.key === 'ArrowRight') next = (current + 1) % count;
      else if (event.key === 'ArrowLeft') next = (current - 1 + count) % count;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = count - 1;

      if (next === null) return;
      event.preventDefault();
      select(next);
      refs.current[next]?.focus();
    },
    [count, select]
  );

  return { setTabRef, onKeyDown };
}
