"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useRef, useState } from "react";
import { TextLayout } from "@/lib/types";

type EditableKey = "unit" | "counter";

interface PhotoTransform {
  x: number;
  y: number;
  scale: number;
}

interface FrameCanvasProps {
  frameImage?: string;
  photo?: string | null;
  width: number;
  height: number;
  unitLabel: string;
  counterLabel: string;
  unitText: TextLayout;
  counterText: TextLayout;
  photoTransform: PhotoTransform;
  onPhotoTransformChange?: (transform: PhotoTransform) => void;
  onUnitTextChange?: (next: TextLayout) => void;
  onCounterTextChange?: (next: TextLayout) => void;
  editableText?: boolean;
  activeText?: EditableKey | null;
  onActiveTextChange?: (key: EditableKey) => void;
}

interface Point {
  x: number;
  y: number;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function FrameCanvas({
  frameImage,
  photo,
  width,
  height,
  unitLabel,
  counterLabel,
  unitText,
  counterText,
  photoTransform,
  onPhotoTransformChange,
  onUnitTextChange,
  onCounterTextChange,
  editableText = false,
  activeText,
  onActiveTextChange,
}: FrameCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [photoNatural, setPhotoNatural] = useState({ width: 0, height: 0 });

  const pointers = useRef<Map<number, Point>>(new Map());
  const panAnchor = useRef<Point | null>(null);
  const pinchAnchorDistance = useRef<number | null>(null);
  const pinchAnchorScale = useRef<number>(1);

  const unitPointers = useRef<Map<number, Point>>(new Map());
  const counterPointers = useRef<Map<number, Point>>(new Map());
  const unitDragOffset = useRef<Point | null>(null);
  const counterDragOffset = useRef<Point | null>(null);
  const unitPinchDistance = useRef<number | null>(null);
  const counterPinchDistance = useRef<number | null>(null);
  const unitPinchFont = useRef<number>(unitText.fontSize);
  const counterPinchFont = useRef<number>(counterText.fontSize);

  useEffect(() => {
    if (!photo) {
      return;
    }
    const img = new Image();
    img.src = photo;
    img.onload = () => {
      setPhotoNatural({ width: img.naturalWidth, height: img.naturalHeight });
    };
  }, [photo]);

  const baseScale = useMemo(() => {
    if (!photoNatural.width || !photoNatural.height) {
      return 1;
    }
    return Math.min(width / photoNatural.width, height / photoNatural.height);
  }, [photoNatural, width, height]);

  const effectiveScale = baseScale * photoTransform.scale;

  const onPhotoPointerDown = (event: React.PointerEvent<HTMLImageElement>) => {
    if (!onPhotoTransformChange) {
      return;
    }
    const target = event.currentTarget;
    target.setPointerCapture(event.pointerId);
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (pointers.current.size === 1) {
      panAnchor.current = { x: event.clientX, y: event.clientY };
    }

    if (pointers.current.size === 2) {
      const pts = Array.from(pointers.current.values());
      pinchAnchorDistance.current = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      pinchAnchorScale.current = photoTransform.scale;
    }
  };

  const onPhotoPointerMove = (event: React.PointerEvent<HTMLImageElement>) => {
    if (!onPhotoTransformChange || !pointers.current.has(event.pointerId)) {
      return;
    }

    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    const next = { ...photoTransform };

    if (pointers.current.size === 1 && panAnchor.current) {
      const dx = event.clientX - panAnchor.current.x;
      const dy = event.clientY - panAnchor.current.y;
      next.x += dx;
      next.y += dy;
      panAnchor.current = { x: event.clientX, y: event.clientY };
    }

    if (pointers.current.size === 2 && pinchAnchorDistance.current) {
      const pts = Array.from(pointers.current.values());
      const currentDistance = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      const scaleFactor = currentDistance / pinchAnchorDistance.current;
      next.scale = clamp(pinchAnchorScale.current * scaleFactor, 0.25, 6);
    }

    onPhotoTransformChange(next);
  };

  const onPhotoPointerUp = (event: React.PointerEvent<HTMLImageElement>) => {
    pointers.current.delete(event.pointerId);

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    if (pointers.current.size < 2) {
      pinchAnchorDistance.current = null;
    }

    if (pointers.current.size === 1) {
      const last = Array.from(pointers.current.values())[0];
      panAnchor.current = last;
    } else {
      panAnchor.current = null;
    }
  };

  const updateLayout = (key: EditableKey, next: TextLayout) => {
    if (key === "unit") {
      onUnitTextChange?.(next);
    } else {
      onCounterTextChange?.(next);
    }
  };

  const resolvePointers = (key: EditableKey) => (key === "unit" ? unitPointers.current : counterPointers.current);
  const resolveDragOffset = (key: EditableKey) => (key === "unit" ? unitDragOffset : counterDragOffset);
  const resolvePinchDistance = (key: EditableKey) => (key === "unit" ? unitPinchDistance : counterPinchDistance);
  const resolvePinchFont = (key: EditableKey) => (key === "unit" ? unitPinchFont : counterPinchFont);

  const onTextPointerDown = (
    key: EditableKey,
    current: TextLayout,
    event: React.PointerEvent<HTMLDivElement>,
  ) => {
    if (!editableText || !containerRef.current) {
      return;
    }

    onActiveTextChange?.(key);

    const map = resolvePointers(key);
    map.set(event.pointerId, { x: event.clientX, y: event.clientY });
    event.currentTarget.setPointerCapture(event.pointerId);

    const containerRect = containerRef.current.getBoundingClientRect();
    const overlayRect = event.currentTarget.getBoundingClientRect();
    const dragOffsetRef = resolveDragOffset(key);

    if (map.size === 1) {
      dragOffsetRef.current = {
        x: event.clientX - overlayRect.left,
        y: event.clientY - overlayRect.top,
      };
    }

    if (map.size === 2) {
      const points = Array.from(map.values());
      resolvePinchDistance(key).current = Math.hypot(
        points[0].x - points[1].x,
        points[0].y - points[1].y,
      );
      resolvePinchFont(key).current = current.fontSize;
    }

    const posX = (overlayRect.left - containerRect.left) / width;
    const posY = (overlayRect.top - containerRect.top) / height;
    updateLayout(key, { ...current, x: clamp(posX, 0, 0.98), y: clamp(posY, 0, 0.98) });
  };

  const onTextPointerMove = (
    key: EditableKey,
    current: TextLayout,
    event: React.PointerEvent<HTMLDivElement>,
  ) => {
    if (!editableText || !containerRef.current) {
      return;
    }

    const map = resolvePointers(key);
    if (!map.has(event.pointerId)) {
      return;
    }

    map.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (map.size === 1) {
      const dragOffsetRef = resolveDragOffset(key);
      if (!dragOffsetRef.current) {
        return;
      }

      const rect = containerRef.current.getBoundingClientRect();
      const x = (event.clientX - rect.left - dragOffsetRef.current.x) / width;
      const y = (event.clientY - rect.top - dragOffsetRef.current.y) / height;
      updateLayout(key, {
        ...current,
        x: clamp(x, 0, 0.92),
        y: clamp(y, 0, 0.92),
      });
      return;
    }

    if (map.size === 2) {
      const points = Array.from(map.values());
      const currentDistance = Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y);
      const initialDistance = resolvePinchDistance(key).current;
      if (!initialDistance) {
        return;
      }
      const fontScale = currentDistance / initialDistance;
      const startFont = resolvePinchFont(key).current;
      updateLayout(key, {
        ...current,
        fontSize: clamp(Math.round(startFont * fontScale), 12, 96),
      });
    }
  };

