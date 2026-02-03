import { useEffect, useRef } from "react";

/**
 * xhlrmsgkrhtlvek = 테스트하고싶다 (Korean layout)
 */
const SECRET_CODE = "xhlrmsgkrhtlvek";

export const useEasterEgg = (onTrigger: () => void) => {
  const inputSequence = useRef<string>("");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if it's a modifier key
      if (e.key.length > 1) return;

      inputSequence.current += e.key.toLowerCase();

      // Keep only the last N characters where N is the length of our secret code
      if (inputSequence.current.length > SECRET_CODE.length) {
        inputSequence.current = inputSequence.current.slice(-SECRET_CODE.length);
      }

      if (inputSequence.current === SECRET_CODE) {
        console.log("🚀 Easter Egg Activated: GOD MODE UNLOCKED");
        onTrigger();
        inputSequence.current = ""; // Reset after trigger
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onTrigger]);
};
