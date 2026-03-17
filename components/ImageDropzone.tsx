
import React, { useRef, useState } from 'react';
import { SourceImage } from '../types';

interface ImageDropzoneProps {
  onImageUpload?: (image: SourceImage) => void;
  onImagesUpload?: (images: SourceImage[]) => void;
  className?: string;
  children?: React.ReactNode;
  multiple?: boolean;
}

export const ImageDropzone: React.FC<ImageDropzoneProps> = ({ 
    onImageUpload, 
    onImagesUpload,
    className, 
    children,
    multiple = false 
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const processFiles = (fileList: FileList) => {
    const files = Array.from(fileList).filter(file => file.type.startsWith('image/'));
    
    if (files.length === 0) return;

    if (multiple && onImagesUpload) {
        const promises = files.map(file => new Promise<SourceImage>((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                resolve({
                    base64: (e.target?.result as string).split(',')[1],
                    mimeType: file.type,
                    file: file
                });
            };
            reader.readAsDataURL(file);
        }));

        Promise.all(promises).then(images => {
            onImagesUpload(images);
        });
    } else if (onImageUpload && files.length > 0) {
        const file = files[0];
        const reader = new FileReader();
        reader.onload = (e) => {
            onImageUpload({
                base64: (e.target?.result as string).split(',')[1],
                mimeType: file.type,
                file: file
            });
        };
        reader.readAsDataURL(file);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) processFiles(e.target.files);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) processFiles(e.dataTransfer.files);
  };

  return (
    <div 
        className={`${className} ${isDragging ? 'bg-brand-primary/20 border-brand-accent' : ''}`}
        onClick={() => fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
    >
      {children}
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        onChange={handleChange} 
        multiple={multiple}
        accept="image/png, image/jpeg, image/webp"
      />
    </div>
  );
};
