import { createHash, randomUUID } from "node:crypto";

const cloudName = process.env.CLOUDINARY_CLOUD_NAME!;
const apiKey = process.env.CLOUDINARY_API_KEY!;
const apiSecret = process.env.CLOUDINARY_API_SECRET!;

export function getCloudinaryConfig() {
  if (!cloudName || !apiKey || !apiSecret) {
    return null;
  }
  return { cloudName, apiKey, apiSecret };
}

export function hasCloudinaryEnv() {
  return getCloudinaryConfig() !== null;
}

export async function uploadToCloudinary(
  buffer: Buffer,
  originalFileName: string,
): Promise<{ url: string; publicId: string; bytes: number; format: string }> {
  const config = getCloudinaryConfig();
  if (!config) throw new Error("Cloudinary is not configured");

  const timestamp = Math.floor(Date.now() / 1000);
  const ext = originalFileName.split(".").pop() ?? "mp3";
  const publicId = `church-audio/${randomUUID()}`;

  const params: Record<string, string | number> = {
    timestamp,
    public_id: publicId,
    resource_type: "video",
    type: "upload",
  };

  const sortedKeys = Object.keys(params).sort();
  const signatureStr =
    sortedKeys.map((k) => `${k}=${params[k]}`).join("&") + config.apiSecret;
  const signature = createHash("sha1").update(signatureStr).digest("hex");

  const uploadUrl = `https://api.cloudinary.com/v1_1/${config.cloudName}/video/upload`;

  const body = new FormData();
  body.append("file", new Blob([buffer], { type: "audio/mpeg" }), originalFileName);
  body.append("public_id", publicId);
  body.append("resource_type", "video");
  body.append("type", "upload");
  body.append("timestamp", String(timestamp));
  body.append("api_key", config.apiKey);
  body.append("signature", signature);

  const response = await fetch(uploadUrl, { method: "POST", body });
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error?.message ?? "Cloudinary upload failed");
  }

  return {
    url: result.secure_url,
    publicId: result.public_id,
    bytes: result.bytes,
    format: result.format,
  };
}
