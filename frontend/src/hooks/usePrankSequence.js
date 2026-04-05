import { useCallback, useEffect, useRef, useState } from "react";

export function usePrankSequence() {
  const [isChaos, setIsChaos] = useState(false);
  const timerRef = useRef(null);

  const startChaos = useCallback((durationMs, onEnd) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    setIsChaos(true);
    timerRef.current = setTimeout(() => {
      setIsChaos(false);
      onEnd?.();
    }, durationMs);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return { isChaos, startChaos };
}
