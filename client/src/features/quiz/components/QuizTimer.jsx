import { useState, useEffect } from 'react';

export default function QuizTimer({ duration, onTimeUp }) {
  const [timeLeft, setTimeLeft] = useState((duration || 10) * 60);

  useEffect(() => {
    if (timeLeft <= 0) { onTimeUp?.(); return; }
    const t = setInterval(() => setTimeLeft(p => p - 1), 1000);
    return () => clearInterval(t);
  }, [timeLeft, onTimeUp]);

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const isLow = timeLeft < 60;

  return (
    <div className={`flex items-center gap-2 text-sm font-mono font-semibold ${
      isLow ? 'text-red-500 animate-pulse' : 'text-dark-600 dark:text-dark-400'
    }`}>
      <HiClock className="h-4 w-4" />
      {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
    </div>
  );
}
