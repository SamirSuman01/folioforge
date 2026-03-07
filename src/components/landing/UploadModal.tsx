'use client';

import { useState, useRef, useCallback } from 'react';
import type { Field } from '@/lib/types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (text: string, field: Field | null) => void;
}

export default function UploadModal({ isOpen, onClose, onComplete }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((f: File) => {
    setError('');
    if (f.type !== 'application/pdf') { setError('Please upload a PDF file.'); return; }
    if (f.size > 4 * 1024 * 1024) { setError('File too large (max 4MB).'); return; }
    setFile(f);
  }, []);

  async function handleUpload() {
    if (!file) return;
    setUploading(true);
    setError('');
    const formData = new FormData();
    formData.append('pdf', file);
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Upload failed.'); setUploading(false); return; }
      onComplete(data.text, data.field);
    } catch {
      setError('Upload failed. Please try again.');
      setUploading(false);
    }
  }

  function handleClose() {
    if (uploading) return;
    setFile(null);
    setError('');
    onClose();
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-5"
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}>
      <div className="bg-bg2 rounded-xl border border-white/[0.06] w-full max-w-md p-7 relative animate-[fadeInUp_0.25s_ease-out]">
        <button onClick={handleClose}
          className="absolute top-3 right-3 text-bone4 hover:text-bone3 w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/[0.04] transition-colors"
          aria-label="Close">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
        </button>

        {uploading ? (
          <div className="py-10 text-center">
            <div className="w-12 h-12 mx-auto mb-4 relative">
              <svg className="animate-spin" width="48" height="48" viewBox="0 0 48 48">
                <circle cx="24" cy="24" r="20" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="3" />
                <circle cx="24" cy="24" r="20" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeDasharray="126" strokeDashoffset="94" className="text-accent" />
              </svg>
            </div>
            <p className="text-bone text-sm font-medium mb-1">Extracting your experience</p>
            <p className="text-bone4 text-xs">A few seconds...</p>
          </div>
        ) : (
          <>
            <h2 className="text-lg font-bold text-bone mb-1">Upload your resume</h2>
            <p className="text-bone4 text-sm mb-5">AI transforms it in under 60 seconds.</p>

            {error && (
              <div className="mb-4 p-2.5 rounded-lg bg-error/10 border border-error/15 text-error text-sm">{error}</div>
            )}

            {file ? (
              <div className="border border-accent/15 bg-accent/5 rounded-lg p-3.5 mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-accent">
                    <path d="M14.5 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V7.5L14.5 2z" /><path d="M14 2v6h6" />
                  </svg>
                  <div>
                    <p className="text-bone text-sm">{file.name}</p>
                    <p className="text-bone4 text-[10px]">{(file.size / 1024).toFixed(0)} KB</p>
                  </div>
                </div>
                <button onClick={() => setFile(null)} className="text-bone4 hover:text-error transition-colors">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
                </button>
              </div>
            ) : (
              <div
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
                onClick={() => inputRef.current?.click()}
                className={`border-2 border-dashed rounded-lg p-7 text-center cursor-pointer transition-all mb-4 ${
                  dragging ? 'border-accent bg-accent/5' : 'border-white/[0.06] hover:border-white/[0.1]'
                }`}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-bone4 mx-auto mb-2">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                </svg>
                <p className="text-bone text-sm">Drop PDF or click to browse</p>
                <p className="text-bone4 text-[10px] mt-1">Max 4MB</p>
                <input ref={inputRef} type="file" accept=".pdf" className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
              </div>
            )}

            {file && (
              <button onClick={handleUpload}
                className="w-full py-2.5 bg-accent text-bg font-semibold text-sm rounded-lg hover:bg-accent2 transition-colors">
                Generate my portfolio
              </button>
            )}

            <div className="mt-4 pt-4 border-t border-white/[0.04] flex items-center justify-center gap-4 text-bone4 text-[10px]">
              <span className="flex items-center gap-1">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-success/50"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                Deleted after processing
              </span>
              <span>Free forever</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
