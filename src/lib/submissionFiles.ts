import { supabase } from './supabase';

const BUCKET_NAME = 'sanrachna-uploads';

export interface SubmissionFileItem {
  name: string;
  path: string;
  publicUrl: string;
  isImage: boolean;
}

export async function getSubmissionFiles(referenceId: string): Promise<{
  photos: SubmissionFileItem[];
  contentFiles: SubmissionFileItem[];
}> {
  const cleanRef = referenceId.trim();
  if (!cleanRef) {
    return { photos: [], contentFiles: [] };
  }

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .list(cleanRef, {
      limit: 50,
      sortBy: { column: 'name', order: 'asc' },
    });

  if (error || !data) {
    console.error('Error listing submission files:', error);
    return { photos: [], contentFiles: [] };
  }

  const files = data.filter((item) => item.id !== null);

  const mapped: SubmissionFileItem[] = files.map((file) => {
    const path = `${cleanRef}/${file.name}`;
    const { data: urlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(path);
    const lowerName = file.name.toLowerCase();
    const isImage =
      lowerName.startsWith('photo_') ||
      /\.(png|jpe?g|webp|gif)$/i.test(lowerName);

    return {
      name: file.name,
      path,
      publicUrl: urlData.publicUrl,
      isImage,
    };
  });

  return {
    photos: mapped.filter((f) => f.isImage),
    contentFiles: mapped.filter((f) => !f.isImage),
  };
}