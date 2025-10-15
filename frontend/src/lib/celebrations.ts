/**
 * Delightful celebration effects for award-winning UX
 */

export interface ConfettiParticle {
  id: string;
  x: number;
  y: number;
  color: string;
  delay: number;
}

/**
 * Create confetti particles for celebration effect
 */
export function createConfetti(count: number = 30): ConfettiParticle[] {
  const colors = [
    "#6366f1", // Primary
    "#d946ef", // Secondary
    "#10b981", // Success
    "#f59e0b", // Warning
    "#3b82f6" // Info
  ];

  return Array.from({ length: count }, (_, i) => ({
    id: `confetti-${Date.now()}-${i}`,
    x: Math.random() * 100,
    y: Math.random() * 20,
    color: colors[Math.floor(Math.random() * colors.length)],
    delay: Math.random() * 0.5
  }));
}

/**
 * Trigger confetti animation
 */
export function triggerConfetti(container?: HTMLElement): void {
  const target = container || document.body;
  const particles = createConfetti();

  particles.forEach((particle) => {
    const element = document.createElement("div");
    element.className = "confetti";
    element.style.left = `${particle.x}%`;
    element.style.top = `${particle.y}%`;
    element.style.backgroundColor = particle.color;
    element.style.animationDelay = `${particle.delay}s`;

    target.appendChild(element);

    // Remove after animation
    setTimeout(() => {
      element.remove();
    }, 3000);
  });
}

/**
 * Add celebration class to element
 */
export function celebrateElement(element: HTMLElement): void {
  element.classList.add("celebrate");

  // Remove class after animation
  setTimeout(() => {
    element.classList.remove("celebrate");
  }, 600);
}

/**
 * Shake element for error feedback
 */
export function shakeElement(element: HTMLElement): void {
  element.classList.add("shake");

  setTimeout(() => {
    element.classList.remove("shake");
  }, 500);
}

/**
 * Add wobble effect
 */
export function wobbleElement(element: HTMLElement): void {
  element.classList.add("wobble");

  setTimeout(() => {
    element.classList.remove("wobble");
  }, 500);
}
