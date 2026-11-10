import { useEffect, useRef } from "react";

const MIN_GAP_MS = 3000; // al volver a la app se disparan varios eventos seguidos

// Avisa cuando conviene volver a leer las tomas: si se marcó una desde la notificación
// o si la persona regresa a la app.
export function useIntakeSync(onSync: () => void) {
  const callback = useRef(onSync);

  useEffect(() => {
    callback.current = onSync;
  });

  useEffect(() => {
    let last = 0;
    const run = (force: boolean) => {
      const now = Date.now();
      if (!force && now - last < MIN_GAP_MS) return;
      last = now;
      callback.current();
    };

    const onMessage = (event: MessageEvent) => {
      if ((event.data as { type?: string } | null)?.type === "doses-updated") run(true);
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") run(false);
    };
    const onFocus = () => run(false);

    navigator.serviceWorker?.addEventListener("message", onMessage);
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onFocus);

    return () => {
      navigator.serviceWorker?.removeEventListener("message", onMessage);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onFocus);
    };
  }, []);
}
