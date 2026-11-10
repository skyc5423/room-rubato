'use client';

import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

/** A viewport-level dialog: it must not be trapped under the room/header stacking contexts. */
export function RoomDialog({ children, onClose }: {children: React.ReactNode; onClose: () => void}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const panel = panelRef.current;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panel?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); closeRef.current(); }
      if (event.key !== 'Tab' || !panel) return;
      const items = Array.from(panel.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), [tabindex="0"]'));
      const first = items[0]; const last = items[items.length - 1];
      if (!first) { event.preventDefault(); return; }
      if (event.shiftKey && (document.activeElement === first || document.activeElement === panel)) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || document.activeElement === panel)) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
      previousFocus?.focus();
    };
  }, []);
  return createPortal(
    <div ref={panelRef} role="dialog" aria-modal="true" aria-label="취향 질문과 결과" tabIndex={-1}
      className="fixed inset-0 z-[60] bg-[#FEF1D0]/95 backdrop-blur-[6px] flex items-start justify-center p-3 sm:p-6 overflow-y-auto overscroll-contain outline-none">
      {children}
    </div>, document.body,
  );
}
