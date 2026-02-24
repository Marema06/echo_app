'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface SpeechRecognitionEvent {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent {
  error: string;
}

interface SpeechRecognitionInstance extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition: new () => SpeechRecognitionInstance;
  }
}

export function useSpeech(onTranscript: (text: string) => void) {
  const [isRecording, setIsRecording] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [seconds, setSeconds] = useState(0);
  const [interimText, setInterimText] = useState('');
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const baseTextRef = useRef('');

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'fr-FR';
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      if (finalTranscript) {
        const combined = `${baseTextRef.current} ${finalTranscript}`.replace(/\s+/g, ' ').trim();
        baseTextRef.current = combined;
        onTranscript(combined);
      }

      setInterimText(interimTranscript);
    };

    recognition.onerror = () => {
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
    };
  }, [onTranscript]);

  useEffect(() => {
    if (!isRecording) return;
    const interval = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, [isRecording]);

  const toggleRecording = useCallback((currentText: string) => {
    if (!recognitionRef.current) return;

    if (!isRecording) {
      baseTextRef.current = currentText;
      setSeconds(0);
      setInterimText('');
      setIsRecording(true);
      recognitionRef.current.start();
    } else {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
  }, [isRecording]);

  const formattedTime = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;

  return {
    isRecording,
    isSupported,
    seconds,
    formattedTime,
    interimText,
    toggleRecording,
  };
}
