'use client';

import { useEffect, useRef } from 'react';

export function useAutoSave(key: string, value: string, intervalMs = 10000) {
  const savedRef = useRef(value);

  useEffect(() => {
    // Load saved draft on mount
    const saved = localStorage.getItem(key);
    if (saved && !value) {
      savedRef.current = saved;
    }
  }, [key, value]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (value && value !== savedRef.current) {
        localStorage.setItem(key, value);
        savedRef.current = value;
      }
    }, intervalMs);

    return () => clearInterval(timer);
  }, [key, value, intervalMs]);

  const clearDraft = () => {
    localStorage.removeItem(key);
    savedRef.current = '';
  };

  const loadDraft = (): string => {
    return localStorage.getItem(key) || '';
  };

  return { clearDraft, loadDraft };
}
