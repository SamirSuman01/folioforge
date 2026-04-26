'use client';

import { useState, useRef, useCallback } from 'react';
import type { Field } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Upload, FileText, X, Shield, AlertCircle, Loader2 } from 'lucide-react';

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
    if (f.type !== 'application/pdf') { setError("We couldn't find a career signal in this file. Try a PDF or LinkedIn export instead."); return; }
    if (f.size > 4 * 1024 * 1024) { setError("That file's a bit heavy. Keep it under 4MB — most resumes are well under 200KB."); return; }
    setFile(f);
  }, []);

  async function handleUpload() {
    if (!file) return;
    setUploading(true);
    setError('');
    const formData = new FormData();
    formData.append('pdf', file);
    const controller = new AbortController();
    const timeoutId  = setTimeout(() => controller.abort(), 60_000);
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData, signal: controller.signal });
      clearTimeout(timeoutId);
      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { error?: string };
        setError(data.error || "Something blocked the signal. Check your connection and try again.");
        setUploading(false);
        return;
      }
      const data = await res.json();
      onComplete(data.text, data.field);
    } catch (e) {
      clearTimeout(timeoutId);
      const msg = (e instanceof Error && e.name === 'AbortError')
        ? 'Upload timed out — please try again.'
        : 'Something blocked the signal. Check your connection and try again.';
      setError(msg);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm px-5"
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}>
      <Card className="w-full max-w-md p-7 relative animate-fade-in-up shadow-xl">
        <button onClick={handleClose}
          className="absolute top-3 right-3 text-muted-foreground hover:text-foreground w-7 h-7 flex items-center justify-center rounded-lg hover:bg-secondary transition-colors"
          aria-label="Close">
          <X className="w-4 h-4" />
        </button>

        {uploading ? (
          <div className="py-10 text-center">
            <div className="w-12 h-12 mx-auto mb-4 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-accent animate-spin" />
            </div>
            <p className="text-foreground text-sm font-medium mb-1">Extracting your experience</p>
            <p className="text-muted-foreground text-xs">A few seconds...</p>
          </div>
        ) : (
          <>
            <h2 className="text-lg font-bold text-foreground mb-1">Upload your resume</h2>
            <p className="text-muted-foreground text-sm mb-5">AI transforms it in under 60 seconds.</p>

            {error && (
              <div className="mb-4 p-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                {error}
              </div>
            )}

            {file ? (
              <div className="border border-accent/20 bg-accent/5 rounded-lg p-3.5 mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <FileText className="w-4 h-4 text-accent" />
                  <div>
                    <p className="text-foreground text-sm">{file.name}</p>
                    <p className="text-muted-foreground text-[10px]">{(file.size / 1024).toFixed(0)} KB</p>
                  </div>
                </div>
                <button onClick={() => setFile(null)} className="text-muted-foreground hover:text-destructive transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
                onClick={() => inputRef.current?.click()}
                className={`border-2 border-dashed rounded-lg p-7 text-center cursor-pointer transition-all mb-4 ${
                  dragging ? 'border-accent bg-accent/5' : 'border-border hover:border-muted-foreground/30'
                }`}>
                <Upload className="w-5 h-5 text-muted-foreground mx-auto mb-2" />
                <p className="text-foreground text-sm">Drop PDF or click to browse</p>
                <p className="text-muted-foreground text-[10px] mt-1">Max 4MB</p>
                <input ref={inputRef} type="file" accept=".pdf" className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
              </div>
            )}

            {file && (
              <Button onClick={handleUpload} className="w-full">
                Generate my portfolio
              </Button>
            )}

            <div className="mt-4 pt-4 border-t border-border flex items-center justify-center gap-4 text-muted-foreground text-[10px]">
              <span className="flex items-center gap-1">
                <Shield className="w-2.5 h-2.5 text-green-500/60" />
                Deleted after processing
              </span>
              <span>Free forever</span>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
