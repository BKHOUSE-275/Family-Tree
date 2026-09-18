import { put } from "@vercel/blob";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

const HEIC_BRANDS = new Set(["heic", "heif", "heix", "hevc", "hevx"]);

function ftypBrands(bytes: Buffer) {
  if (bytes.length < 12 || bytes.toString("ascii", 4, 8) !== "ftyp") return [];
  const end = Math.min(bytes.length, bytes.readUInt32BE(0));
  const brands = [bytes.toString("ascii", 8, 12)];
  for (let offset = 16; offset + 4 <= end; offset += 4) {
    brands.push(bytes.toString("ascii", offset, offset + 4));
  }
  return brands.map((brand) => brand.toLowerCase());
}

export function isHeicPhoto(file: Pick<File, "name" | "type">, bytes: Buffer) {
  if (bytes.length > 2 && bytes[0] === 0xff && bytes[1] === 0xd8) return false;
  const name = file.name.toLowerCase();
  const type = (file.type || "").toLowerCase();
  if (type === "image/avif" || name.endsWith(".avif")) return false;
  if (
    type === "image/heic" ||
    type === "image/heif" ||
    type === "image/heic-sequence" ||
    type === "image/heif-sequence" ||
    name.endsWith(".heic") ||
    name.endsWith(".heif")
  ) {
    return true;
  }
  const brands = ftypBrands(bytes);
  if (brands.includes("avif") || brands.includes("avis")) return false;
  return brands.some((brand) => HEIC_BRANDS.has(brand));
}

function safeBaseName(name: string) {
  const base = name.replace(/\.[^.]+$/, "") || "photo";
  return base.replace(/[^a-zA-Z0-9._-]/g, "") || "photo";
}

export async function preparePhotoUpload(file: File) {
  const bytes = Buffer.from(await file.arrayBuffer());
  const stamp = Date.now();

  if (isHeicPhoto(file, bytes)) {
    throw new Error(
      "This iPhone photo needs to be converted before upload. Export it as JPEG or PNG and try again.",
    );
  }

  const ext =
    (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") ||
    "jpg";
  if (!["jpg", "jpeg", "png", "webp", "gif"].includes(ext) && !file.type.startsWith("image/")) {
    throw new Error("Please choose a JPEG, PNG, or iPhone HEIC photo.");
  }
  return {
    body: bytes,
    pathname: `family/${stamp}-${safeBaseName(file.name)}.${ext === "jpeg" ? "jpg" : ext}`,
    contentType: file.type || (ext === "jpg" || ext === "jpeg" ? "image/jpeg" : `image/${ext}`),
  };
}

export async function storePreparedPhoto(photo: {
  body: Buffer;
  pathname: string;
  contentType: string;
}) {
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(photo.pathname, photo.body, {
      access: "public",
      addRandomSuffix: true,
      token: process.env.BLOB_READ_WRITE_TOKEN,
      contentType: photo.contentType,
    });
    return { url: blob.url };
  }

  if (process.env.VERCEL) {
    throw new Error("Set BLOB_READ_WRITE_TOKEN to upload photos on Vercel.");
  }

  const safeName = path.basename(photo.pathname);
  const dir = path.join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, safeName), photo.body);
  return { url: `/uploads/${safeName}` };
}
