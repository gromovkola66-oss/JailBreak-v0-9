export class HeightmapImporter {
  async importHeightmap(file: File, terrainSystem: unknown, scale: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Cannot get 2D context'));
            return;
          }
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, img.width, img.height);
          const pixels = imageData.data;

          const heights = new Float32Array(img.width * img.height);
          for (let i = 0; i < img.width * img.height; i++) {
            // Use R channel, map 0-255 to 0-scale
            const r = pixels[i * 4];
            heights[i] = (r / 255) * scale;
          }

          const ts = terrainSystem as { applyHeightmap?: (heights: Float32Array, width: number, depth: number) => void };
          if (ts.applyHeightmap) {
            ts.applyHeightmap(heights, img.width, img.height);
          }

          resolve();
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = reader.result as string;
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }
}
