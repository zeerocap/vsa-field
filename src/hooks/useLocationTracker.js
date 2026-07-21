import { useRef, useCallback, useEffect, useState } from "react";
import { recordTrail } from "../api/field.api.js";

const SAMPLE_MS   = 30000;
const FLUSH_EVERY = 5;

/**
 * Records the PRO's GPS breadcrumb while checked in.
 *
 * Previously this leaked: the interval was only cleared by an explicit stop(),
 * which happens solely in handleCheckOut. Navigating away from /checkin while
 * checked in unmounted the component with the interval still running against a
 * dead closure, and remounting started a SECOND one — double-reporting every
 * point. It also swallowed permission denials silently and dropped up to four
 * buffered points whenever the tab closed.
 */
export function useLocationTracker() {
  const interval = useRef(null);
  const points   = useRef([]);
  const [error, setError] = useState(null);   // surfaced so a denial is not silent

  const flush = useCallback(async () => {
    if (!points.current.length) return;
    const batch = points.current;
    points.current = [];
    const res = await recordTrail({ points: batch });
    // Keep the batch on failure so the next flush retries it rather than losing
    // the trail on one bad request — a field app is offline regularly.
    if (res && res.ok === false) points.current = batch.concat(points.current);
  }, []);

  const start = useCallback(() => {
    if (interval.current) return;
    interval.current = setInterval(() => {
      if (!navigator.geolocation) { setError("This device has no GPS."); return; }
      navigator.geolocation.getCurrentPosition(
        pos => {
          setError(null);
          points.current.push({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            ts: Date.now(),
          });
          if (points.current.length >= FLUSH_EVERY) flush();
        },
        err => {
          // Silent failure here means an admin sees a gap in the trail with no
          // explanation, and the rep never knows they stopped being tracked.
          setError(err.code === err.PERMISSION_DENIED
            ? "Location is off. Your visit trail is not being recorded."
            : "Could not read your location.");
        },
        { enableHighAccuracy: true, timeout: 20000, maximumAge: 10000 },
      );
    }, SAMPLE_MS);
  }, [flush]);

  const stop = useCallback(() => {
    if (interval.current) { clearInterval(interval.current); interval.current = null; }
    flush();
  }, [flush]);

  // Stop on unmount, and flush what is buffered before the tab goes away.
  useEffect(() => {
    const onHide = () => { if (document.visibilityState === "hidden") flush(); };
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", flush);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", flush);
      if (interval.current) { clearInterval(interval.current); interval.current = null; }
      flush();
    };
  }, [flush]);

  return { start, stop, error };
}
