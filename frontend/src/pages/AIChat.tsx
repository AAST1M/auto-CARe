import React, { useRef, useEffect } from 'react';
import { ArrowLeft, Camera, Mic, StopCircle, Send, Globe } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { API_URL } from '../config';
import { View } from '../types';

export const AIChat = () => {
  const navigate = useNavigate();
  const { messages, setMessages, isTyping, setIsTyping } = useAppContext();
  const [input, setInput] = React.useState('');
  const [isRecording, setIsRecording] = React.useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const [hasMoreHistory, setHasMoreHistory] = React.useState(true);
  const [loadingHistory, setLoadingHistory] = React.useState(false);
  const oldestMessageIdRef = useRef<string | null>(null);
  const [language, setLanguage] = React.useState('English');
  const [showLangMenu, setShowLangMenu] = React.useState(false);

  // Fetch initial history
  useEffect(() => {
    if (messages.length === 1 && messages[0].id === '0') {
      loadHistory();
    }
  }, []);

  const loadHistory = async (cursor?: string) => {
    if (loadingHistory) return;
    setLoadingHistory(true);
    try {
      let url = `${API_URL}/api/chat?take=10`;
      if (cursor) url += `&cursor=${cursor}`;
      
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        const history = await res.json();
        if (history.length > 0) {
          // history comes back in chronological order (oldest first in the slice)
          // The oldest in the DB for this slice is history[0]
          oldestMessageIdRef.current = history[0].id;
          
          if (history.length < 10) setHasMoreHistory(false);

          setMessages(prev => {
            // Remove the default welcome message if it's there and we're loading initial history
            const cleanPrev = cursor ? prev : prev.filter(m => m.id !== '0');
            return [...history, ...cleanPrev];
          });
        } else {
          setHasMoreHistory(false);
        }
      }
    } catch (err) {
      console.error('Failed to load history', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    // Only auto-scroll to bottom if we are NOT loading older messages
    if (!loadingHistory) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping, loadingHistory]);

  const handleSendMessage = async (attachment?: { mimeType: string; data: string }) => {
    if (!input.trim() && !attachment) return;

    const userMsg = { id: Date.now().toString(), role: 'user' as const, text: input || (attachment?.mimeType.includes('audio') ? '🎤 Audio Recording' : '📷 Image Attachment') };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const langCode = language === 'Arabic' ? 'ar' : 'en';
      const payload = attachment 
        ? { symptom: input, media: attachment, language: langCode } 
        : { symptom: input, language: langCode };
      const response = await fetch(`${API_URL}/api/gemini/diagnose`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      const aiMsg = { id: (Date.now() + 1).toString(), role: 'model' as const, text: data.reply || 'Sorry, I could not process that.', action: data.action };
      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      console.error("Diagnostic error:", error);
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: "Network error connecting to diagnostic server." }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1];
        handleSendMessage({ mimeType: file.type, data: base64String });
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleRecording = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;

        const audioChunks: BlobPart[] = [];
        mediaRecorder.ondataavailable = (e) => audioChunks.push(e.data);

        mediaRecorder.onstop = async () => {
          const actualMimeType = mediaRecorder.mimeType || 'audio/webm';
          const audioBlob = new Blob(audioChunks, { type: actualMimeType });
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = () => {
            const base64 = (reader.result as string).split(',')[1];
            handleSendMessage({ mimeType: actualMimeType, data: base64 });
          };
          stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorder.start();
        setIsRecording(true);
      } catch (err) {
        alert("Could not access microphone.");
      }
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-100 dark:bg-black">
      <div className="p-4 pt-12 glass-panel shadow-lg z-10 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button aria-label="Back" onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-white/10 text-slate-900 dark:text-white"><ArrowLeft /></button>
          <div>
            <h2 className="text-xl font-bold font-display text-slate-900 dark:text-white flex items-center gap-2">
              Auto-Care AI
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            </h2>
            <p className="text-xs text-green-500">Online • Diagnostics Mode</p>
          </div>
        </div>
        <div className="flex bg-slate-200 dark:bg-slate-800 rounded-lg p-1 shadow-inner">
          <button onClick={() => setLanguage('Arabic')} className={`px-3 py-1 text-sm rounded-md transition-all ${language === 'Arabic' ? 'bg-cyber-primary text-white shadow-md' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700'}`}>عربي</button>
          <button onClick={() => setLanguage('English')} className={`px-3 py-1 text-sm rounded-md transition-all ${language === 'English' ? 'bg-cyber-primary text-white shadow-md' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700'}`}>EN</button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {hasMoreHistory && messages.length > 0 && (
          <div className="flex justify-center my-4">
            <button
              onClick={() => loadHistory(oldestMessageIdRef.current || undefined)}
              disabled={loadingHistory}
              className="px-4 py-2 bg-cyber-primary/10 text-cyber-primary text-sm font-bold rounded-full hover:bg-cyber-primary/20 transition-colors"
            >
              {loadingHistory ? 'Loading...' : 'Load Previous Messages'}
            </button>
          </div>
        )}
        
        {messages.map(msg => (
          <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] p-4 rounded-2xl ${msg.role === 'user'
                  ? 'bg-cyber-primary text-white rounded-br-none'
                  : 'glass-panel text-slate-800 dark:text-gray-200 rounded-bl-none border border-cyber-primary/30'
                }`}>
                {msg.text}
              </div>
            </div>
            {msg.action === 'WINCH' && (
              <button 
                className="mt-2 bg-red-500 text-white px-4 py-2 rounded-lg font-bold hover:bg-red-600 transition-colors shadow-lg animate-pulse"
                onClick={() => navigate(`/${View.WINCH_LIVE_MAP.toLowerCase()}`)}
              >
                Request Emergency Winch
              </button>
            )}
            {msg.action === 'WORKSHOP' && (
              <button 
                className="mt-2 bg-cyber-primary text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-600 transition-colors shadow-lg"
                onClick={() => navigate(`/${View.WORKSHOP_LIST.toLowerCase()}`)}
              >
                Find Nearby Workshops
              </button>
            )}
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="glass-panel p-4 rounded-2xl rounded-bl-none flex gap-2 items-center">
              <div className="w-2 h-2 bg-cyber-primary rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-cyber-primary rounded-full animate-bounce delay-100"></div>
              <div className="w-2 h-2 bg-cyber-primary rounded-full animate-bounce delay-200"></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 glass-panel m-4 rounded-2xl flex items-center gap-2">
        <input aria-label="Upload Image File" title="Upload Image File" type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
        <button aria-label="Upload Image" onClick={() => fileInputRef.current?.click()} className="p-3 text-cyber-primary hover:bg-cyber-primary/10 rounded-full transition-colors">
          <Camera size={20} />
        </button>
        <button
          onClick={toggleRecording}
          className={`p-3 rounded-full transition-colors ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'text-cyber-primary hover:bg-cyber-primary/10'}`}
        >
          {isRecording ? <StopCircle size={20} /> : <Mic size={20} />}
        </button>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder={isRecording ? "Recording audio..." : "Describe the issue..."}
          className="flex-1 bg-transparent outline-none text-slate-900 dark:text-white placeholder-gray-500"
        />
        <button aria-label="Send Message" onClick={() => handleSendMessage()} className="p-3 bg-cyber-primary text-white rounded-xl shadow-[0_0_15px_rgba(59,130,246,0.5)] hover:scale-105 transition-transform">
          <Send size={20} />
        </button>
      </div>
    </div>
  );
};
