
import React, { useState, useCallback, useId, useEffect } from 'react';
import { ImageFile } from '../types';

interface MultiImageUploaderProps {
  onFilesSelect: (images: ImageFile[]) => void;
  label: string;
  maxFiles?: number;
  acceptPdf?: boolean;
}

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

export const MultiImageUploader: React.FC<MultiImageUploaderProps> = ({ onFilesSelect, label, maxFiles = 10, acceptPdf = false }) => {
  const [dragging, setDragging] = useState(false);
  const [imageFiles, setImageFiles] = useState<ImageFile[]>([]);
  const uniqueId = useId();

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files) return;

    const allowedTypes = ['image/png', 'image/jpeg', 'image/webp'];
    if (acceptPdf) allowedTypes.push('application/pdf');

    const validFiles = Array.from(files).filter(file => 
        allowedTypes.includes(file.type)
    );

    if (imageFiles.length + validFiles.length > maxFiles) {
        alert(`You can only upload a maximum of ${maxFiles} files.`);
        validFiles.splice(maxFiles - imageFiles.length);
    }
    
    const newImageFilePromises = validFiles.map(file => new Promise<ImageFile>(async (resolve) => {
        const base64 = await fileToBase64(file);
        const url = URL.createObjectURL(file);
        
        if (file.type === 'application/pdf') {
             resolve({ file, base64, url, width: 0, height: 0 });
        } else {
            const img = new Image();
            img.onload = () => {
                resolve({ file, base64, url, width: img.naturalWidth, height: img.naturalHeight });
            };
            img.onerror = () => {
                resolve({ file, base64, url });
            }
            img.src = url;
        }
    }));

    const newImageFiles = await Promise.all(newImageFilePromises);
    
    const updatedFiles = [...imageFiles, ...newImageFiles];
    setImageFiles(updatedFiles);
    onFilesSelect(updatedFiles);
  }, [onFilesSelect, imageFiles, maxFiles, acceptPdf]);

  const handleRemoveImage = (indexToRemove: number) => {
    const fileToRemove = imageFiles[indexToRemove];
    if (fileToRemove) {
        URL.revokeObjectURL(fileToRemove.url);
    }
    const updatedFiles = imageFiles.filter((_, index) => index !== indexToRemove);
    setImageFiles(updatedFiles);
    onFilesSelect(updatedFiles);
  };

  useEffect(() => {
    return () => {
        imageFiles.forEach(imgFile => URL.revokeObjectURL(imgFile.url));
    };
  }, [imageFiles]);

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
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
          handleFiles(e.target.files);
      }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative border border-dashed rounded-xl p-4 text-center transition-all duration-300 flex flex-col items-center justify-center min-h-[160px] ${dragging ? 'border-brand-accent bg-brand-accent/10' : 'border-white/20 bg-black/20 hover:border-brand-accent/50 hover:bg-black/30'}`}
    >
      <input
        type="file"
        id={uniqueId}
        className="absolute w-0 h-0 opacity-0"
        accept={acceptPdf ? "image/png, image/jpeg, image/webp, application/pdf" : "image/png, image/jpeg, image/webp"}
        onChange={handleChange}
        multiple
      />
      <label htmlFor={uniqueId} className="cursor-pointer flex flex-col items-center justify-center h-full w-full">
         {imageFiles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6">
              <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center mb-3">
                  <svg className="w-5 h-5 text-brand-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
              </div>
              <p className="text-sm font-medium text-brand-text-muted">{label}</p>
              <span className="text-[10px] text-brand-text-muted/60 mt-1 uppercase">PNG, JPG, WEBP{acceptPdf ? ', PDF' : ''} (Max {maxFiles})</span>
            </div>
         ) : (
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 w-full">
                {imageFiles.map((img, index) => (
                    <div key={index} className="relative group aspect-square">
                        {img.file.type === 'application/pdf' ? (
                            <div className="w-full h-full flex flex-col items-center justify-center bg-red-500/10 rounded-md border border-red-500/30">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-red-400 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                                <span className="text-[8px] text-red-300 truncate w-full px-1 text-center">{img.file.name}</span>
                            </div>
                        ) : (
                            <img src={img.url} alt={`Preview ${index}`} className="w-full h-full object-cover rounded-md border border-white/10" />
                        )}
                        <button 
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleRemoveImage(index); }}
                            className="absolute top-1 right-1 p-0.5 rounded bg-black/60 hover:bg-red-500/80 text-white transition-colors z-10 opacity-0 group-hover:opacity-100 backdrop-blur-sm"
                            title="Remove file"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                    </div>
                ))}
                {imageFiles.length < maxFiles && (
                    <div className="flex items-center justify-center aspect-square rounded-md border border-dashed border-white/20 bg-white/5 hover:bg-white/10 text-brand-text-muted">
                        <span className="text-xl">+</span>
                    </div>
                )}
            </div>
         )}
      </label>
    </div>
  );
};
