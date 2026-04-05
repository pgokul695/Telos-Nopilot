import { useEffect, useState } from "react";
import { BP } from "../constants/breakpoints";

function getInitialState() {
  if (typeof window === "undefined") {
    return {
      width: BP.desktop,
      hasFinePointer: true,
    };
  }

  return {
    width: window.innerWidth,
    hasFinePointer: window.matchMedia("(hover: hover) and (pointer: fine)").matches,
  };
}

export function useBreakpoint() {
  const [state, setState] = useState(getInitialState);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const media = window.matchMedia("(hover: hover) and (pointer: fine)");
    const update = () => {
      setState({
        width: window.innerWidth,
        hasFinePointer: media.matches,
      });
    };

    update();
    window.addEventListener("resize", update);
    media.addEventListener("change", update);

    return () => {
      window.removeEventListener("resize", update);
      media.removeEventListener("change", update);
    };
  }, []);

  const { width, hasFinePointer } = state;
  return {
    isMobile: width <= BP.mobile,
    isTablet: width > BP.mobile && width <= BP.laptop,
    isLaptop: width > BP.tablet && width <= BP.laptop,
    isDesktop: width > BP.laptop,
    hasFinePointer,
    isTouchDevice: !hasFinePointer,
    width,
  };
}
