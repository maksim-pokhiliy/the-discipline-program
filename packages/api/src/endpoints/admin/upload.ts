import { put, del } from "@vercel/blob";
import { UPLOAD_CONFIG } from "../../constants";

type UploadConfigKey = keyof typeof UPLOAD_CONFIG;

const formatAcceptedTypes = (acceptedTypes: string[]) =>
  acceptedTypes.map((type) => type.split("/")[1]?.toUpperCase() ?? type).join(", ");

const ensureValidFile = (file: File, configKey: UploadConfigKey) => {
  const { maxSize, acceptedTypes } = UPLOAD_CONFIG[configKey];

  if (!acceptedTypes.includes(file.type)) {
    throw new Error(`Invalid file type. Allowed: ${formatAcceptedTypes(acceptedTypes)}`);
  }

  if (file.size > maxSize) {
    const maxSizeInMb = Math.round(maxSize / (1024 * 1024));
    throw new Error(`File too large (max ${maxSizeInMb}MB)`);
  }
};

const uploadFile = async (file: File, configKey: UploadConfigKey) => {
  ensureValidFile(file, configKey);

  const { storagePrefix } = UPLOAD_CONFIG[configKey];
  const timestamp = Date.now();
  const filename = `${storagePrefix}/${timestamp}-${file.name}`;

  const blob = await put(filename, file, {
    access: "public",
  });

  return { url: blob.url };
};

const deleteFile = async (url: string) => {
  if (!url) {
    throw new Error("No URL provided");
  }

  await del(url);
};

export const adminUploadApi = {
  uploadAvatar: (file: File) => uploadFile(file, "avatar"),

  deleteAvatar: deleteFile,

  uploadBlogCover: (file: File) => uploadFile(file, "blogCover"),

  deleteBlogCover: deleteFile,
};
