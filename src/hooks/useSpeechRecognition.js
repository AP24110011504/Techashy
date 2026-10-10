import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Web Speech Recognition Hook
 * Provides browser-native speech-to-text with error handling,
 * listening indicator, permission management, and text fallback.
 */
export function useSpeechRecognition({ onResult, onError } = {}) {
  const [isSupported, setIsSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [speechError, setSpeechError] = useState(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        setIsSupported(true);
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
          setIsListening(true);
          setSpeechError(null);
        };

        recognition.onresult = (event) => {
          let currentTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            currentTranscript += event.results[i][0].transcript;
          }
          setTranscript(currentTranscript);
          if (event.results[0].isFinal && onResult) {
            onResult(currentTranscript);
          }
        };

        recognition.onerror = (event) => {
          console.warn('Speech recognition event error:', event.error);
          setIsListening(false);
          let message = 'Speech recognition failed.';
          if (event.error === 'not-allowed') {
            message = 'Microphone access denied. Please allow microphone permissions or use text input.';
          } else if (event.error === 'no-speech') {
            message = 'No speech detected. Please try speaking again.';
          } else if (event.error === 'network') {
            message = 'Speech recognition network error.';
          }
          setSpeechError(message);
          if (onError) onError(message);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }
    };
  }, [onResult, onError]);

  const startListening = useCallback(() => {
    setSpeechError(null);
    setTranscript('');
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch {
        // Recognition might already be running
        try {
          recognitionRef.current.stop();
          setTimeout(() => recognitionRef.current?.start(), 150);
        } catch (e) {
          setSpeechError('Could not start microphone session.');
        }
      }
    } else {
      setSpeechError('Speech recognition is not supported in this browser. Please type your query.');
    }
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
    }
    setIsListening(false);
  }, [isListening]);

  return {
    isSupported,
    isListening,
    transcript,
    speechError,
    startListening,
    stopListening,
    clearTranscript: () => setTranscript('')
  };
}
