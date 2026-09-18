"use client";

import { useEffect, useId, useRef, useState } from "react";
import { uploadPhotoAction } from "@/app/actions/family";
import { PhotoCropDialog } from "@/components/admin/PhotoCropDialog";
import {
  croppedPhotoName,
  fileToCropSrc,
  heicFileToCropSrc,
  looksLikeHeic,
  looksLikeJpegOrPng,
} from "@/lib/crop-image";

function photoErrorMessage(err: unknown) {
  const message = err instanceof Error ? err.message : "Upload failed";
  if (/Minified React error #441|Server Components render/i.test(message)) {
    return "The photo could not be uploaded. Try a JPEG or PNG under 8 MB.";
  }
  return message;
}

export function PhotoField({
  defaultUrl,
  name = "photoUrl",
  label = "Photo",
  preview = "portrait",
}: {
  defaultUrl?: string | null;
  name?: string;
  label?: string;
  preview?: "portrait" | "rect";
}) {
  const inputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cropSrcRef = useRef<string | null>(null);
  const [url, setUrl] = useState(defaultUrl ?? "");
  const [fileName, setFileName] = useState<string | null>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (cropSrcRef.current?.startsWith("blob:")) {
        URL.revokeObjectURL(cropSrcRef.current);
      }
    };
  }, []);

  function revokeCropSrc() {
    if (cropSrcRef.current?.startsWith("blob:")) {
      URL.revokeObjectURL(cropSrcRef.current);
    }
    cropSrcRef.current = null;
  }

  function closeCrop() {
    revokeCropSrc();
    setCropSrc(null);
    setBusy(false);
  }

  async function onFile(fileList: FileList | null) {
    const file = fileList?.[0];
    if (!file) return;
    setError(null);
    setFileName(file.name);
    setPreparing(true);
    try {
      let src: string;
      if (looksLikeHeic(file)) {
        try {
          src = await fileToCropSrc(file);
        } catch {
          src = await heicFileToCropSrc(file);
        }
      } else {
        if (!looksLikeJpegOrPng(file) && !file.type.startsWith("image/")) {
          throw new Error("Please choose a JPEG, PNG, or iPhone HEIC photo.");
        }
        src = await fileToCropSrc(file);
      }
      revokeCropSrc();
      cropSrcRef.current = src;
      setCropSrc(src);
    } catch (err) {
      setError(photoErrorMessage(err));
      setFileName(null);
    } finally {
      setPreparing(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function onCropped(blob: Blob) {
    setBusy(true);
    setError(null);
    try {
      const cropped = new File([blob], croppedPhotoName(fileName ?? "photo.jpg"), {
        type: "image/jpeg",
      });
      const data = new FormData();
      data.set("file", cropped);
      const result = await uploadPhotoAction(data);
      if ("error" in result && result.error) {
        throw new Error(result.error);
      }
      if (!("url" in result) || !result.url) {
        throw new Error("Upload failed");
      }
      setUrl(result.url);
      closeCrop();
    } catch (err) {
      setBusy(false);
      throw new Error(photoErrorMessage(err));
    }
  }

  function clearPhoto() {
    setUrl("");
    setFileName(null);
    setError(null);
    closeCrop();
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <div>
      <input type="hidden" name={name} value={url} />
      <p className="text-sm font-semibold text-script">{label}</p>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <input
          ref={fileInputRef}
          id={inputId}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.jpg,.jpeg,.png,.webp,.heic,.heif"
          className="sr-only"
          onChange={(event) => void onFile(event.target.files)}
        />
        <label htmlFor={inputId} className="ui-file-button">
          {preparing ? "Preparing…" : url ? "Replace photo" : "Choose photo"}
        </label>
        {url ? (
          <button
            type="button"
            onClick={clearPhoto}
            disabled={busy || preparing}
            className="min-h-11 rounded-full border border-ember/40 px-4 py-2 text-sm font-semibold text-ember hover:bg-ember/10 disabled:opacity-60"
          >
            Remove photo
          </button>
        ) : null}
        {fileName ? (
          <span className="max-w-[14rem] truncate text-sm text-bark/70">{fileName}</span>
        ) : null}
      </div>
      {error ? <p className="mt-1 text-sm text-ember">{error}</p> : null}
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt=""
          className={
            preview === "rect"
              ? "mt-2 h-24 w-36 rounded-xl object-cover"
              : "mt-2 h-24 w-24 rounded-full object-cover"
          }
        />
      ) : null}
      {cropSrc ? (
        <PhotoCropDialog
          imageSrc={cropSrc}
          title={label}
          preview={preview}
          busy={busy}
          onCancel={closeCrop}
          onCropped={onCropped}
        />
      ) : null}
    </div>
  );
}
