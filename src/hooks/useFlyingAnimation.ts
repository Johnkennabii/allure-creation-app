import { useState, useCallback } from "react";

interface FlyingAnimationState {
  isAnimating: boolean;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

export function useFlyingAnimation() {
  const [animationState, setAnimationState] = useState<FlyingAnimationState | null>(null);

  const triggerAnimation = useCallback((sourceElement: HTMLElement, targetSelector: string) => {
    const targetElement = document.querySelector(targetSelector);
    if (!targetElement) {
      console.warn("Target element not found for flying animation");
      return;
    }

    const sourceRect = sourceElement.getBoundingClientRect();
    const targetRect = targetElement.getBoundingClientRect();

    setAnimationState({
      isAnimating: true,
      startX: sourceRect.left + sourceRect.width / 2,
      startY: sourceRect.top + sourceRect.height / 2,
      endX: targetRect.left + targetRect.width / 2,
      endY: targetRect.top + targetRect.height / 2,
    });

    // Réinitialiser après l'animation
    setTimeout(() => {
      setAnimationState(null);
    }, 800);
  }, []);

  return {
    animationState,
    triggerAnimation,
  };
}
