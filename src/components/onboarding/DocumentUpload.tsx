import React, { useRef, useState } from 'react';
import { cn } from '@/utils/cn';
import { Badge } from '@/components/ui';

interface DocumentUploadProps {
  label: string;
  description?: string;
  accept?: string;
  required?: boolean;
  onUpload: (file: File) => void;
  value?: File | null;
  error?: string;
  maxSize?: number; // in MB
}

export const DocumentUpload: React.FC<DocumentUploadProps> = ({
  label,
  description,
  accept = 'image/*,application/pdf',
  required = false,
  onUpload,
  value,
  error,
  maxSize = 5,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      alert(`File size must be less than ${maxSize}MB`);
      return;
    }

    onUpload(file);

    // Generate preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onUpload(null as any);
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <label className="text-sm font-medium text-text-primary">
            {label}
            {required && <span className="text-status-error ml-1">*</span>}
          </label>
          {description && (
            <p className="text-xs text-text-secondary mt-1">{description}</p>
          )}
        </div>
        {value && (
          <Badge variant="success">
            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
            Uploaded
          </Badge>
        )}
      </div>

      <div
        onClick={handleClick}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={cn(
          'relative glass-card border-2 border-dashed cursor-pointer transition-all duration-200',
          'hover:border-accent-blue hover:bg-white/5',
          dragActive && 'border-accent-blue bg-accent-blue/10',
          error && 'border-status-error',
          value && 'border-status-success'
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleChange}
          className="hidden"
        />

        {preview ? (
          <div className="relative">
            <img
              src={preview}
              alt="Preview"
              className="w-full h-48 object-cover rounded-glass"
            />
            <button
              onClick={handleRemove}
              className="absolute top-8 right-8 p-8 bg-status-error rounded-full hover:bg-status-error/80 transition-colors"
            >
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ) : value ? (
          <div className="flex items-center justify-between p-16">
            <div className="flex items-center gap-12">
              <div className="p-12 bg-accent-blue/20 rounded-glass">
                <svg className="w-6 h-6 text-accent-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-text-primary">{value.name}</p>
                <p className="text-xs text-text-tertiary">
                  {(value.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            <button
              onClick={handleRemove}
              className="p-8 hover:bg-status-error/20 rounded-full transition-colors"
            >
              <svg className="w-5 h-5 text-status-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ) : (
          <div className="text-center py-32">
            <div className="mx-auto w-16 h-16 mb-16 bg-accent-blue/20 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-accent-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </div>
            <p className="text-sm font-medium text-text-primary mb-4">
              Click to upload or drag and drop
            </p>
            <p className="text-xs text-text-tertiary">
              PNG, JPG, PDF up to {maxSize}MB
            </p>
          </div>
        )}
      </div>

      {error && (
        <p className="text-xs text-status-error">{error}</p>
      )}
    </div>
  );
};
