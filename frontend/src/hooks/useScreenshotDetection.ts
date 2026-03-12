import { useCallback, useEffect, useRef, useState } from "react";

const COOLDOWN_MS = 1000;

export function useScreenshotDetection(active: boolean) {
  const [triggered, setTriggered] = useState(false);
  const lastTriggerRef = useRef(0);

  const trigger = useCallback(() => {
    const now = Date.now();
    if (now - lastTriggerRef.current < COOLDOWN_MS) return;
    lastTriggerRef.current = now;
    setTriggered(true);
  }, []);

  const dismiss = useCallback(() => {
    setTriggered(false);
  }, []);

  // Reset when viewer closes
  useEffect(() => {
    if (!active) {
      setTriggered(false);
    }
  }, [active]);

  useEffect(() => {
    if (!active) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "PrintScreen") {
        trigger();
        return;
      }
      // Mac screenshot: Cmd+Shift held together
      if (e.metaKey && e.shiftKey) {
        trigger();
        return;
      }
    };

    // Screenshot tools often steal focus from the browser
    const handleBlur = () => {
      trigger();
    };

    // Block right-click context menu (save image as...)
    const handleContextMenu = (e: Event) => {
      e.preventDefault();
      trigger();
    };

    window.addEventListener("keydown", handleKeyDown, true);
    window.addEventListener("blur", handleBlur);
    document.addEventListener("contextmenu", handleContextMenu, true);

    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
      window.removeEventListener("blur", handleBlur);
      document.removeEventListener("contextmenu", handleContextMenu, true);
    };
  }, [active, trigger]);

  return { triggered, dismiss };
}
