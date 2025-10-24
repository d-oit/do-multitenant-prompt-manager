/**
 * Hook for adding delightful feedback to user interactions
 */

import { useCallback, useRef } from "react";
import { triggerConfetti, celebrateElement, shakeElement, wobbleElement } from "./celebrations";

export interface DelightfulFeedback {
  celebrate: (element?: HTMLElement | null) => void;
  shake: (element?: HTMLElement | null) => void;
  wobble: (element?: HTMLElement | null) => void;
  confetti: () => void;
}

export function useDelightfulFeedback(): DelightfulFeedback {
  const containerRef = useRef<HTMLElement | null>(null);

  const celebrate = useCallback((element?: HTMLElement | null) => {
    const target = element || containerRef.current;
    if (target) {
      celebrateElement(target);
    }
  }, []);

  const shake = useCallback((element?: HTMLElement | null) => {
    const target = element || containerRef.current;
    if (target) {
      shakeElement(target);
    }
  }, []);

  const wobble = useCallback((element?: HTMLElement | null) => {
    const target = element || containerRef.current;
    if (target) {
      wobbleElement(target);
    }
  }, []);

  const confetti = useCallback(() => {
    triggerConfetti();
  }, []);

  return {
    celebrate,
    shake,
    wobble,
    confetti
  };
}
