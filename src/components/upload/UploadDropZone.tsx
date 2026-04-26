'use client';

import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, X, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UploadDropZoneProps {
  onFileSelect: (file: File) => void;
}

export default function UploadDropZone({ onFileSelect }: UploadDropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file && (file.type === 'application/pdf' || file.name.endsWith('.pdf'))) {
        setSelectedFile(file);
        onFileSelect(file);
      }
    },
    [onFileSelect]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        setSelectedFile(file);
        onFileSelect(file);
      }
    },
    [onFileSelect]
  );

  const clearFile = () => {
    setSelectedFile(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="mx-auto w-full max-w-xl">
      <input ref={inputRef} type="file" accept=".pdf" className="hidden" onChange={handleFileInput} />

      <AnimatePresence mode="wait">
        {selectedFile ? (
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="ff-panel-strong p-6"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[rgba(23,63,53,0.14)] bg-[rgba(23,63,53,0.08)]">
                <CheckCircle2 className="h-6 w-6 text-[#173f35]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-medium text-[#171210]">{selectedFile.name}</p>
                <p className="mt-0.5 text-[12px] text-[#7d7064]">
                  {(selectedFile.size / 1024).toFixed(1)} KB · Ready to create your draft
                </p>
              </div>
              <button
                onClick={clearFile}
                className="rounded-xl border border-[rgba(124,105,89,0.14)] bg-white p-2 text-[#5b5149] transition-colors hover:text-[#171210]"
                aria-label="Remove selected file"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="dropzone"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onClick={() => inputRef.current?.click()}
            onDragEnter={handleDragIn}
            onDragLeave={handleDragOut}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={cn(
              'ff-panel-strong cursor-pointer px-8 py-16 text-center transition-all duration-300',
              isDragging ? 'border-[rgba(23,63,53,0.28)] bg-[rgba(255,255,255,0.97)] shadow-[0_30px_90px_rgba(23,63,53,0.14)]' : ''
            )}
          >
            <motion.div
              animate={{ y: isDragging ? -6 : 0 }}
              transition={{ type: 'spring', stiffness: 300 }}
              className={cn(
                'mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-[22px] border transition-all duration-300',
                isDragging
                  ? 'border-[rgba(23,63,53,0.22)] bg-[rgba(23,63,53,0.08)] text-[#173f35]'
                  : 'border-[rgba(124,105,89,0.14)] bg-[rgba(23,63,53,0.06)] text-[#6e6359]'
              )}
            >
              {isDragging ? <FileText className="h-7 w-7" /> : <Upload className="h-7 w-7" />}
            </motion.div>

            <p className="mb-2 font-display text-[24px] font-semibold tracking-[-0.03em] text-[#171210]">
              {isDragging ? 'Drop your resume here' : 'Drop your resume PDF here'}
            </p>
            <p className="mx-auto mb-6 max-w-sm text-[14px] leading-relaxed text-[#675c53]">
              Click to browse or drag the file in. We use it to create an editable portfolio draft.
            </p>
            <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(124,105,89,0.14)] bg-white px-4 py-2 text-[12px] text-[#74685d]">
              <FileText className="h-3.5 w-3.5" />
              <span>PDF files up to 4MB</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
