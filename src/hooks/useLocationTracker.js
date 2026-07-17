import { useRef, useCallback } from "react";
import { recordTrail } from "../api/field.api.js";

export function useLocationTracker() {
  const interval = useRef(null);
  const points   = useRef([]);

  const start = useCallback(() => {
    if (interval.current) return;
    interval.current = setInterval(() => {
      if (!navigator.geolocation) return;
      navigator.geolocation.getCurrentPosition(pos => {
        const pt = { lat: pos.coords.latitude, lng: pos.coords.longitude, ts: Date.now() };
        points.current.push(pt);
        if (points.current.length >= 5) {
          recordTrail({ points: [...points.current] }).catch(() => {});
          points.current = [];
        }
      }, () => {}, { enableHighAccuracy: true });
    }, 30000);
  }, []);

  const stop = useCallback(() => {
    if (interval.current) { clearInterval(interval.current); interval.current = null; }
    if (points.current.length > 0) {
      recordTrail({ points: [...points.current] }).catch(() => {});
      points.current = [];
    }
  }, []);

  return { start, stop };
}
