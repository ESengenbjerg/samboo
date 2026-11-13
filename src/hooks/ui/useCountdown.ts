import { useCallback, useEffect, useRef, useState } from "react";

// Countdown for email
export function useCountdown(seconds = 30, autoStart = true) {
  const [countdown, setCountdown] = useState(autoStart ? seconds : 0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopCountdown = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startInterval = useCallback(() => {
    stopCountdown();
    intervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          // Stop countdown and set state to 0 when countdown is finished
          stopCountdown();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [stopCountdown]);

  const restartCountdown = useCallback(() => {
    setCountdown(seconds);
    startInterval();
  }, [seconds, startInterval]);

  useEffect(() => {
    if (autoStart) startInterval();
    return stopCountdown;
  }, [autoStart, startInterval, stopCountdown]);

  return { countdown, restartCountdown };
}
