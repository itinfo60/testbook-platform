import { useState, useEffect } from 'react';
import { HiClock } from 'react-icons/hi';

export default function TestTimer({ duration, onTimeUp, startTime }) {
  const [timeLeft, setTimeLeft] = useState(() => {
    if (startTime) {
      const elapsed = Math.floor((Date.now() - new Date(startTime).getTime()) / 1000);
      return Math.max(0, (duration || 60) * 60 - elapsed);
    }
    return (duration || 60) * 60;
  });

  useEffect(() => {
    if (timeLeft <= 0) {
      onTimeUp?.();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          onTimeUp?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, onTimeUp]);

  const hours = Math.floor(timeLeft / 3600);
  const minutes = Math.floor((timeLeft % 3600) / 60);
  const seconds = timeLeft % 60;

  const isLow = timeLeft < 300; // less than 5 min
  const isCritical = timeLeft < 60; // less than 1 min

  const format = (n) => String(n).padStart(2, '0');

  return (
    <div
      className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono text-lg font-bold transition-colors ${
        isCritical
          ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 animate-pulse'
          : isLow
            ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
            : 'bg-dark-100 text-dark-700 dark:bg-dark-800 dark:text-dark-300'
      }`}
    >
      <HiClock className="h-5 w-5" />
      {hours > 0 && <span>{format(hours)}:</span>}
      <span>
        {format(minutes)}:{format(seconds)}
      </span>
    </div>
  );
}
