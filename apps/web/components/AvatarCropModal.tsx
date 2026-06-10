"use client";

import { AnimatedModalRoot } from "@/components/motion/MotionModal";
import {
  clampPan,
  computeBaseCoverScale,
  cropAvatarToFile,
  getDisplaySize,
  type AvatarCropState,
} from "@/lib/crop-avatar-image";
import { useCallback, useEffect, useRef, useState } from "react";

const VIEWPORT_SIZE = 280;
const MIN_ZOOM = 1;
const MAX_ZOOM = 3;

interface AvatarCropModalProps {
  file: File;
  onClose: () => void;
  onConfirm: (file: File) => void;
}

export function AvatarCropModal({ file, onClose, onConfirm }: AvatarCropModalProps) {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [saving, setSaving] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; panX: number; panY: number } | null>(
    null
  );

  useEffect(() => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      setImage(img);
      setLoadError(null);
    };
    img.onerror = () => setLoadError("Could not load image");
    img.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const baseScale = image
    ? computeBaseCoverScale(image.naturalWidth, image.naturalHeight, VIEWPORT_SIZE)
    : 1;

  const applyPan = useCallback(
    (nextPanX: number, nextPanY: number, nextZoom = zoom) => {
      if (!image) return;
      const display = getDisplaySize(
        image.naturalWidth,
        image.naturalHeight,
        baseScale,
        nextZoom
      );
      const clamped = clampPan(
        nextPanX,
        nextPanY,
        display.width,
        display.height,
        VIEWPORT_SIZE
      );
      setPan({ x: clamped.panX, y: clamped.panY });
    },
    [image, baseScale, zoom]
  );

  function handleZoomChange(nextZoom: number) {
    setZoom(nextZoom);
    applyPan(pan.x, pan.y, nextZoom);
  }

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (!image) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      panX: pan.x,
      panY: pan.y,
    };
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    applyPan(dragRef.current.panX + dx, dragRef.current.panY + dy);
  }

  function onPointerUp(e: React.PointerEvent<HTMLDivElement>) {
    dragRef.current = null;
    e.currentTarget.releasePointerCapture(e.pointerId);
  }

  async function handleSave() {
    if (!image) return;
    setSaving(true);
    try {
      const cropped = await cropAvatarToFile(
        image,
        { zoom, panX: pan.x, panY: pan.y },
        { viewportSize: VIEWPORT_SIZE, fileName: "avatar.jpg" }
      );
      onConfirm(cropped);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Could not crop image");
      setSaving(false);
    }
  }

  const display = image
    ? getDisplaySize(image.naturalWidth, image.naturalHeight, baseScale, zoom)
    : null;

  return (
    <AnimatedModalRoot
      onClose={onClose}
      align="bottom"
      ariaLabelledBy="avatar-crop-title"
      panelClassName="w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl bg-[var(--background)] border border-[var(--gp-border)] shadow-xl"
    >
        <div className="flex items-center justify-between p-4 border-b border-[var(--gp-border)]">
          <h2 id="avatar-crop-title" className="text-lg font-semibold">
            Adjust profile photo
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-sm gp-text-muted hover:bg-[var(--gp-surface)]"
          >
            Cancel
          </button>
        </div>

        <div className="p-4 space-y-4">
          <p className="text-sm gp-text-muted text-center">
            Drag to reposition and use the slider to zoom. Preview matches your
            circular profile photo.
          </p>

          <div className="flex justify-center">
            <div
              className="relative rounded-full overflow-hidden border-2 border-[var(--gp-border)] bg-[var(--gp-surface)] touch-none cursor-grab active:cursor-grabbing"
              style={{ width: VIEWPORT_SIZE, height: VIEWPORT_SIZE }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
            >
              {loadError ? (
                <div className="absolute inset-0 flex items-center justify-center px-4 text-sm text-red-400 text-center">
                  {loadError}
                </div>
              ) : !image || !display ? (
                <div className="absolute inset-0 animate-pulse bg-[var(--gp-surface)]" />
              ) : (
                <img
                  src={image.src}
                  alt=""
                  draggable={false}
                  className="absolute left-1/2 top-1/2 max-w-none select-none"
                  style={{
                    width: display.width,
                    height: display.height,
                    transform: `translate(calc(-50% + ${pan.x}px), calc(-50% + ${pan.y}px))`,
                  }}
                />
              )}
            </div>
          </div>

          <label className="block space-y-2">
            <span className="text-sm gp-text-muted">Zoom</span>
            <input
              type="range"
              min={MIN_ZOOM}
              max={MAX_ZOOM}
              step={0.01}
              value={zoom}
              disabled={!image || saving}
              onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
              className="w-full accent-[var(--gp-accent)]"
            />
          </label>

          {loadError && (
            <p className="text-sm text-red-400 text-center">{loadError}</p>
          )}

          <button
            type="button"
            disabled={!image || saving || Boolean(loadError)}
            onClick={() => void handleSave()}
            className="w-full rounded-lg bg-accent text-accent-foreground font-semibold py-3 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Use photo"}
          </button>
        </div>
    </AnimatedModalRoot>
  );
}
