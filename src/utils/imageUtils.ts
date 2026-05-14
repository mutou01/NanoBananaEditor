export function base64ToBlob(base64: string, mimeType: string = 'image/png'): Blob {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
}

export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1]; // Remove data:image/png;base64, prefix
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export function createImageFromBase64(base64: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = `data:image/png;base64,${base64}`;
  });
}

export function resizeImageToFit(
  image: HTMLImageElement, 
  maxWidth: number, 
  maxHeight: number
): { width: number; height: number } {
  const ratio = Math.min(maxWidth / image.width, maxHeight / image.height);
  return {
    width: image.width * ratio,
    height: image.height * ratio
  };
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function downloadImage(base64: string, filename: string): void {
  const blob = base64ToBlob(base64);
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  URL.revokeObjectURL(url);
}

/**
 * Check if image data contains C2PA metadata by looking for C2PA signatures
 * C2PA metadata can be in XMP, PNG chunks, or other container formats
 */
export function containsC2PAMetadata(base64OrUrl: string): boolean {
  // C2PA signatures to look for in image data
  const c2paSignatures = [
    'c2pa',           // Standard lowercase
    'C2PA',           // Standard uppercase
    'c2pa.rs',        // Rust SDK signature
    'contentauth',    // Content Authenticity Initiative
    'adobe:ns:meta',  // Adobe XMP namespace (often contains C2PA)
  ];

  // For data URLs, extract the base64 part
  let dataToCheck = base64OrUrl;
  if (base64OrUrl.startsWith('data:')) {
    const commaIndex = base64OrUrl.indexOf(',');
    if (commaIndex !== -1) {
      dataToCheck = base64OrUrl.substring(commaIndex + 1);
    }
  }

  // Decode base64 and check for signatures
  try {
    const decoded = atob(dataToCheck.substring(0, 2000)); // Check first 2000 chars
    return c2paSignatures.some(sig => decoded.includes(sig));
  } catch {
    // If decoding fails, check raw base64 string for any encoded signatures
    return c2paSignatures.some(sig =>
      dataToCheck.toLowerCase().includes(btoa(sig).toLowerCase())
    );
  }
}

/**
 * Strip all metadata (including C2PA) from an image by redrawing it on a canvas
 * Returns a clean base64 PNG without any metadata
 */
export async function stripImageMetadata(
  base64OrUrl: string,
  mimeType: string = 'image/png'
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        // Draw image to canvas (this strips all metadata)
        ctx.drawImage(img, 0, 0);

        // Export as clean PNG
        const cleanDataUrl = canvas.toDataURL(mimeType, 1.0);

        // Clean up
        canvas.remove();

        resolve(cleanDataUrl);
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    // Set source
    if (base64OrUrl.startsWith('data:')) {
      img.src = base64OrUrl;
    } else {
      img.src = `data:image/png;base64,${base64OrUrl}`;
    }
  });
}

/**
 * Compress image to ensure it's under a specific size limit
 * Uses canvas to re-encode with lower quality and/or scale down if needed
 * @param base64OrUrl - Input image data URL or base64 string
 * @param maxSizeMB - Maximum size in MB (default 2)
 * @param mimeType - Output mime type (default image/png)
 * @param maxDimension - Maximum width/height in pixels (default 800)
 * @returns Compressed data URL
 */
export async function compressImageToSize(
  base64OrUrl: string,
  maxSizeMB: number = 2,
  mimeType: string = 'image/png',
  maxDimension: number = 800
): Promise<string> {
  // Check current size
  const base64Data = base64OrUrl.includes('base64,')
    ? base64OrUrl.split('base64,')[1]
    : base64OrUrl;
  const currentSizeMB = (base64Data.length * 0.75) / (1024 * 1024);

  // If already under limit, return as-is
  if (currentSizeMB <= maxSizeMB) {
    return base64OrUrl.startsWith('data:') ? base64OrUrl : `data:${mimeType};base64,${base64Data}`;
  }

  console.log(`[Image Compression] Current size: ${currentSizeMB.toFixed(2)}MB, target: ${maxSizeMB}MB`);

  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      try {
        let quality = 0.9;
        let scale = 1.0;
        let result = '';

        // Calculate initial scale based on max dimension
        const maxImgDimension = Math.max(img.width, img.height);
        if (maxImgDimension > maxDimension) {
          scale = maxDimension / maxImgDimension;
          console.log(`[Image Compression] Image too large (${img.width}x${img.height}), scaling to max ${maxDimension}px`);
        }

        const compress = () => {
          const canvas = document.createElement('canvas');
          // Apply scale to dimensions
          canvas.width = Math.round(img.width * scale);
          canvas.height = Math.round(img.height * scale);

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
          }

          // Use better quality scaling
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          // For PNG, we use toDataURL without quality parameter
          // For JPEG, we can adjust quality
          if (mimeType === 'image/jpeg') {
            result = canvas.toDataURL(mimeType, quality);
          } else {
            result = canvas.toDataURL(mimeType);
          }

          // Check size
          const resultBase64 = result.split('base64,')[1];
          const resultSizeMB = (resultBase64.length * 0.75) / (1024 * 1024);

          if (resultSizeMB <= maxSizeMB) {
            console.log(`[Image Compression] Final size: ${resultSizeMB.toFixed(2)}MB, dimensions: ${canvas.width}x${canvas.height}, scale: ${scale.toFixed(2)}`);
            canvas.remove();
            resolve(result);
          } else if (scale > 0.5) {
            // Try reducing scale further
            scale -= 0.1;
            canvas.remove();
            console.log(`[Image Compression] Still too large, reducing scale to ${scale.toFixed(2)}`);
            compress();
          } else if (mimeType === 'image/jpeg' && quality > 0.5) {
            // For JPEG, also try reducing quality
            quality -= 0.1;
            canvas.remove();
            console.log(`[Image Compression] Reducing JPEG quality to ${quality.toFixed(2)}`);
            compress();
          } else {
            // Accept the result even if slightly over limit
            console.log(`[Image Compression] Final size: ${resultSizeMB.toFixed(2)}MB (could not compress further)`);
            canvas.remove();
            resolve(result);
          }
        };

        compress();
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => reject(new Error('Failed to load image'));

    if (base64OrUrl.startsWith('data:')) {
      img.src = base64OrUrl;
    } else {
      img.src = `data:image/png;base64,${base64OrUrl}`;
    }
  });
}

/**
 * Download image with automatic C2PA metadata removal
 * Loads image into canvas to strip all metadata, then downloads
 */
export async function downloadImageWithoutC2PA(
  base64OrUrl: string,
  filename: string
): Promise<void> {
  // Check if C2PA metadata exists
  const hasC2PA = containsC2PAMetadata(base64OrUrl);

  if (hasC2PA) {
    console.log('[C2PA] Metadata detected, stripping...');
  }

  // Always strip metadata to ensure clean download
  const cleanDataUrl = await stripImageMetadata(base64OrUrl);

  // Extract base64 from data URL
  const base64 = cleanDataUrl.split(',')[1];

  // Download the clean image
  downloadImage(base64, filename);

  if (hasC2PA) {
    console.log('[C2PA] Metadata removed successfully');
  }
}