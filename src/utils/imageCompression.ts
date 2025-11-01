const DEFAULT_MAX_WIDTH = 1920;
const DEFAULT_MAX_HEIGHT = 1920;
const DEFAULT_QUALITY = 0.85;

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  mimeType?: string;
}

const createImage = (file: File): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (error) => {
      URL.revokeObjectURL(url);
      reject(error);
    };
    img.src = url;
  });
};

const drawImageToCanvas = (
  image: CanvasImageSource,
  width: number,
  height: number,
): HTMLCanvasElement => {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Impossible de compresser l'image (contexte 2D introuvable)");
  }
  ctx.drawImage(image, 0, 0, width, height);
  return canvas;
};

export async function compressImage(
  file: File,
  options: CompressionOptions = {},
): Promise<File> {
  const { maxWidth = DEFAULT_MAX_WIDTH, maxHeight = DEFAULT_MAX_HEIGHT, quality = DEFAULT_QUALITY, mimeType } = options;

  if (!file.type.startsWith("image/")) {
    return file;
  }

  const targetMime = mimeType ?? file.type;

  const bitmap =
    typeof createImageBitmap === "function"
      ? await createImageBitmap(file)
      : await createImage(file);

  const { width: originalWidth, height: originalHeight } = bitmap as { width: number; height: number };

  let targetWidth = originalWidth;
  let targetHeight = originalHeight;

  const widthRatio = maxWidth / originalWidth;
  const heightRatio = maxHeight / originalHeight;
  const ratio = Math.min(widthRatio, heightRatio, 1);

  targetWidth = Math.round(originalWidth * ratio);
  targetHeight = Math.round(originalHeight * ratio);

  const canvas = drawImageToCanvas(bitmap, targetWidth, targetHeight);

  const blob: Blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (result) => {
        if (!result) {
          reject(new Error("La compression de l'image a échoué."));
          return;
        }
        resolve(result);
      },
      targetMime,
      quality,
    );
  });

  return new File([blob], file.name, { type: blob.type, lastModified: Date.now() });
}

export async function compressImages(
  files: File[],
  options: CompressionOptions = {},
): Promise<File[]> {
  if (!files.length) return [];
  return Promise.all(files.map((file) => compressImage(file, options)));
}
