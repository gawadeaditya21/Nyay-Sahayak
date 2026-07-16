import { useState, useEffect, useCallback, useRef } from 'react';

export const useVoiceInput = (onResult) => {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState(null);
  const [isSupported, setIsSupported] = useState(true);
  const recognitionRef = useRef(null);

  const onResultRef = useRef(onResult);

  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }
    
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    
    const savedLang = localStorage.getItem('language');
    if (savedLang) {
      try {
        const parsedLang = JSON.parse(savedLang);
        if (parsedLang.code === 'hi') recognition.lang = 'hi-IN';
        else if (parsedLang.code === 'mr') recognition.lang = 'mr-IN';
        else if (parsedLang.code === 'ta') recognition.lang = 'ta-IN';
        else if (parsedLang.code === 'te') recognition.lang = 'te-IN';
        else if (parsedLang.code === 'bn') recognition.lang = 'bn-IN';
        else if (parsedLang.code === 'gu') recognition.lang = 'gu-IN';
        else if (parsedLang.code === 'kn') recognition.lang = 'kn-IN';
        else if (parsedLang.code === 'ml') recognition.lang = 'ml-IN';
        else if (parsedLang.code === 'pa') recognition.lang = 'pa-IN';
        else if (parsedLang.code === 'or') recognition.lang = 'or-IN';
        else recognition.lang = 'en-IN';
      } catch (e) {
        recognition.lang = 'en-IN';
      }
    } else {
      recognition.lang = 'en-IN';
    }

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error", event.error);
      if (event.error !== 'no-speech') {
        setError(event.error);
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onresult = (event) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript + ' ';
        }
      }
      if (finalTranscript && onResultRef.current) {
        onResultRef.current(finalTranscript);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const toggleListening = useCallback(() => {
    if (!recognitionRef.current) return;
    
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.error("Failed to start speech recognition", err);
      }
    }
  }, [isListening]);

  return { isListening, error, isSupported, toggleListening };
};
