import { supabase } from "./supabase";

const bucket = "travel-social";
const maxImageSize = 5 * 1024 * 1024;
const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export async function uploadImage(file: File, folder: string): Promise<string> {
  if (!allowedTypes.has(file.type)) {
    throw new Error("Choose a JPEG, PNG, WebP, or GIF image.");
  }
  if (file.size > maxImageSize) {
    throw new Error("Images must be 5 MB or smaller.");
  }

  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) {
    throw new Error(`Could not read the authentication session: ${sessionError.message}`);
  }
  const userId = sessionData.session?.user.id;
  if (!userId) {
    throw new Error("Please sign in again before uploading an image.");
  }

  const extension = file.type.split("/")[1].replace("jpeg", "jpg");
  const path = `${userId}/${folder}/${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    contentType: file.type,
    upsert: false,
  });
  if (error) {
    throw new Error(`Image upload failed: ${error.message}`);
  }
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}
