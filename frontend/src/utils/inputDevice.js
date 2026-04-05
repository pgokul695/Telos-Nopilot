import { useEffect, useState } from "react";

const TOUCH_PRIMARY_QUERY = "(hover: none) and (pointer: coarse)";

export function isTouchPrimary() {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }
  return window.matchMedia(TOUCH_PRIMARY_QUERY).matches;
}

export function useIsTouchPrimary() {
  const [isTouch, setIsTouch] = useState(() => isTouchPrimary());

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return;
    }

    const mediaQuery = window.matchMedia(TOUCH_PRIMARY_QUERY);
    const onChange = (event) => {
      setIsTouch(event.matches);
    };

    setIsTouch(mediaQuery.matches);
    mediaQuery.addEventListener("change", onChange);
    return () => mediaQuery.removeEventListener("change", onChange);
  }, []);

  return isTouch;
}
