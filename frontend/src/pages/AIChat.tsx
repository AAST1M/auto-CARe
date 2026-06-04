import React, { useRef, useEffect } from 'react';
import { ArrowLeft, Camera, Mic, StopCircle, Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { API_URL } from '../config';

export const AIChat = () => {
  const navigate = useNavigate();
  const { messages, setMessages, isTyping, setIsTyping } = useAppContext();
  const [input, setInput] = React.useState('');
  const [isRecording, setIsRecording] = React.useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSendMessage = async (attachment?: { mimeType: string; data: string }) => {
    if (!input.trim() && !attachment) return;

    const userMsg = { id: Date.now().toString(), role: 'user' as const, text: input || (attachment?.mimeType.includes('audio') ? '🎤 Audio Recording' : '📷 Image Attachment') };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const payload = attachment ? { symptom: input, media: attachment } : { symptom: input };
      const response = await fetch(`${API_URL}/api/gemini/diagnose`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      const aiMsg = { id: (Date.now() + 1).toString(), role: 'model' as const, text: data.reply || 'Sorry, I could not process that.' };
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
          const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = () => {
            const base64 = (reader.result as string).split(',')[1];
            handleSendMessage({ mimeType: 'audio/webm', data: base64 });
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
      <div className="p-4 pt-12 glass-panel shadow-lg z-10 flex items-center gap-4">
        <button aria-label="Back" onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-white/10 text-slate-900 dark:text-white"><ArrowLeft /></button>
        <div>
          <h2 className="text-xl font-bold font-display text-slate-900 dark:text-white flex items-center gap-2">
            Auto-Care AI
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          </h2>
          <p className="text-xs text-green-500">Online • Diagnostics Mode</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-4 rounded-2xl ${msg.role === 'user'
                ? 'bg-cyber-primary text-white rounded-br-none'
                : 'glass-panel text-slate-800 dark:text-gray-200 rounded-bl-none border border-cyber-primary/30'
              }`}>
              {msg.text}
            </div>
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
          aria-label={isRecording ? "Stop Recording" : "Record Audio"}
          onMouseDown={toggleRecording}
          onMouseUp={toggleRecording}
          onTouchStart={toggleRecording}
          onTouchEnd={toggleRecording}
          className={`p-3 rounded-full transition-all ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'text-cyber-primary hover:bg-cyber-primary/10'}`}
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
