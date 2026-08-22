"use client";

import { useState } from "react";
import { uploadPhotoAction } from "@/app/actions/family";

export function PhotoField({ defaultUrl }: { defaultUrl?: string | null }) {
  const [url, setUrl] = useState(defaultUrl ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onFile(fileList: FileList | null) {
    const file = fileList?.[0];
    if (!file) return;
    setBusy(true);
    setError(null);
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
      <input type="hidden" name="photoUrl" value={url} />
      <label className="block text-sm font-semibold text-script">
        Photo
        <input
          type="file"
          accept="image/*"
          className="mt-1 block w-full text-sm"
          onChange={(event) => onFile(event.target.files)}
        />
      </label>
      {busy ? <p className="text-sm text-black/55">Uploading…</p> : null}
      {error ? <p className="text-sm text-leaf-deep">{error}</p> : null}
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" className="mt-2 h-24 w-24 rounded-full object-cover" />
      ) : null}
    </div>
  );
}
