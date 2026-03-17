
import React, { useState, useCallback, useId, useEffect } from 'react';
import { ImageFile } from '../types';

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

interface ImageUploaderProps {
  onFileSelect: (file: ImageFile | null) => void;
  label: string;
  sourceImage?: ImageFile | null; // Optional prop if we want to control from outside
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ onFileSelect, label, sourceImage }) => {
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const uniqueId = useId();

  useEffect(() => {
      if (sourceImage) {
          setPreview(sourceImage.url);
          setFileName(sourceImage.file.name);
      } else if (sourceImage === null) {
          setPreview(null);
          setFileName(null);
      }
  }, [sourceImage]);


  const handleFile = useCallback(async (file: File | null) => {
    if (preview && !sourceImage) { // Don't revoke if it came from props
        URL.revokeObjectURL(preview);
    }

    if (file && ['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      setFileName(file.name);
      const base64 = await fileToBase64(file);
      const objectUrl = URL.createObjectURL(file);
      
      const img = new Image();
      img.onload = () => {
          onFileSelect({ file, base64, url: objectUrl, width: img.naturalWidth, height: img.naturalHeight });
      };
      img.src = objectUrl;

      setPreview(objectUrl);
    } else {
        setFileName(null);
        setPreview(null);
        onFileSelect(null);
        if (file) alert('Invalid file type. Please use PNG, JPG, or WEBP.');
    }
  }, [onFileSelect, preview, sourceImage]);

  const handleRemove = (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      handleFile(null);
  };

  useEffect(() => {
    return () => {
        if (preview && !sourceImage) {
            URL.revokeObjectURL(preview);
        }
    };
  }, [preview, sourceImage]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, [handleFile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          handleFile(e.target.files[0]);
      }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative border border-dashed rounded-xl p-6 text-center transition-all duration-300 flex flex-col items-center justify-center h-64 group ${dragging ? 'border-brand-accent bg-brand-accent/10' : 'border-white/20 bg-black/20 hover:border-brand-accent/50 hover:bg-black/30'}`}
    >
      <input
        type="file"
        id={uniqueId}
        className="absolute w-0 h-0 opacity-0"
        accept="image/png, image/jpeg, image/webp"
        onChange={handleChange}
      />
      <label htmlFor={uniqueId} className="cursor-pointer flex flex-col items-center justify-center h-full w-full">
         {preview ? (
            <div className="relative w-full h-full">
                <img src={preview} alt="Preview" className="h-full w-full rounded-lg object-contain" />
                <button 
                    onClick={handleRemove}
                    className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-red-500/80 text-white rounded-full transition-colors z-20 backdrop-blur-sm"
                    title="Xoá ảnh"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
            </div>
         ) : (
            <div className="flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-6 h-6 text-brand-text-muted group-hover:text-brand-accent transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
              </div>
              <p className="text-sm font-medium text-brand-text-muted group-hover:text-brand-text transition-colors">{label}</p>
              <span className="text-[10px] text-brand-text-muted/60 mt-1 uppercase tracking-wide">PNG, JPG, WEBP</span>
            </div>
         )}
        {fileName && !preview && (
            <span className="text-xs font-mono bg-brand-primary px-2 py-1 rounded mt-2 absolute bottom-4 text-white">{fileName}</span>
        )}
      </label>
    </div>
  );
};
