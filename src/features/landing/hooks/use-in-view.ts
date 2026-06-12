import { useEffect, useRef, useState, type RefObject } from 'react';

interface UseInViewOptions {
  threshold?: number | number[];
  rootMargin?: string;
  /** Quando true (padrão), para de observar após a primeira entrada no viewport. */
  once?: boolean;
}

/**
 * Observa quando um elemento entra no viewport via IntersectionObserver,
 * com desconexão automática no cleanup.
 */
export function useInView<T extends HTMLElement>({
  threshold = 0.1,
  rootMargin,
  once = true,
}: UseInViewOptions = {}): [RefObject<T>, boolean] {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }

    const observerOptions: IntersectionObserverInit = rootMargin
      ? { threshold, rootMargin }
      : { threshold };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setInView(true);
            if (once) observer.unobserve(entry.target);
          } else if (!once) {
            setInView(false);
          }
        }
      },
      observerOptions
    );

    observer.observe(el);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- threshold pode ser array; serializado para comparação estável
  }, [once, rootMargin, JSON.stringify(threshold)]);

  return [ref, inView];
}
