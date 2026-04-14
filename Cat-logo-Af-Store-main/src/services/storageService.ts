import { supabase } from '../integrations/supabase/client';

const CATALOG_BUCKET = 'catalog-images';

const sanitizeName = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9-_]/g, '-')
    .replace(/-+/g, '-')
    .toLowerCase();

const toWebpBlob = (file: File, maxWidth = 1600, quality = 0.82) =>
  new Promise<Blob>((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const ratio = Math.min(1, maxWidth / img.width);
      const width = Math.max(1, Math.round(img.width * ratio));
      const height = Math.max(1, Math.round(img.height * ratio));

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas indisponível.'));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Falha ao converter imagem para WebP.'));
            return;
          }
          resolve(blob);
        },
        'image/webp',
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Falha ao processar imagem.'));
    };

    img.src = objectUrl;
  });

const uploadImage = async (file: File, folder: 'products' | 'banners') => {
  const timestamp = Date.now();
  const baseName = sanitizeName(file.name.replace(/\.[^.]+$/, '')) || 'imagem';
  const filePath = `public/${folder}/${timestamp}-${crypto.randomUUID()}-${baseName}.webp`;

  const webpBlob = await toWebpBlob(file, folder === 'banners' ? 1920 : 1600, 0.82);

  const { error: uploadError } = await supabase.storage
    .from(CATALOG_BUCKET)
    .upload(filePath, webpBlob, {
      contentType: 'image/webp',
      upsert: false,
      cacheControl: '31536000',
    });

  if (uploadError) throw uploadError;

  const {
    data: { publicUrl },
  } = supabase.storage.from(CATALOG_BUCKET).getPublicUrl(filePath);

  if (!publicUrl) {
    throw new Error('Não foi possível gerar URL pública da imagem.');
  }

  return `${publicUrl}?updatedAt=${timestamp}`;
};

export const storageService = {
  uploadProductImages(files: File[]) {
    return Promise.all(files.map((file) => uploadImage(file, 'products')));
  },
  uploadBannerImages(files: File[]) {
    return Promise.all(files.map((file) => uploadImage(file, 'banners')));
  },
};
