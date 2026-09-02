"use client";

import { useId, useState } from "react";
import { uploadPhotoAction } from "@/app/actions/family";

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
  const [url, setUrl] = useState(defaultUrl ?? "");
  const [fileName, setFileName] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onFile(fileList: FileList | null) {
    const file = fileList?.[0];
    if (!file) return;
    setBusy(true);
    setError(null);
    setFileName(file.name);
    try {
      const data = new FormData();
      data.set("file", file);
      const result = await uploadPhotoAction(data);
      setUrl(result.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <input type="hidden" name={name} value={url} />
      <p className="text-sm font-semibold text-script">{label}</p>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <input
          id={inputId}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(event) => onFile(event.target.files)}
        />
        <label htmlFor={inputId} className="ui-file-button">
          {busy ? "Uploading…" : url ? "Replace photo" : "Choose photo"}
        </label>
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
    </div>
  );
}
