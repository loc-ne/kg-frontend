import React, { useEffect } from 'react';

interface ClockProps {
  initialMinutes: number;
  initialSeconds?: number;
  increment?: number;
  isActive?: boolean;
  onTimeUp?: () => void;
}

const Clock = ({ 
  initialMinutes, 
  initialSeconds = 0, 
  isActive = false,
  onTimeUp 
}: ClockProps) => {
  const [minutes, setMinutes] = React.useState(initialMinutes);
  const [seconds, setSeconds] = React.useState(initialSeconds);
  const timerRef = React.useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isActive) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    timerRef.current = setInterval(() => {
      setSeconds(prevSeconds => {
        if (prevSeconds > 0) {
          return prevSeconds - 1;
        } else {
          setMinutes(prevMinutes => {
            const newMinutes = prevMinutes - 1;
            
            // ✅ Kiểm tra hết thời gian
            if (newMinutes < 0) {
              onTimeUp?.();
              return 0;
            }
            
            return newMinutes;
          });
          
          return 59; // ✅ 59 chứ không phải 60
        }
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isActive, onTimeUp]);

  // ✅ Format hiển thị
  const formatTime = (min: number, sec: number) => {
    return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  // ✅ Kiểm tra thời gian nguy hiểm
  const isLowTime = minutes < 1 && seconds <= 30;
  const isVeryLowTime = minutes === 0 && seconds <= 10;

  return (
    <div 
      className={`
        text-2xl font-mono font-bold p-3 
        ${isVeryLowTime ? 'bg-red-600 text-black animate-pulse' : 
          isLowTime ? 'bg-yellow-500 text-black' : 
          'bg-white text-black'}
      `}
    >
       {formatTime(minutes, seconds)}

    </div>
  );
};

export default Clock;