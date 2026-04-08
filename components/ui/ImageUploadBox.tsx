import React, { useRef, useState } from 'react';
import { Avatar } from './Avatar';
import LoadingSpinner from './LoadingSpinner';

interface ImageUploadBoxProps {
  currentImageUrl?: string | null;
  name?: string;
  onUpload: (file: File) => Promise<void>;
  disabled?: boolean;
}

export const ImageUploadBox: React.FC<ImageUploadBoxProps> = ({ currentImageUrl, name, onUpload, disabled }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      await onUpload(file);
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div
      className={`relative inline-block ${disabled ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}
      onMouseEnter={() => !disabled && setIsHovered(true)}
      onMouseLeave={() => !disabled && setIsHovered(false)}
      onClick={() => !disabled && fileInputRef.current?.click()}
    >
      <Avatar src={currentImageUrl} name={name} size="xl" className="border-4 border-white shadow-lg" />
      
      {!disabled && (isHovered || !currentImageUrl) && (
        <div className="absolute inset-0 bg-black/40 rounded-full flex flex-col items-center justify-center text-white transition-opacity duration-200">
          {isUploading ? (
            <LoadingSpinner size={20} text="" />
          ) : (
            <>
              <svg className="w-6 h-6 mb-1 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-xs font-semibold">{currentImageUrl ? 'Cambiar' : 'Subir'}</span>
            </>
          )}
        </div>
      )}

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/jpeg, image/png, image/webp"
        className="hidden"
        disabled={disabled || isUploading}
      />
    </div>
  );
};
