const MAX_SIZE = 1000;

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

export function resizeImage(dataUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const { width, height } = img;
      if (width <= MAX_SIZE && height <= MAX_SIZE) {
        resolve(dataUrl);
        return;
      }
      let newW: number, newH: number;
      if (width > height) {
        newW = MAX_SIZE;
        newH = Math.round((height / width) * MAX_SIZE);
      } else {
        newH = MAX_SIZE;
        newW = Math.round((width / height) * MAX_SIZE);
      }
      const canvas = document.createElement('canvas');
      canvas.width = newW;
      canvas.height = newH;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas not supported'));
        return;
      }
      ctx.drawImage(img, 0, 0, newW, newH);
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = dataUrl;
  });
}

export function getBase64Data(dataUrl: string): string {
  return dataUrl.split(',')[1] || '';
}

export function getMimeType(dataUrl: string): string {
  const m = dataUrl.match(/data:([^;]+);/);
  return m ? m[1] : 'image/jpeg';
}
