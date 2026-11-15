import confetti from 'canvas-confetti';

export function fireConfetti(options?: { x?: number; y?: number; count?: number }) {
  if (typeof window === 'undefined') return;

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) return;

  const origin = {
    x: options?.x !== undefined ? options.x / window.innerWidth : 0.5,
    y: options?.y !== undefined ? options.y / window.innerHeight : 0.6,
  };

  const count = options?.count ?? 60;

  // Custom snack-themed palette: primary orange, ink dark, teal/blue, gold, strawberry pink
  const colors = ['#FF6B35', '#FF8FB8', '#4DB8FF', '#8BD450', '#FFD166', '#1B1B2F'];

  try {
    confetti({
      particleCount: count,
      spread: 70,
      startVelocity: 35,
      origin,
      colors,
      ticks: 200,
      gravity: 1.1,
      scalar: 1.1,
      disableForReducedMotion: true,
    });
  } catch {
    // Graceful fallback
  }
}

export function fireSuperConfetti() {
  if (typeof window === 'undefined') return;

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) return;

  const colors = ['#FF6B35', '#FF8FB8', '#4DB8FF', '#8BD450', '#FFD166', '#FF3366'];

  try {
    // Cannon left
    confetti({
      particleCount: 50,
      angle: 60,
      spread: 55,
      origin: { x: 0.1, y: 0.7 },
      colors,
      disableForReducedMotion: true,
    });
    // Cannon right
    confetti({
      particleCount: 50,
      angle: 120,
      spread: 55,
      origin: { x: 0.9, y: 0.7 },
      colors,
      disableForReducedMotion: true,
    });
    // Center pop
    setTimeout(() => {
      confetti({
        particleCount: 80,
        spread: 100,
        origin: { x: 0.5, y: 0.55 },
        colors,
        disableForReducedMotion: true,
      });
    }, 150);
  } catch {
    // Fallback
  }
}

export const FUNNY_CONSUME_QUIPS = [
  'Nom nom nom! Stash secured 🐿️',
  'Calories don’t count during business hours 📊✨',
  'Snack acquired! Sugar crash scheduled for 3 PM 🕒',
  'Zero crumbs left behind. Master of stealth 🥷',
  'Fueling the code machine. Commit incoming! 🚀',
  'Target neutralized with extreme prejudice 🎯🍪',
  'Brain glucose restored to 100% ⚡',
];

export const FUNNY_CHECKOUT_QUIPS = [
  'Jackpot! The pantry has been officially looted 🏴‍☠️',
  'Haul secured! Treat yo’ self like royalty 👑',
  'Bounty claimed! Hide your desk drawer from coworkers 👀',
  'Snack wealth level: UNSTOPPABLE 🏆✨',
  'Grabbed them all! May the pantry rest in peace 📦💨',
];

export function getRandomQuip(list: string[]): string {
  const index = Math.floor(Math.random() * list.length);
  return list[index];
}
