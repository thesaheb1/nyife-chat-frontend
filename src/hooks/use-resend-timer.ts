import { useState, useEffect, useCallback, useRef } from "react";

// Pure utility — no reason to live inside the hook
const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
};

interface UseResendTimerReturn {
  timeLeft: number;
  isActive: boolean;
  canResend: boolean;
  formattedTime: string;
  startTimer: () => void;
  stopTimer: () => void;
  resetTimer: () => void;
}

const useResendTimer = (initialTime: number = 60): UseResendTimerReturn => {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isActive, setIsActive] = useState<boolean>(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startTimeRef = useRef<number | null>(null);

  const clearTimers = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // Cleanup everything on unmount
  useEffect(() => () => clearTimers(), [clearTimers]);

  const stopTimer = useCallback(() => {
    clearTimers();
    setIsActive(false);
    setTimeLeft(0);
  }, [clearTimers]);

  const startTimer = useCallback(() => {
    clearTimers();

    setTimeLeft(initialTime);
    setIsActive(true);
    startTimeRef.current = Date.now();

    intervalRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTimeRef.current!) / 1000);
      const remaining = Math.max(0, initialTime - elapsed);

      setTimeLeft(remaining);

      if (remaining <= 0) {
        clearInterval(intervalRef.current!);
        intervalRef.current = null;
        setIsActive(false);
      }
    }, 100);

    // Safety net: guarantee cleanup after full duration
    timeoutRef.current = setTimeout(() => {
      clearInterval(intervalRef.current!);
      intervalRef.current = null;
      setIsActive(false);
      setTimeLeft(0);
    }, initialTime * 1000 + 200);
  }, [initialTime, clearTimers]);

  const resetTimer = useCallback(() => {
    startTimer();
  }, [startTimer]);

  return {
    timeLeft,
    isActive,
    canResend: !isActive && timeLeft === 0,
    formattedTime: formatTime(timeLeft),
    startTimer,
    stopTimer,
    resetTimer,
  };
};

export default useResendTimer;