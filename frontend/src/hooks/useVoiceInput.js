import { useState, useEffect, useCallback, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';

export const useVoiceInput = (onResult) => {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState(null);
  const [isSupported, setIsSupported] = useState(true);
  const [interimResult, setInterimResult] = useState("");
  const recognitionRef = useRef(null);
  
  const { language } = useLanguage();

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
    
    // Map internal language code to BCP 47 language tag for Speech Recognition
    switch (language) {
      case 'hi': recognition.lang = 'hi-IN'; break;
      case 'mr': recognition.lang = 'mr-IN'; break;
      case 'ta': recognition.lang = 'ta-IN'; break;
      case 'te': recognition.lang = 'te-IN'; break;
      case 'bn': recognition.lang = 'bn-IN'; break;
      case 'gu': recognition.lang = 'gu-IN'; break;
      case 'kn': recognition.lang = 'kn-IN'; break;
      case 'ml': recognition.lang = 'ml-IN'; break;
      case 'pa': recognition.lang = 'pa-IN'; break;
      case 'or': recognition.lang = 'or-IN'; break;
      default: recognition.lang = 'en-IN';
    }

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
      setInterimResult("");
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error", event.error);
      if (event.error !== 'no-speech') {
        setError(event.error);
      }
      setIsListening(false);
      setInterimResult("");
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimResult("");
    };

    recognition.onresult = (event) => {
      let finalTranscript = '';
      let interimTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript + ' ';
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      
      setInterimResult(interimTranscript);
      
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
  }, [language]);

  const toggleListening = useCallback(() => {
    if (!recognitionRef.current) return;
    
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try {
        setInterimResult("");
        recognitionRef.current.start();
      } catch (err) {
        console.error("Failed to start speech recognition", err);
      }
    }
  }, [isListening]);

  return { isListening, error, isSupported, interimResult, toggleListening };
};
