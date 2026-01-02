export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
}

type SupportedImageType = 'image/jpeg' | 'image/png' | 'image/webp';

function getOutputMimeType(file: File): SupportedImageType | null {
  const type = file.type.toLowerCase();
  
  if (type.match(/image\/(jpeg|jpg)/i)) return 'image/jpeg';
  if (type === 'image/png') return 'image/png';
  if (type === 'image/webp') return 'image/webp';
  
  return null;
}

function getDefaultQuality(type: SupportedImageType): number {
  switch (type) {
    case 'image/png': return 1.0; // PNG é lossless
    case 'image/jpeg':
    case 'image/webp':
    default: return 0.8;
  }
}

export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<File> {
  const { maxWidth = 1920, maxHeight = 1920 } = options;

  const outputType = getOutputMimeType(file);
  if (!outputType) {
    return file; // Tipo não suportado, retorna original
  }

  const quality = options.quality ?? getDefaultQuality(outputType);

  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      let { width, height } = img;

      // Verificar se precisa redimensionar
      const needsResize = width > maxWidth || height > maxHeight;
      
      // Para PNG sem redimensionamento, retorna original
      // (PNG lossless não ganha muito com recompressão)
      if (!needsResize && outputType === 'image/png') {
        URL.revokeObjectURL(img.src);
        resolve(file);
        return;
      }

      if (needsResize) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(img.src);
        reject(new Error('Não foi possível criar contexto do canvas'));
        return;
      }

      // Limpar canvas para preservar transparência (PNG/WebP)
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(img.src);
          
          if (!blob) {
            reject(new Error('Falha ao comprimir imagem'));
            return;
          }

          const compressedFile = new File([blob], file.name, {
            type: outputType,
            lastModified: Date.now(),
          });

          const reduction = Math.round((1 - compressedFile.size / file.size) * 100);
          console.log(
            `Imagem ${outputType.split('/')[1].toUpperCase()} comprimida: ${(file.size / 1024).toFixed(1)}KB → ${(compressedFile.size / 1024).toFixed(1)}KB (${reduction}% redução)`
          );
          
          resolve(compressedFile);
        },
        outputType,
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error('Erro ao carregar imagem'));
    };
    
    img.src = URL.createObjectURL(file);
  });
}