  const onTextPointerUp = (key: EditableKey, event: React.PointerEvent<HTMLDivElement>) => {
    const map = resolvePointers(key);
    map.delete(event.pointerId);

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    if (map.size < 2) {
      resolvePinchDistance(key).current = null;
    }

    if (map.size === 0) {
      resolveDragOffset(key).current = null;
    }
  };

  const renderText = (key: EditableKey, label: string, layout: TextLayout) => {
    const isSelected = activeText === key;

    return (
      <div
        role={editableText ? "button" : undefined}
        tabIndex={editableText ? 0 : undefined}
        onPointerDown={(event) => onTextPointerDown(key, layout, event)}
        onPointerMove={(event) => onTextPointerMove(key, layout, event)}
        onPointerUp={(event) => onTextPointerUp(key, event)}
        onPointerCancel={(event) => onTextPointerUp(key, event)}
        onClick={() => editableText && onActiveTextChange?.(key)}
        style={{
          position: "absolute",
          left: `${layout.x * 100}%`,
          top: `${layout.y * 100}%`,
          color: layout.color,
          fontSize: layout.fontSize,
          fontFamily: layout.fontFamily,
          fontWeight: layout.fontWeight,
          textShadow: "0 2px 4px rgba(0,0,0,0.38)",
          cursor: editableText ? "grab" : "default",
          userSelect: "none",
          touchAction: "none",
          outline: editableText && isSelected ? "2px dashed rgba(255, 230, 154, 0.95)" : "none",
          borderRadius: "8px",
          padding: editableText ? "4px 8px" : 0,
          backgroundColor: editableText && isSelected ? "rgba(8, 24, 26, 0.4)" : "transparent",
          transition: "background-color 150ms ease",
          zIndex: 40,
        }}
      >
        {label}
      </div>
    );
  };

  return (
    <div
      ref={containerRef}
      style={{
        width,
        height,
        position: "relative",
        borderRadius: 18,
        overflow: "hidden",
        background: "#f8fafc",
        boxShadow: "inset 0 0 0 1px #e5e7eb",
      }}
    >
      {photo ? (
        <img
          src={photo}
          alt="Uploaded"
          draggable={false}
          onPointerDown={onPhotoPointerDown}
          onPointerMove={onPhotoPointerMove}
          onPointerUp={onPhotoPointerUp}
          onPointerCancel={onPhotoPointerUp}
          style={{
            position: "absolute",
            width: photoNatural.width || width,
            height: photoNatural.height || height,
            left: "50%",
            top: "50%",
            transform: `translate(calc(-50% + ${photoTransform.x}px), calc(-50% + ${photoTransform.y}px)) scale(${effectiveScale})`,
            transformOrigin: "center",
            touchAction: "none",
            maxWidth: "none",
            maxHeight: "none",
            zIndex: 10,
            cursor: onPhotoTransformChange ? "move" : "default",
          }}
        />
      ) : null}

      {renderText("unit", unitLabel, unitText)}
      {renderText("counter", counterLabel, counterText)}

      {frameImage ? (
        <img
          src={frameImage}
          alt="Frame"
          draggable={false}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            pointerEvents: "none",
            zIndex: 30,
          }}
        />
      ) : null}
    </div>
  );
}
