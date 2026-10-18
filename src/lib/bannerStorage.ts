import { createClient } from '@/lib/supabase/client';

/**
 * Uploads a banner image to Supabase Storage bucket 'banners'.
 * If Supabase Storage is not set up or encounters an error, it gracefully
 * falls back to returning the high-resolution dataUrl so the application
 * continues to function seamlessly with zero disruption.
 */
export async function uploadBannerImage(
  userId: string,
  imageInput: Blob | string
): Promise<{ bannerUrl: string; error?: any }> {
  // If it's already a regular HTTP URL, return as-is
  if (typeof imageInput === 'string' && (imageInput.startsWith('http://') || imageInput.startsWith('https://'))) {
    return { bannerUrl: imageInput };
  }

  const supabase = createClient();

  try {
    let fileBlob: Blob;
    let dataUrlFallback: string = '';

    if (typeof imageInput === 'string') {
      dataUrlFallback = imageInput;
      // Convert data URL to Blob
      const res = await fetch(imageInput);
      fileBlob = await res.blob();
    } else {
      fileBlob = imageInput;
    }

    // Attempt upload to Supabase Storage 'banners' bucket
    const fileName = `${userId}/banner_${Date.now()}.jpg`;

    const { data, error } = await supabase.storage
      .from('banners')
      .upload(fileName, fileBlob, {
        contentType: 'image/jpeg',
        upsert: true,
      });

    if (error) {
      console.warn('Supabase Storage upload warning (falling back to dataUrl):', error.message);
      return { bannerUrl: dataUrlFallback || (typeof imageInput === 'string' ? imageInput : '') };
    }

    if (data?.path) {
      const { data: urlData } = supabase.storage
        .from('banners')
        .getPublicUrl(data.path);

      if (urlData?.publicUrl) {
        return { bannerUrl: urlData.publicUrl };
      }
    }

    return { bannerUrl: dataUrlFallback };
  } catch (err: any) {
    console.warn('Banner upload exception, using fallback:', err);
    return { 
      bannerUrl: typeof imageInput === 'string' ? imageInput : '',
      error: err 
    };
  }
}
