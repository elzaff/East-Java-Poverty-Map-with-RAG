import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Loader2 } from 'lucide-react';
import { ChatMessage } from '../types';
import { ragChat } from '../api';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface RagAnalystProps {
  contextGid: string | null;
  contextYear: number;
}

export function RagAnalyst({ contextGid, contextYear }: RagAnalystProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init',
      role: 'analyst',
      content: 'Sistem RAG siap. Saya dapat menganalisis narasi lokal, dokumen RPJMD, ringkasan berita NLP, dan penjelasan fitur SHAP untuk memberikan konteks pada estimasi kemiskinan.'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (text: string) => {
    if (!text.trim()) return;
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const responseText = await ragChat(text, contextGid);
      const analystMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'analyst',
        content: responseText,
        drivers: ['NTL Drop', 'News: Ketenagakerjaan', 'RPJMD Policy'],
        caveat: 'This RAG analysis provides grounded contextual narrative derived from NLP embeddings, but is not a causal proof.'
      };
      setMessages(prev => [...prev, analystMsg]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#111114] border-t border-white/5 md:border-t-0 md:border-l overflow-hidden">
      <div className="p-4 border-b border-white/5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-blue-600 rounded flex items-center justify-center text-[10px] font-bold text-white">AI</div>
          <span className="text-[11px] font-bold uppercase tracking-wide text-white/90">Analyst Chat</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
        {messages.map(msg => (
          <div key={msg.id} className={twMerge("flex gap-3", msg.role === 'user' ? "flex-row-reverse" : "flex-row")}>
            {msg.role === 'analyst' && (
              <div className="w-6 h-6 rounded shrink-0 flex items-center justify-center bg-blue-600 text-[10px] font-bold text-white">
                AI
              </div>
            )}
            
            <div className={twMerge("flex flex-col gap-2 max-w-[85%]", msg.role === 'user' ? "items-end" : "items-start")}>
              <div className={twMerge(
                "p-3 rounded-lg text-[11px] leading-relaxed",
                msg.role === 'user' ? "bg-white/10 text-white" : "bg-white/5 border border-white/10 text-white/70"
              )}>
                {msg.content}
              </div>
              
              {msg.drivers && (
                <div className="flex flex-wrap gap-2 mt-1">
                  {msg.drivers.map(d => (
                    <span key={d} className="px-2 py-0.5 bg-black/40 border border-white/10 rounded text-[9px] text-white/40 uppercase">{d}</span>
                  ))}
                </div>
              )}
              
              {msg.caveat && (
                <div className="mt-1 text-[9px] text-white/30 italic">
                  Disclaimer: {msg.caveat}
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-3">
            <div className="w-6 h-6 rounded shrink-0 flex items-center justify-center bg-blue-600 text-[10px] font-bold text-white">
              AI
            </div>
            <div className="bg-white/5 border border-white/10 p-3 rounded-lg flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" />
              <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce [animation-delay:0.2s]" />
              <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce [animation-delay:0.4s]" />
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="p-4 border-t border-white/10 shrink-0">
        <div className="flex flex-wrap gap-2 mb-3">
          {["Bandingkan Gresik dan Bangkalan", "Fitur XAI teratas 2024?", "Isu Ketenagakerjaan dominan?"].map((s) => (
             <button 
               key={s} 
               onClick={() => handleSend(s)}
               className="text-[9px] text-white/50 bg-white/5 hover:bg-white/10 px-2 py-1.5 rounded transition-colors"
             >
               {s}
             </button>
          ))}
        </div>
        <div className="relative">
          <input 
            type="text" 
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend(input)}
            placeholder="Ask RAG Analyst..." 
            className="w-full bg-black/40 border border-white/10 rounded-full pl-4 pr-10 py-2.5 text-xs text-white placeholder-white/20 focus:outline-none focus:border-red-500/50 transition-colors"
          />
          <button 
            onClick={() => handleSend(input)}
            disabled={!input.trim() || loading}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-white/30 hover:text-white/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
