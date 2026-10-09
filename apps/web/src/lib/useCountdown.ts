import { useEffect, useState } from 'react';

const TICK_MS = 200;

const msUntil = (endsAt: number | undefined) =>
  endsAt === undefined ? 0 : Math.max(0, endsAt - Date.now());

/** Milliseconds left until `endsAt` (a `Date.now()` time), updated a few times per second. */
export function useCountdown(endsAt: number | undefined): number {
  const [left, setLeft] = useState(() => msUntil(endsAt));

  useEffect(() => {
    const update = () => setLeft(msUntil(endsAt));
    update();
    if (endsAt === undefined) return;
    const timer = setInterval(update, TICK_MS);
    return () => clearInterval(timer);
  }, [endsAt]);

  return left;
}
