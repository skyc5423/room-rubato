'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ROOM_OBJECTS } from '@/lib/room-objects';
import { CompletedDomainResult } from '@/lib/types';

interface RoomCanvasProps {
  completedDomains: Record<number, CompletedDomainResult>;
  hoveredDomainId: number | null;
  activeDomainId: number | null;
  newlyBloomedDomainId: number | null;
  onHoverObject: (domainId: number | null) => void;
  onSelectObject: (domainId: number) => void;
}

export function RoomCanvas({
  completedDomains,
  hoveredDomainId,
  activeDomainId,
  newlyBloomedDomainId,
  onHoverObject,
  onSelectObject,
}: RoomCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Subtle 2.5D Mouse Parallax (-1..1)
  const [mouseNorm, setMouseNorm] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  const [cursorPx, setCursorPx] = useState<{
    x: number;
    y: number;
    visible: boolean;
  }>({
    x: 0,
    y: 0,
    visible: false,
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && activeDomainId !== null) {
        onHoverObject(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeDomainId, onHoverObject]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const relX = e.clientX - rect.left;
    const relY = e.clientY - rect.top;
    const nx = (relX / rect.width - 0.5) * 2;
    const ny = (relY / rect.height - 0.5) * 2;
    setMouseNorm({ x: nx, y: ny });
    setCursorPx({ x: relX, y: relY, visible: true });
  };

  const handleMouseLeave = () => {
    setMouseNorm({ x: 0, y: 0 });
    setCursorPx((prev) => ({ ...prev, visible: false }));
  };

  const completedIds = Object.keys(completedDomains).map(Number);
  const allCompleted = completedIds.length >= 12;

  const activeObj =
    activeDomainId !== null
      ? ROOM_OBJECTS.find((o) => o.domainId === activeDomainId) ?? null
      : null;
  const hoveredObj =
    hoveredDomainId !== null
      ? ROOM_OBJECTS.find((o) => o.domainId === hoveredDomainId) ?? null
      : null;

  // Camera zoom & pan transform on the 1376 x 768 master room canvas
  let cameraTransform = `translate3d(${(mouseNorm.x * -8).toFixed(1)}px, ${(
    mouseNorm.y * -5
  ).toFixed(1)}px, 0px) scale(1.015)`;

  if (activeObj) {
    const targetScale = 2.05;
    const dxPct = ((688 - activeObj.x) / 1376) * 100;
    const dyPct = ((384 - activeObj.y) / 768) * 100;
    cameraTransform = `scale(${targetScale}) translate(${dxPct * 0.58}%, ${
      dyPct * 0.58
    }%)`;
  }

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative w-full h-full overflow-hidden select-none bg-[#FEF1D0]"
    >
      {/* Main Zoomable Illustrated Room Stage */}
      <div
        className="room-camera w-full h-full transition-transform duration-[850ms] ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform"
        style={{
          transform: cameraTransform,
          transformOrigin: 'center center',
        }}
      >
        <svg
          viewBox="0 0 1376 768"
          preserveAspectRatio="xMidYMid meet"
          className="w-full h-full block bg-[#FEF1D0]"
          role="group"
          aria-label="Room Rubato — 열두 개의 사물이 놓인 나의 방 일러스트레이션"
        >
          <defs>
            {/* Organic Watercolor Feathering Filter for the Ink-Bloom Mask */}
            <filter
              id="watercolor-feather"
              x="-20%"
              y="-20%"
              width="140%"
              height="140%"
            >
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.025"
                numOctaves="3"
                result="noise"
              />
              <feDisplacementMap
                in="SourceGraphic"
                in2="noise"
                scale="26"
                xChannelSelector="R"
                yChannelSelector="G"
                result="displaced"
              />
              <feGaussianBlur
                in="displaced"
                stdDeviation="18"
                result="blurred"
              />
            </filter>

            {/* Sunlight Beam Gradient */}
            <linearGradient id="sunBeamOverlay" x1="0.8" y1="0" x2="0.1" y2="1">
              <stop offset="0%" stopColor="#FFFDF5" stopOpacity="0.38" />
              <stop offset="55%" stopColor="#FFF5D6" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#FEF1D0" stopOpacity="0" />
            </linearGradient>

            {/* Watercolor Reveal Mask: White reveals room-colored.jpg over room-sketch.jpg */}
            <mask id="room-watercolor-mask">
              <rect x="0" y="0" width="1376" height="768" fill="black" />
              {allCompleted ? (
                <rect x="0" y="0" width="1376" height="768" fill="white" />
              ) : (
                <g filter="url(#watercolor-feather)">
                  {ROOM_OBJECTS.map((obj) => {
                    const isDone = Boolean(completedDomains[obj.domainId]);
                    const isHov = hoveredDomainId === obj.domainId;
                    const isNew = newlyBloomedDomainId === obj.domainId;

                    if (!isDone && !isHov) return null;

                    return (
                      <g
                        key={`mask-${obj.domainId}`}
                        transform={`translate(${obj.x}, ${obj.y})`}
                      >
                        <ellipse
                          cx="0"
                          cy="0"
                          rx={isDone ? obj.maskRx : obj.maskRx * 0.85}
                          ry={isDone ? obj.maskRy : obj.maskRy * 0.85}
                          fill={isDone ? '#FFFFFF' : 'rgba(255,255,255,0.72)'}
                          className={isNew ? 'animate-ink-bloom' : ''}
                        />
                        {isDone && (
                          <>
                            <circle
                              cx={-obj.maskRx * 0.35}
                              cy={-obj.maskRy * 0.25}
                              r={Math.min(obj.maskRx, obj.maskRy) * 0.65}
                              fill="#FFFFFF"
                            />
                            <circle
                              cx={obj.maskRx * 0.35}
                              cy={obj.maskRy * 0.25}
                              r={Math.min(obj.maskRx, obj.maskRy) * 0.65}
                              fill="#FFFFFF"
                            />
                          </>
                        )}
                      </g>
                    );
                  })}
                </g>
              )}
            </mask>
          </defs>

          {/* ============================================================
              LAYER 0: MASTER UNCOLORED SKETCHBOOK ROOM (room-sketch.jpg)
             ============================================================ */}
          <image
            href="/artwork/room-sketch.jpg"
            x="0"
            y="0"
            width="1376"
            height="768"
          />

          {/* ============================================================
              LAYER 1: WATERCOLOR PAINTED ROOM REVEALED BY MASK (room-colored.jpg)
             ============================================================ */}
          <image
            href="/artwork/room-colored.jpg"
            x="0"
            y="0"
            width="1376"
            height="768"
            mask="url(#room-watercolor-mask)"
          />

          {/* ============================================================
              LAYER 2: AMBIENT SUNLIGHT, STEAM, & RESONANCE THREADS
             ============================================================ */}
          <g className="pointer-events-none">
            {/* Soft swaying afternoon sunbeam from Arched Window */}
            <polygon
              points="760,70 960,120 620,680 420,620"
              fill="url(#sunBeamOverlay)"
              className="animate-sunlight"
            />

            {/* Floating golden dust motes */}
            <g className="animate-dust">
              <circle cx="720" cy="240" r="2.2" fill="#FFFDF5" opacity="0.85" />
              <circle cx="785" cy="310" r="1.8" fill="#E5A93B" opacity="0.75" />
              <circle cx="670" cy="360" r="2.4" fill="#FFFDF5" opacity="0.8" />
              <circle cx="845" cy="280" r="2" fill="#FFFDF5" opacity="0.8" />
              <circle cx="610" cy="490" r="1.9" fill="#E5A93B" opacity="0.7" />
              <circle cx="745" cy="520" r="2.3" fill="#FFFDF5" opacity="0.75" />
            </g>

            {/* Curling warm steam above the teacup on the desk (822, 430) */}
            <path
              d="M 822 426 Q 817 412 825 402 T 820 386"
              fill="none"
              stroke="#D4653B"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeOpacity="0.65"
              className="animate-steam-1"
            />

            {/* Ambient constellation threads connecting already-colored objects */}
            {completedIds.map((idA, idx) => {
              const nextId = completedIds[(idx + 1) % completedIds.length];
              if (!nextId || idA === nextId) return null;
              const objA = ROOM_OBJECTS.find((o) => o.domainId === idA);
              const objB = ROOM_OBJECTS.find((o) => o.domainId === nextId);
              if (!objA || !objB) return null;
              const midX = (objA.x + objB.x) / 2;
              const midY = (objA.y + objB.y) / 2 - 36;
              return (
                <path
                  key={`ambient-thread-${idA}-${nextId}`}
                  d={`M ${objA.x} ${objA.y} Q ${midX} ${midY} ${objB.x} ${objB.y}`}
                  fill="none"
                  stroke="#0042AF"
                  strokeWidth="1.15"
                  strokeDasharray="4 6"
                  strokeOpacity={hoveredObj ? 0.14 : 0.28}
                />
              );
            })}

            {/* Active Resonance Threads when hovering any object */}
            {hoveredObj &&
              completedIds
                .filter((cid) => cid !== hoveredObj.domainId)
                .map((cid) => {
                  const srcObj = ROOM_OBJECTS.find((o) => o.domainId === cid);
                  if (!srcObj) return null;
                  const ctrlX = (srcObj.x + hoveredObj.x) / 2;
                  const ctrlY =
                    Math.min(srcObj.y, hoveredObj.y) -
                    Math.min(95, Math.abs(srcObj.x - hoveredObj.x) * 0.16);

                  return (
                    <g key={`active-thread-${cid}-${hoveredObj.domainId}`}>
                      <path
                        d={`M ${srcObj.x} ${srcObj.y} Q ${ctrlX} ${ctrlY} ${hoveredObj.x} ${hoveredObj.y}`}
                        fill="none"
                        stroke="#D4653B"
                        strokeWidth="4.5"
                        strokeOpacity="0.18"
                      />
                      <path
                        d={`M ${srcObj.x} ${srcObj.y} Q ${ctrlX} ${ctrlY} ${hoveredObj.x} ${hoveredObj.y}`}
                        fill="none"
                        stroke="#D4653B"
                        strokeWidth="2"
                        strokeDasharray="7 5"
                        className="animate-thread-flow"
                      />
                      <circle
                        cx={srcObj.x}
                        cy={srcObj.y}
                        r="4.5"
                        fill="#D4653B"
                        stroke="#FFF9EB"
                        strokeWidth="1.2"
                      />
                    </g>
                  );
                })}
          </g>

          {/* ============================================================
              LAYER 3: INTERACTIVE HOTSPOTS & FLOATING MUSEUM PIN LABELS
             ============================================================ */}
          {ROOM_OBJECTS.map((obj) => {
            const isCompleted = Boolean(completedDomains[obj.domainId]);
            const isHovered = hoveredDomainId === obj.domainId;
            const isNewlyBloomed = newlyBloomedDomainId === obj.domainId;

            return (
              <g
                key={obj.domainId}
                transform={`translate(${obj.x}, ${obj.y})`}
                onMouseEnter={() => onHoverObject(obj.domainId)}
                onMouseLeave={() => onHoverObject(null)}
                onFocus={() => onHoverObject(obj.domainId)}
                onBlur={() => onHoverObject(null)}
                onClick={() => onSelectObject(obj.domainId)}
                className="cursor-pointer group"
                role="button"
                tabIndex={0}
                aria-label={`${obj.objectName} (${obj.domainLabel})`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectObject(obj.domainId);
                  }
                }}
              >
                {/* Invisible Interactive Hit Region over the Illustrated Object */}
                <ellipse
                  cx="0"
                  cy="0"
                  rx={obj.maskRx * 0.72}
                  ry={obj.maskRy * 0.72}
                  fill="transparent"
                />

                {/* Subtle Hover Ring only when hovered */}
                {isHovered && (
                  <ellipse
                    cx="0"
                    cy="0"
                    rx={obj.maskRx * 0.58}
                    ry={obj.maskRy * 0.58}
                    fill="none"
                    stroke="#D4653B"
                    strokeWidth="1.8"
                    strokeDasharray="6 5"
                    strokeOpacity="0.7"
                    className="pointer-events-none"
                  />
                )}

                {/* Ink Bloom Ripple when newly completed */}
                {isNewlyBloomed && (
                  <circle
                    cx="0"
                    cy="0"
                    r="84"
                    fill="none"
                    stroke="#D4653B"
                    strokeWidth="2.5"
                    strokeDasharray="4 6"
                    className="animate-ink-bloom pointer-events-none"
                  />
                )}

                {/* Delicate Museum Pin Label */}
                <g
                  transform={`translate(${obj.pinOffsetX}, ${
                    isHovered ? obj.pinOffsetY - 4 : obj.pinOffsetY
                  })`}
                  className="transition-transform duration-300"
                >
                  {/* Small anchor dot & connector stem */}
                  <circle
                    cx="0"
                    cy="-18"
                    r="2.5"
                    fill={isCompleted ? '#D4653B' : '#0042AF'}
                  />
                  <line
                    x1="0"
                    y1="-16"
                    x2="0"
                    y2="-9"
                    stroke={isCompleted ? '#010D6E' : '#0042AF'}
                    strokeWidth="1.2"
                    strokeOpacity="0.65"
                  />
                  {/* Pill Tag */}
                  <rect
                    x="-84"
                    y="-9"
                    width="168"
                    height="24"
                    rx="12"
                    fill={
                      isHovered
                        ? '#010D6E'
                        : isCompleted
                          ? '#FFF9EB'
                          : '#FEF1D0'
                    }
                    fillOpacity={isCompleted || isHovered ? '0.96' : '0.9'}
                    stroke={
                      isHovered
                        ? '#010D6E'
                        : isCompleted
                          ? '#010D6E'
                          : '#0042AF'
                    }
                    strokeWidth={isCompleted || isHovered ? '1.5' : '1.2'}
                    strokeDasharray={
                      isCompleted || isHovered ? undefined : '4 3'
                    }
                  />
                  {/* Status Dot */}
                  <circle
                    cx="-69"
                    cy="3"
                    r="3.8"
                    fill={
                      isCompleted
                        ? '#D4653B'
                        : isHovered
                          ? '#E5A93B'
                          : 'transparent'
                    }
                    stroke={
                      isHovered
                        ? '#FEF1D0'
                        : isCompleted
                          ? '#010D6E'
                          : '#0042AF'
                    }
                    strokeWidth="1.3"
                  />
                  <text
                    x="6"
                    y="7"
                    textAnchor="middle"
                    fill={isHovered ? '#FEF1D0' : '#010D6E'}
                    fontSize="11.5"
                    fontWeight={isCompleted || isHovered ? '600' : '500'}
                    letterSpacing="-0.02em"
                  >
                    {obj.shortObject} · {obj.domainLabel}
                  </text>
                </g>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Custom Tactile Magnetic Cursor Lens (Desktop) */}
      {cursorPx.visible && !activeObj && (
        <div
          className="pointer-events-none hidden lg:flex fixed z-20 items-center justify-center transition-transform duration-150 ease-out"
          style={{
            left: 0,
            top: 0,
            transform: `translate3d(${cursorPx.x}px, ${cursorPx.y}px, 0)`,
          }}
        >
          <div
            className={`-translate-x-1/2 -translate-y-1/2 rounded-full flex items-center justify-center transition-all duration-300 ${
              hoveredObj
                ? 'w-20 h-20 bg-[#010D6E]/90 text-[#FEF1D0] border border-[#FEF1D0]/60 shadow-lg scale-100'
                : 'w-5 h-5 border border-[#0042AF]/50 bg-[#0042AF]/10 scale-90'
            }`}
          >
            {hoveredObj && (
              <span className="text-[11px] font-medium tracking-tight text-center leading-tight px-1">
                {completedDomains[hoveredObj.domainId]
                  ? '다시 보기'
                  : '색 채우기'}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
