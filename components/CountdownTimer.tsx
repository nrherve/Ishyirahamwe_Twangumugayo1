
import React, { useState, useEffect } from 'react';
import { useLanguage } from '../LanguageContext';

interface CountdownTimerProps {
  targetDate: string;
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({ targetDate }) => {
  const { t } = useLanguage();
  const [timeLeft, setTimeLeft] = useState<{ days: number, hours: number, minutes: number, seconds: number } | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      const difference = +new Date(targetDate) - +new Date();
      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      } else {
        setTimeLeft(null);
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  if (!timeLeft) {
    return (
      <div className="text-center p-6 bg-green-50 border border-green-200 rounded-xl">
        <p className="text-green-700 font-bold text-xl">🎉 {t('todayPayout')}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <p className="text-slate-500 text-sm mb-4 font-medium uppercase tracking-wider">{t('timeUntil')}</p>
      <div className="flex gap-4">
        {[
          { label: t('days'), value: timeLeft.days },
          { label: t('hours'), value: timeLeft.hours },
          { label: t('mins'), value: timeLeft.minutes },
          { label: t('secs'), value: timeLeft.seconds }
        ].map((unit) => (
          <div key={unit.label} className="flex flex-col items-center bg-indigo-50 border border-indigo-100 rounded-lg p-3 w-20 shadow-sm">
            <span className="text-3xl font-bold text-indigo-700">{unit.value.toString().padStart(2, '0')}</span>
            <span className="text-[10px] text-indigo-400 font-black uppercase tracking-tighter">{unit.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CountdownTimer;
