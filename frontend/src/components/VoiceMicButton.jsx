import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Loader2, Sparkles, Volume2 } from 'lucide-react';
import api from '../services/api';

export default function VoiceMicButton({ onVoiceProcessSuccess, onError }) {
  const [language, setLanguage] = useState('te'); // 'te' for Telugu, 'en' for English
  const [status, setStatus] = useState('idle'); // 'idle' | 'recording' | 'processing' | 'error'
  const [timer, setTimer] = useState(0);
  const [transcription, setTranscription] = useState('');
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerIntervalRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    // Setup Browser SpeechRecognition fallback if supported
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = language === 'te' ? 'te-IN' : 'en-IN';
      
      rec.onresult = (event) => {
        let currentText = '';
        for (let i = 0; i < event.results.length; i++) {
          currentText += event.results[i][0].transcript + ' ';
        }
        setTranscription(currentText.strip ? currentText.strip() : currentText);
      };

      rec.onerror = (e) => {
        console.warn("Browser speech error:", e);
      };

      recognitionRef.current = rec;
    }
  }, [language]);

  const startRecording = async () => {
    try {
      setStatus('recording');
      setTimer(0);
      setTranscription('');
      audioChunksRef.current = [];

      // Start timer
      timerIntervalRef.current = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);

      // 1. Browser Speech Recognition start
      if (recognitionRef.current) {
        try {
          recognitionRef.current.lang = language === 'te' ? 'te-IN' : 'en-IN';
          recognitionRef.current.start();
        } catch (err) {
          console.warn("Speech recognition already running or error:", err);
        }
      }

      // 2. MediaRecorder audio stream start
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start(250);
    } catch (err) {
      console.error("Microphone access error:", err);
      setStatus('error');
      if (onError) {
        onError("Microphone permission denied or audio device not available.");
      }
    }
  };

  const stopRecording = async () => {
    if (status !== 'recording') return;
    setStatus('processing');

    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        console.warn("Speech stop warning:", err);
      }
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }

    setTimeout(async () => {
      try {
        let textResult = transcription ? transcription.trim() : '';

        // If browser speech recognition did not capture text, call backend /api/voice/transcribe with 5s timeout
        if (!textResult && audioChunksRef.current.length > 0) {
          try {
            const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
            const formData = new FormData();
            formData.append('file', audioBlob, 'recording.webm');
            formData.append('language', language);

            const res = await api.post('/voice/transcribe', formData, {
              headers: { 'Content-Type': 'multipart/form-data' },
              timeout: 5000
            });

            if (res.data.success && res.data.transcription) {
              textResult = res.data.transcription.trim();
            }
          } catch (apiErr) {
            console.warn("Backend voice endpoint error/timeout:", apiErr);
          }
        }

        console.log("[ASR] transcription:", textResult);

        if (!textResult) {
          if (onError) {
            onError("Could not recognize the voice clearly. Please try again.");
          }
          return;
        }

        setTranscription(textResult);

        // Process extracted NLP items
        const nlpRes = await api.post('/nlp/extract', { text: textResult, language });
        const extractedItems = nlpRes.data.items || [];
        console.log("[NLP] extracted items:", extractedItems);

        // Validate items with RapidFuzz against SQLite database
        const valRes = await api.post('/products/validate', 
          extractedItems.map(item => ({
            raw_product: item.raw_product,
            quantity: item.quantity,
            unit: item.unit
          }))
        );
        console.log("[MATCH] matched products:", valRes.data.items);
        console.log("[API] final response:", valRes.data);

        if (onVoiceProcessSuccess) {
          onVoiceProcessSuccess({
            text: textResult,
            language,
            extractedItems: nlpRes.data.items,
            validatedItems: valRes.data.items
          });
        }
      } catch (procErr) {
        console.error("Voice processing pipeline error:", procErr);
        if (onError) {
          onError("Could not process voice input. Please try again.");
        }
      } finally {
        setStatus('idle');
      }
    }, 300);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-6 text-white shadow-xl border border-slate-700/50">
      {/* Language Selector */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Sparkles className="text-amber-400" size={20} />
          <span className="text-sm font-bold tracking-wide uppercase text-slate-300">Voice Billing Engine</span>
        </div>
        <div className="flex items-center bg-slate-800/90 rounded-full p-1 border border-slate-700">
          <button
            onClick={() => setLanguage('te')}
            className={`px-4 py-1.5 rounded-full text-xs font-extrabold transition-all duration-200 ${
              language === 'te'
                ? 'bg-emerald-500 text-white shadow-md shadow-emerald-900/50'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            తెలుగు (Telugu)
          </button>
          <button
            onClick={() => setLanguage('en')}
            className={`px-4 py-1.5 rounded-full text-xs font-extrabold transition-all duration-200 ${
              language === 'en'
                ? 'bg-emerald-500 text-white shadow-md shadow-emerald-900/50'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            English
          </button>
        </div>
      </div>

      {/* Main Mic Display */}
      <div className="flex flex-col items-center justify-center py-6 text-center">
        {status === 'idle' && (
          <>
            <button
              onClick={startRecording}
              className="w-24 h-24 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 flex items-center justify-center shadow-xl shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all duration-200 group mb-4"
            >
              <Mic size={42} className="group-hover:scale-110 transition-transform" />
            </button>
            <h3 className="text-lg font-bold text-slate-100">Tap microphone and speak your order</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">
              Example ({language === 'te' ? 'Telugu' : 'English'}):<br />
              <span className="text-emerald-400 font-mono italic">
                "{language === 'te' ? 'రెండు కిలోల బియ్యం, ఒక కిలో చక్కెర, మూడు పాల ప్యాకెట్లు' : 'Add 2 kg rice, 1 kg sugar and 3 milk packets'}"
              </span>
            </p>
          </>
        )}

        {status === 'recording' && (
          <>
            <div className="relative mb-4">
              <button
                onClick={stopRecording}
                className="w-24 h-24 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-2xl shadow-rose-500/50 animate-pulse-ring cursor-pointer"
              >
                <MicOff size={42} />
              </button>
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-rose-500/20 text-rose-300 rounded-full border border-rose-500/30 text-xs font-mono font-bold mb-2">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              Recording: {formatTime(timer)}
            </div>
            <p className="text-sm font-semibold text-slate-200">Speaking order... Tap again to finish</p>
          </>
        )}

        {status === 'processing' && (
          <div className="py-4">
            <Loader2 size={48} className="animate-spin text-emerald-400 mx-auto mb-3" />
            <h4 className="text-base font-bold text-slate-200">Processing Speech & Extracting Items...</h4>
            <p className="text-xs text-slate-400 mt-1">Applying Whisper ASR, bilingual NLP & RapidFuzz catalog search</p>
          </div>
        )}

        {status === 'error' && (
          <div className="py-2">
            <div className="w-16 h-16 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-3">
              <MicOff size={32} />
            </div>
            <h4 className="text-base font-bold text-rose-400">Microphone Error</h4>
            <button
              onClick={() => setStatus('idle')}
              className="mt-3 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-xl text-slate-200"
            >
              Try Again
            </button>
          </div>
        )}
      </div>

      {/* Live / Transcribed text preview */}
      {transcription && (
        <div className="mt-4 p-3.5 bg-slate-950/60 rounded-2xl border border-slate-800 text-left">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 mb-1">
            <Volume2 size={14} />
            <span>Recognized Text:</span>
          </div>
          <p className="text-sm text-slate-200 font-medium italic">"{transcription}"</p>
        </div>
      )}
    </div>
  );
}
