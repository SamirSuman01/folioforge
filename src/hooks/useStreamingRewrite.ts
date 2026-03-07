'use client';
import { useState, useCallback, useRef } from 'react';
import type { PortfolioData, Field } from '@/lib/types';

export function useStreamingRewrite() {
  const [streamedText, setStreamedText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [portfolioData, setPortfolioData] = useState<PortfolioData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const bufferRef = useRef('');

  const startStreaming = useCallback(async (linkedinText: string, field: Field) => {
    setIsStreaming(true);
    setStreamedText('');
    setPortfolioData(null);
    setError(null);
    bufferRef.current = '';

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: linkedinText, field }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Server error: ${response.status}`);
      }

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        bufferRef.current += decoder.decode(value, { stream: true });
        const events = bufferRef.current.split('\n\n');
        bufferRef.current = events.pop() || '';

        for (const event of events) {
          for (const line of event.split('\n')) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') {
                setIsStreaming(false);
                try {
                  // Clean markdown code fences if present
                  let cleaned = fullText.trim();
                  if (cleaned.startsWith('```json')) cleaned = cleaned.slice(7);
                  if (cleaned.startsWith('```')) cleaned = cleaned.slice(3);
                  if (cleaned.endsWith('```')) cleaned = cleaned.slice(0, -3);
                  setPortfolioData(JSON.parse(cleaned.trim()));
                } catch {
                  setError('AI returned invalid data. Please try again.');
                }
                return;
              }
              try {
                const parsed = JSON.parse(data);
                const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text || '';
                fullText += text;
                setStreamedText(fullText);
              } catch {
                fullText += data;
                setStreamedText(fullText);
              }
            }
          }
        }
      }

      // If we get here without [DONE], try to parse what we have
      if (fullText && !portfolioData) {
        try {
          let cleaned = fullText.trim();
          if (cleaned.startsWith('```json')) cleaned = cleaned.slice(7);
          if (cleaned.startsWith('```')) cleaned = cleaned.slice(3);
          if (cleaned.endsWith('```')) cleaned = cleaned.slice(0, -3);
          setPortfolioData(JSON.parse(cleaned.trim()));
        } catch {
          setError('AI returned invalid data. Please try again.');
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed. Please try again.');
    } finally {
      setIsStreaming(false);
    }
  }, [portfolioData]);

  return { streamedText, isStreaming, portfolioData, error, startStreaming };
}
