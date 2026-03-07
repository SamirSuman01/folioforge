'use client';

import { useEffect, useRef } from 'react';

// Section IDs that templates should use as data-section attributes
export const TRACKED_SECTIONS = ['stats', 'experience', 'education', 'skills'] as const;
export type TrackedSection = (typeof TRACKED_SECTIONS)[number];

interface SectionTimes {
  [key: string]: number; // section name → seconds spent
}

export default function AnalyticsTracker({ portfolioId }: { portfolioId: string }) {
  const sectionTimers = useRef<Map<string, number>>(new Map()); // section → timestamp when entered
  const sectionTotals = useRef<SectionTimes>({});
  const isHidden = useRef(false);

  useEffect(() => {
    const startTime = Date.now();

    // Track initial page view
    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        portfolioId,
        referrer: document.referrer || 'direct',
      }),
    });

    // ── Section-level tracking with IntersectionObserver ──
    const observer = new IntersectionObserver(
      (entries) => {
        if (isHidden.current) return;
        entries.forEach((entry) => {
          const section = entry.target.getAttribute('data-section');
          if (!section) return;

          if (entry.isIntersecting) {
            // Section entered viewport (50%+) → start timer
            sectionTimers.current.set(section, Date.now());
          } else {
            // Section left viewport → accumulate time
            const entered = sectionTimers.current.get(section);
            if (entered) {
              const elapsed = Math.round((Date.now() - entered) / 1000);
              if (elapsed >= 1) { // minimum 1s to count
                sectionTotals.current[section] = (sectionTotals.current[section] || 0) + elapsed;
              }
              sectionTimers.current.delete(section);
            }
          }
        });
      },
      { threshold: 0.5 } // section must be 50% visible
    );

    // Observe all elements with data-section attribute
    const sections = document.querySelectorAll('[data-section]');
    sections.forEach((el) => observer.observe(el));

    // ── Duration + section tracking on leave ──
    const flushTimers = () => {
      // Flush any active section timers
      sectionTimers.current.forEach((entered, section) => {
        const elapsed = Math.round((Date.now() - entered) / 1000);
        if (elapsed >= 1) {
          sectionTotals.current[section] = (sectionTotals.current[section] || 0) + elapsed;
        }
      });
      sectionTimers.current.clear();
    };

    const trackDuration = () => {
      const duration = Math.round((Date.now() - startTime) / 1000);
      if (duration < 2) return;

      flushTimers();

      const blob = new Blob(
        [JSON.stringify({
          portfolioId,
          duration,
          sectionTimes: sectionTotals.current,
          type: 'duration_update',
        })],
        { type: 'application/json' }
      );
      navigator.sendBeacon('/api/track', blob);
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        isHidden.current = true;
        // Pause all active section timers
        flushTimers();
        trackDuration();
      } else {
        isHidden.current = false;
        // Resume: re-check which sections are visible
        // Observer will fire automatically for visible sections
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', trackDuration);

    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', trackDuration);
    };
  }, [portfolioId]);

  return null;
}
