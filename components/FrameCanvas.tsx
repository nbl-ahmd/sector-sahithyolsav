"use client";
/* eslint-disable @next/next/no-img-element */

import { CSSProperties, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { FamilyTextLayout, TextLayout } from "@/lib/types";

type EditableKey = "unit" | "counter" | "family";

type DraggableKey = "unit" | "counter";

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
  familyName?: string;
  counterLabel: string;
  unitText: TextLayout;
  counterText: TextLayout;
  familyText: FamilyTextLayout;
  photoTransform: PhotoTransform;
  onPhotoTransformChange?: (transform: PhotoTransform) => void;
  onUnitTextChange?: (next: TextLayout) => void;
  onCounterTextChange?: (next: TextLayout) => void;
  onFamilyTextChange?: (next: FamilyTextLayout) => void;
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
  familyName,
  counterLabel,
  unitText,
  counterText,
  familyText,
  photoTransform,
  onPhotoTransformChange,
  onUnitTextChange,
  onCounterTextChange,
  onFamilyTextChange,
  editableText = false,
  activeText,
  onActiveTextChange,
}: FrameCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const familyMeasureRef = useRef<HTMLDivElement>(null);
  const [photoNatural, setPhotoNatural] = useState({ width: 0, height: 0 });
  const [familyRender, setFamilyRender] = useState({
    fontSize: familyText.fontSize,
    width: Math.max(1, Math.round(width * clamp(familyText.width, 0.08, 0.9))),
    height: Math.max(1, Math.round(height * clamp(familyText.height, 0.06, 0.5))),
    left: Math.round(width * familyText.x),
    top: Math.round(height * familyText.y),
    isWrapped: false,
  });

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
  const familyPointers = useRef<Map<number, Point>>(new Map());
  const familyDragOffset = useRef<Point | null>(null);

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
    return Math.max(width / photoNatural.width, height / photoNatural.height);
  }, [photoNatural, width, height]);

  const effectiveScale = baseScale * photoTransform.scale;

  useEffect(() => {
    console.log("[FrameCanvas][family-keystroke]", {
      rawFamilyName: familyName ?? "",
      trimmedFamilyName: familyName?.trim() ?? "",
      length: familyName?.length ?? 0,
      ts: Date.now(),
    });
  }, [familyName]);

  useLayoutEffect(() => {
    const content = familyName?.trim();
    if (!content) {
      return;
    }

    const measurer = familyMeasureRef.current;
    if (!measurer) {
      return;
    }

    const maxWidthPercent = clamp(familyText.width, 0.08, 0.9);
    const maxBoxWidthPx = Math.max(1, Math.round(width * maxWidthPercent));
    const maxHeightPercent = clamp(familyText.height, 0.06, 0.5);
    const maxHeightPx = Math.max(1, Math.round(height * maxHeightPercent));
    const fontSize = Math.max(8, Math.round(familyText.fontSize));
    const hasBackground = familyText.showBackground ?? true;
    const textAlign = familyText.textAlign ?? "center";
    const configuredTop = clamp(
      Math.round(familyText.y * height),
      0,
      Math.max(0, height - maxHeightPx),
    );
    const anchoredBottom = configuredTop + maxHeightPx;
    const lineHeight = 1.2;
    const padding = hasBackground ? clamp(Math.round(fontSize * 0.28), 4, 14) : 0;
    const widthSlackPx = 2;
    const maxTextWidthPx = Math.max(1, maxBoxWidthPx - padding * 2);

    // Measure as single line first (no wrapping)
    measurer.style.fontSize = `${fontSize}px`;
    measurer.style.fontFamily = familyText.fontFamily;
    measurer.style.fontWeight = `${familyText.fontWeight}`;
    measurer.style.lineHeight = `${lineHeight}`;
    measurer.style.padding = `0px`;
    measurer.style.width = "auto";
    measurer.style.maxWidth = "none";
    measurer.style.whiteSpace = "nowrap";
    measurer.style.overflowWrap = "normal";
    measurer.style.wordBreak = "normal";
    measurer.textContent = content;

    const singleLineTextWidth = Math.max(1, Math.ceil(measurer.scrollWidth));
    const singleLineTextHeight = Math.max(1, Math.ceil(measurer.scrollHeight));
    const singleLineBoxWidth = singleLineTextWidth + padding * 2;
    const singleLineBoxWidthWithSlack = singleLineBoxWidth + widthSlackPx;
    const shouldWrap = singleLineBoxWidthWithSlack > maxBoxWidthPx + 0.5;

    let finalTextWidth = singleLineTextWidth;
    let finalTextHeight = singleLineTextHeight;
    let wrappedTextHeight = singleLineTextHeight;

    // Only wrap after reaching the full allowed box width.
    if (shouldWrap) {
      measurer.style.whiteSpace = "normal";
      measurer.style.overflowWrap = "break-word";
      measurer.style.wordBreak = "break-word";
      measurer.style.width = `${maxTextWidthPx}px`;
      measurer.style.maxWidth = `${maxTextWidthPx}px`;

      const measuredWrappedTextHeight = Math.max(1, Math.ceil(measurer.scrollHeight));
      const twoLineTextHeight = Math.ceil(singleLineTextHeight * 2);
      wrappedTextHeight = measuredWrappedTextHeight;
      finalTextWidth = maxTextWidthPx;
      finalTextHeight = Math.min(measuredWrappedTextHeight, twoLineTextHeight);
    }

    // Final box size is tightly coupled to measured text and uniform padding.
    const chosenWidth = Math.ceil(
      shouldWrap ? maxBoxWidthPx : Math.min(singleLineBoxWidthWithSlack, maxBoxWidthPx),
    );
    const measuredBoxHeight = Math.ceil(finalTextHeight + padding * 2);
    const chosenHeight = Math.max(1, Math.min(measuredBoxHeight, maxHeightPx));

    const anchorOffset =
      textAlign === "center"
        ? chosenWidth / 2
        : textAlign === "right"
          ? chosenWidth
          : 0;

    const nextLeft = clamp(
      Math.round(familyText.x * width - anchorOffset),
      0,
      Math.max(0, width - chosenWidth),
    );
    const nextTop = clamp(
      anchoredBottom - chosenHeight,
      0,
      Math.max(0, height - chosenHeight),
    );

    console.log("[FrameCanvas][family-text-layout]", {
      content,
      charCount: content.length,
      maxBoxWidthPx,
      maxTextWidthPx,
      maxHeightPx,
      padding,
      singleLineTextWidth,
      singleLineTextHeight,
      singleLineBoxWidth,
      singleLineBoxWidthWithSlack,
      shouldWrap,
      wrappedTextHeight,
      finalTextWidth,
      finalTextHeight,
      chosenWidth,
      chosenHeight,
      isWrapped: shouldWrap,
      configuredTop,
      anchoredBottom,
      nextLeft,
      nextTop,
    });

    setFamilyRender((prev) => {
      if (
        prev.fontSize === fontSize &&
        prev.width === chosenWidth &&
        prev.height === chosenHeight &&
        prev.left === nextLeft &&
        prev.top === nextTop &&
        prev.isWrapped === shouldWrap
      ) {
        return prev;
      }

      return {
        fontSize,
        width: chosenWidth,
        height: chosenHeight,
        left: nextLeft,
        top: nextTop,
        isWrapped: shouldWrap,
      };
    });
  }, [
    familyName,
    familyText.x,
    familyText.y,
    familyText.fontSize,
    familyText.width,
    familyText.height,
    familyText.fontFamily,
    familyText.fontWeight,
    familyText.showBackground,
    familyText.borderRadius,
    familyText.textAlign,
    width,
    height,
  ]);

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

  const updateLayout = (key: DraggableKey, next: TextLayout) => {
    if (key === "unit") {
      onUnitTextChange?.(next);
    } else {
      onCounterTextChange?.(next);
    }
  };

  const resolvePointers = (key: DraggableKey) => (key === "unit" ? unitPointers.current : counterPointers.current);
  const resolveDragOffset = (key: DraggableKey) => (key === "unit" ? unitDragOffset : counterDragOffset);
  const resolvePinchDistance = (key: DraggableKey) => (key === "unit" ? unitPinchDistance : counterPinchDistance);
  const resolvePinchFont = (key: DraggableKey) => (key === "unit" ? unitPinchFont : counterPinchFont);

  const onTextPointerDown = (
    key: DraggableKey,
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
    key: DraggableKey,
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

  const onTextPointerUp = (key: DraggableKey, event: React.PointerEvent<HTMLDivElement>) => {
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

  const renderText = (key: DraggableKey, label: string, layout: TextLayout) => {
    const isSelected = activeText === key;
    const hasBackground = layout.showBackground ?? true;
    const verticalPad = hasBackground ? clamp(Math.round(layout.fontSize * 0.16), 2, 10) : 0;
    const horizontalPad = hasBackground ? clamp(Math.round(layout.fontSize * 0.26), 4, 20) : 0;
    const borderRadius = clamp(
      Number(layout.borderRadius ?? Math.round(layout.fontSize * 0.32)),
      0,
      48,
    );
    const selectionRing = editableText && isSelected ? "0 0 0 2px rgba(59, 130, 246, 0.55)" : "none";
    const textAlign = layout.textAlign ?? "center";
    const style: CSSProperties = {
      position: "absolute",
      left: `${layout.x * 100}%`,
      top: `${layout.y * 100}%`,
      color: layout.color,
      fontSize: layout.fontSize,
      fontFamily: layout.fontFamily,
      fontWeight: layout.fontWeight,
      letterSpacing: key === "counter" ? "0em" : "0.01em",
      fontVariantNumeric: key === "counter" ? "tabular-nums" : undefined,
      lineHeight: 1.08,
      textAlign,
      cursor: editableText ? "grab" : "default",
      userSelect: "none",
      touchAction: "none",
      borderRadius,
      padding: `${verticalPad}px ${horizontalPad}px`,
      background: hasBackground ? (layout.backgroundColor ?? "rgba(15, 23, 42, 0.72)") : "transparent",
      boxShadow: selectionRing,
      display: "inline-flex",
      alignItems: "center",
      justifyContent: textAlign === "left" ? "flex-start" : textAlign === "right" ? "flex-end" : "center",
      whiteSpace: "nowrap",
      zIndex: 40,
      transition: "box-shadow 120ms ease",
    };

    return (
      <div
        role={editableText ? "button" : undefined}
        tabIndex={editableText ? 0 : undefined}
        onPointerDown={(event) => onTextPointerDown(key, layout, event)}
        onPointerMove={(event) => onTextPointerMove(key, layout, event)}
        onPointerUp={(event) => onTextPointerUp(key, event)}
        onPointerCancel={(event) => onTextPointerUp(key, event)}
        onClick={() => editableText && onActiveTextChange?.(key)}
        style={style}
      >
        {label}
      </div>
    );
  };

  const renderFamilyText = () => {
    const content = familyName?.trim();
    if (!content) {
      return null;
    }

    const boxWidth = Math.max(1, familyRender.width);
    const boxHeight = Math.max(1, familyRender.height);
    const hasBackground = familyText.showBackground ?? true;
    const textAlign = familyText.textAlign ?? "center";
    const isSelected = activeText === "family";
    const padding = hasBackground ? clamp(Math.round(familyRender.fontSize * 0.28), 4, 14) : 0;

    const onFamilyPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
      if (!editableText || !containerRef.current || !onFamilyTextChange) {
        return;
      }

      onActiveTextChange?.("family");
      familyPointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
      event.currentTarget.setPointerCapture(event.pointerId);

      const overlayRect = event.currentTarget.getBoundingClientRect();
      familyDragOffset.current = {
        x: event.clientX - overlayRect.left,
        y: event.clientY - overlayRect.top,
      };
    };

    const onFamilyPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
      if (!editableText || !containerRef.current || !onFamilyTextChange) {
        return;
      }

      if (!familyPointers.current.has(event.pointerId) || !familyDragOffset.current) {
        return;
      }

      familyPointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });

      const rect = containerRef.current.getBoundingClientRect();
      const left = event.clientX - rect.left - familyDragOffset.current.x;
      const anchorOffset =
        textAlign === "center" ? boxWidth / 2 : textAlign === "right" ? boxWidth : 0;
      const anchorX = (left + anchorOffset) / width;
      const minAnchorX = anchorOffset / width;
      const maxAnchorX = (width - boxWidth + anchorOffset) / width;
      const top = event.clientY - rect.top - familyDragOffset.current.y;
      const bottomAnchorY = (top + boxHeight) / height;
      const minBottomAnchorY = boxHeight / height;
      const maxBottomAnchorY = 1;

      onFamilyTextChange({
        ...familyText,
        x: clamp(anchorX, minAnchorX, maxAnchorX),
        y: clamp(bottomAnchorY, minBottomAnchorY, maxBottomAnchorY) - familyText.height,
      });
    };

    const onFamilyPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
      familyPointers.current.delete(event.pointerId);

      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }

      if (familyPointers.current.size === 0) {
        familyDragOffset.current = null;
      }
    };

    return (
      <div
        role={editableText ? "button" : undefined}
        tabIndex={editableText ? 0 : undefined}
        onClick={() => editableText && onActiveTextChange?.("family")}
        onPointerDown={onFamilyPointerDown}
        onPointerMove={onFamilyPointerMove}
        onPointerUp={onFamilyPointerUp}
        onPointerCancel={onFamilyPointerUp}
        style={{
          position: "absolute",
          left: familyRender.left,
          top: familyRender.top,
          width: boxWidth,
          height: boxHeight,
          color: familyText.color,
          fontSize: familyRender.fontSize,
          fontFamily: familyText.fontFamily,
          fontWeight: familyText.fontWeight,
          lineHeight: 1.2,
          textAlign,
          overflow: "hidden",
          padding: "0px",
          borderRadius: clamp(
            Number(familyText.borderRadius ?? Math.round(familyText.fontSize * 0.26)),
            0,
            48,
          ),
          background: hasBackground ? (familyText.backgroundColor ?? "rgba(15, 23, 42, 0.48)") : "transparent",
          boxShadow: editableText && isSelected ? "0 0 0 2px rgba(59, 130, 246, 0.55)" : "none",
          zIndex: 40,
          display: "flex",
          alignItems: "flex-end",
          justifyContent:
            textAlign === "left"
              ? "flex-start"
              : textAlign === "right"
                ? "flex-end"
                : "center",
          cursor: editableText ? "grab" : "default",
          userSelect: "none",
          touchAction: "none",
          transition: "box-shadow 120ms ease",
        }}
      >
        <span
          style={{
            width: "100%",
            boxSizing: "border-box",
            textAlign,
            lineHeight: 1.2,
            whiteSpace: familyRender.isWrapped ? "normal" : "nowrap",
            overflowWrap: familyRender.isWrapped ? "break-word" : "normal",
            wordBreak: familyRender.isWrapped ? "break-word" : "normal",
            overflow: "hidden",
            padding: `${padding}px`,
            textOverflow: familyRender.isWrapped ? "ellipsis" : "clip",
            display: familyRender.isWrapped ? "-webkit-box" : "block",
            WebkitLineClamp: familyRender.isWrapped ? 2 : undefined,
            WebkitBoxOrient: familyRender.isWrapped ? "vertical" : undefined,
          }}
        >
          {content}
        </span>
      </div>
    );
  };

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden select-none touch-none touch-action-none"
      style={{
        width,
        height,
        backgroundColor: "transparent",
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
        {renderFamilyText()}

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
            objectFit: "fill",
            pointerEvents: "none",
            zIndex: 30,
          }}
        />
      ) : null}

      <div
        ref={familyMeasureRef}
        aria-hidden="true"
        style={{
          position: "absolute",
          left: -10000,
          top: -10000,
          visibility: "hidden",
          pointerEvents: "none",
          whiteSpace: "pre-wrap",
          overflowWrap: "anywhere",
          wordBreak: "break-word",
          width: "fit-content",
          zIndex: -1,
        }}
      />
    </div>
  );
}
