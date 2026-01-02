export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
}

export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<File> {
  const { maxWidth = 1920, maxHeight = 1920, quality = 0.8 } = options;

  // Verificar se é JPEG
  if (!file.type.match(/image\/(jpeg|jpg)/i)) {
    return file;
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      // Calcular novas dimensões mantendo proporção
      let { width, height } = img;

      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      // Criar canvas e desenhar imagem redimensionada
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(img.src);
        reject(new Error('Não foi possível criar contexto do canvas'));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      // Converter para blob com compressão
      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(img.src);
          
          if (!blob) {
            reject(new Error('Falha ao comprimir imagem'));
            return;
          }

          // Criar novo File com o blob comprimido
          const compressedFile = new File([blob], file.name, {
            type: 'image/jpeg',
            lastModified: Date.now(),
          });

          console.log(
            `Imagem comprimida: ${(file.size / 1024).toFixed(1)}KB → ${(compressedFile.size / 1024).toFixed(1)}KB (${Math.round((1 - compressedFile.size / file.size) * 100)}% redução)`
          );
          
          resolve(compressedFile);
        },
        'image/jpeg',
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
