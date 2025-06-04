// components/ImageUploader.tsx
'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface ImageUploaderProps {
  onUpload: (urls: string[]) => void;
  multiple?: boolean;
}

export default function ImageUploader({ onUpload, multiple = false }: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);

  const handleFiles = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);

    const bucketName = 'portfolio-images'; // stwórz ten bucket w Supabase Storage
    const publicUrls: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileExt = file.name.split('.').pop();
      const fileName = `portfolio_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 5)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file, { cacheControl: '3600', upsert: false });

      if (error) {
        console.error('Błąd uploadu:', error);
        continue;
      }
      // Pobieramy publiczny URL
      const { publicURL, error: urlError } = supabase.storage
        .from(bucketName)
        .getPublicUrl(data.path);
      if (urlError) {
        console.error('Błąd pobrania public URL:', urlError);
        continue;
      }
      publicUrls.push(publicURL || '');
    }

    setUploadedUrls(publicUrls);
    onUpload(publicUrls);
    setUploading(false);
  };

  return (
    <div className="flex items-center gap-4">
      <label
        htmlFor="image-upload-input"
        className="
          cursor-pointer 
          inline-flex items-center 
          bg-gradient-to-r from-cyan-400 to-blue-500 
          text-white px-4 py-2 
          rounded-lg shadow-lg 
          hover:brightness-110 transition
        "
      >
        {uploading ? 'Przesyłanie...' : 'Wybierz zdjęcia'}
      </label>
      <input
        id="image-upload-input"
        type="file"
        accept="image/*"
        multiple={multiple}
        onChange={handleFiles}
        className="hidden"
      />
      <div className="flex space-x-2">
        {uploadedUrls.map((url, idx) => (
          <img
            key={idx}
            src={url}
            alt={`Zdjęcie ${idx + 1}`}
            className="h-16 w-16 rounded-lg object-cover border border-white/20"
          />
        ))}
      </div>
    </div>
  );
}
