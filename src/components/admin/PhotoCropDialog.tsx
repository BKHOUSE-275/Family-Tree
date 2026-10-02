"use client";

import {
  useEffect,
  useEffectEvent,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { createPortal } from "react-dom";
import Cropper, { type Area } from "react-easy-crop";
import "react-easy-crop/react-easy-crop.css";
import { cropImageToJpeg } from "@/lib/crop-image";

/** Focused controls that handle Enter themselves; the slider is left to confirm. */
const ENTER_OWNERS =
  'button, a[href], select, textarea, [contenteditable]:not([contenteditable="false"]), input:not([type="range"])';

// Portals need `document`: false on the server and during hydration, true after.
const noopSubscribe = () => () => {};
const isClient = () => true;
const isServer = () => false;

export function PhotoCropDialog({
  imageSrc,
  title,
  preview,
  busy,
  onCancel,
  onCropped,
}: {
  imageSrc: string;
  title: string;
  preview: "portrait" | "rect";
  busy: boolean;
  onCancel: () => void;
  onCropped: (blob: Blob) => Promise<void> | void;
}) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState<Area | null>(null);
  const [cropError, setCropError] = useState<string | null>(null);
  const [cropFor, setCropFor] = useState(imageSrc);
  const mounted = useSyncExternalStore(noopSubscribe, isClient, isServer);
  const round = preview === "portrait";
  const ready = area !== null;

  // New image → start the crop over (state reset during render, not in an effect).
  if (cropFor !== imageSrc) {
    setCropFor(imageSrc);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setArea(null);
    setCropError(null);
  }

  const cancelFromDialog = useEffectEvent(() => {
    if (!busy) onCancel();
  });

  useEffect(() => {
    const node = dialogRef.current;
    if (!node || !mounted) return;
    if (!node.open) node.showModal();
    function onDialogCancel(event: Event) {
      event.preventDefault();
      cancelFromDialog();
    }
    node.addEventListener("cancel", onDialogCancel);
    return () => {
      node.removeEventListener("cancel", onDialogCancel);
      if (node.open) node.close();
    };
  }, [mounted]);

  async function confirmCrop() {
    if (!area) return;
    setCropError(null);
    try {
      const blob = await cropImageToJpeg(imageSrc, area);
      await onCropped(blob);
    } catch (error) {
      setCropError(error instanceof Error ? error.message : "Could not crop this photo.");
    }
  }

  if (!mounted) return null;

  return createPortal(
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      className="photo-crop-dialog w-[min(32rem,calc(100vw-1.5rem))] rounded-3xl border-0 bg-white p-0 text-ink shadow-[0_24px_80px_-20px_rgba(42,24,16,0.5)]"
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => {
        event.stopPropagation();
        if (event.key !== "Enter") return;
        // Let Enter activate a focused control (e.g. Cancel) natively.
        if (event.target instanceof Element && event.target.closest(ENTER_OWNERS)) {
          return;
        }
        event.preventDefault();
        if (!busy && ready) void confirmCrop();
      }}
    >
      <div className="p-5 sm:p-6">
        <h2 id={titleId} className="font-[family-name:var(--font-display)] text-2xl text-script">
          Crop photo
        </h2>
        <p className="mt-1 text-sm text-bark/70">{title}</p>
        <div className="relative mt-4 h-56 overflow-hidden rounded-2xl bg-bark sm:h-80">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={round ? 1 : 3 / 2}
            cropShape={round ? "round" : "rect"}
            showGrid={!round}
            objectFit="contain"
            maxZoom={4}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={(_, pixels) => setArea(pixels)}
            classes={{
              containerClassName: "h-full",
              cropAreaClassName: "border-2 border-gold",
            }}
          />
        </div>
        <label className="mt-4 block text-sm font-semibold text-script">
          Zoom
          <input
            type="range"
            min={1}
            max={4}
            step={0.05}
            value={zoom}
            disabled={busy}
            onChange={(event) => setZoom(Number(event.target.value))}
            className="mt-2 h-11 w-full accent-[var(--ember)]"
          />
        </label>
        <p className="mt-1 text-sm text-bark/60">
          Drag the photo to frame it. Pinch or use the slider to zoom.
        </p>
        {cropError ? <p className="mt-2 text-sm text-ember">{cropError}</p> : null}
        <div className="mt-5 flex flex-wrap justify-end gap-3 pb-[env(safe-area-inset-bottom)]">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="min-h-11 rounded-full border border-bark/20 px-5 py-2 text-sm font-semibold text-bark hover:bg-leaf-soft disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void confirmCrop()}
            disabled={busy || !ready}
            className="min-h-11 rounded-full bg-ember px-5 py-2 text-sm font-semibold text-white hover:bg-gold hover:text-bark disabled:opacity-60"
          >
            {busy ? "Uploading…" : "Use photo"}
          </button>
        </div>
      </div>
    </dialog>,
    document.body,
  );
}
