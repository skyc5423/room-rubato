'use client';

import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

/** DOM order for ordinary controls, with positive tabindex preceding it as in native navigation. */
function firstSummary(details:Element){return Array.from(details.children).find(child=>child.tagName==='SUMMARY');}
function dialogTabStops(panel:HTMLElement):HTMLElement[] {
  return Array.from(panel.querySelectorAll<HTMLElement>('button, a[href], input, select, textarea, summary, [tabindex]'))
    .filter(item=>{
      if(item.tabIndex<0 || item.matches(':disabled, input[type="hidden"]') || item.closest('[hidden], [inert]'))return false;
      if(!item.getClientRects().length || getComputedStyle(item).visibility==='hidden' || getComputedStyle(item).visibility==='collapse')return false;
      // Only the first summary is a native disclosure control; closed contents are not tab stops.
      if(item.tagName==='SUMMARY' && !item.hasAttribute('tabindex') && item.parentElement?.tagName==='DETAILS' && firstSummary(item.parentElement)!==item)return false;
      for(let ancestor=item.parentElement;ancestor&&ancestor!==panel;ancestor=ancestor.parentElement){
        if(ancestor.tagName==='DETAILS'&&!ancestor.hasAttribute('open')){
          const summary=firstSummary(ancestor);
          if(!summary?.contains(item))return false;
        }
      }
      return true;
    })
    .sort((a,b)=>(a.tabIndex>0?a.tabIndex:Infinity)-(b.tabIndex>0?b.tabIndex:Infinity));
}

/** A viewport-level dialog: it must not be trapped under the room/header stacking contexts. */
export function RoomDialog({ children, onClose }: {children: React.ReactNode; onClose: () => void}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const panel = panelRef.current;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panel?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); closeRef.current(); }
      if (event.key !== 'Tab' || !panel) return;
      const items = dialogTabStops(panel);
      const first = items[0]; const last = items[items.length - 1];
      if (!first) { event.preventDefault(); panel.focus(); return; }
      if (event.shiftKey && (document.activeElement === first || (document.activeElement === panel || !panel.contains(document.activeElement)))) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || (document.activeElement === panel || !panel.contains(document.activeElement)))) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
      if(previousFocus?.isConnected && 'focus' in previousFocus && typeof previousFocus.focus==='function')previousFocus.focus();
    };
  }, []);
  return createPortal(
    <div ref={panelRef} role="dialog" aria-modal="true" aria-label="취향 질문과 결과" tabIndex={-1}
      className="fixed inset-0 z-[60] bg-[#FEF1D0]/95 backdrop-blur-[6px] flex items-start justify-center p-3 sm:p-6 overflow-y-auto overscroll-contain outline-none">
      {children}
    </div>, document.body,
  );
}
