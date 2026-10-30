import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageCircleQuestion, Send, Sparkles, BookOpen, Clock, 
  ShieldCheck, AlertCircle, RefreshCw, BookmarkCheck, ArrowRight 
} from 'lucide-react';
import { useProfile } from '../context/ProfileContext';
import { api } from '../services/api';
import { QALog } from '../types';

interface MessageItem {
  id: string | number;
  type: 'user' | 'ai';
  text: string;
  sources?: any[];
  modelUsed?: string;
  isSimulation?: boolean;
  timestamp: string;
}

export const AskMemoriesPage: React.FC = () => {
  const { activeProfile } = useProfile();
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [inputQuestion, setInputQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([
    "What happened during the rainstorm dance in the plaza in Oaxaca?",
    "What did they say about the secret to cooking traditional mole?",
    "What advice did they share regarding holding onto anger or sorrow?",
    "What were their absolute favorite foods, songs, and evening habits?"
  ]);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadHistory = async () => {
    if (!activeProfile) return;
    try {
      const res = await api.getQAHistory(activeProfile.id);
      if (res.suggested_questions && res.suggested_questions.length > 0) {
        setSuggestedQuestions(res.suggested_questions);
      }
      
      const converted: MessageItem[] = [];
      res.history.reverse().forEach((log) => {
        converted.push({
          id: `q_${log.id}`,
          type: 'user',
          text: log.question,
          timestamp: log.created_at
        });
        converted.push({
          id: `a_${log.id}`,
          type: 'ai',
          text: log.answer,
          sources: log.cited_sources,
          timestamp: log.created_at
        });
      });

      if (converted.length === 0) {
        converted.push({
          id: 'welcome',
          type: 'ai',
          text: `Welcome to the memory archive of ${activeProfile.name}. I am your archival keeper, ready to answer questions strictly grounded in their preserved voice recordings, written stories, and life milestones. Feel free to ask a question below.`,
          timestamp: 'Now'
        });
      }

      setMessages(converted);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [activeProfile]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (questionText?: string) => {
    const q = (questionText || inputQuestion).trim();
    if (!q || !activeProfile || loading) return;

    setInputQuestion('');
    const userMsg: MessageItem = {
      id: Date.now(),
      type: 'user',
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await api.askMemories(activeProfile.id, q);
      const aiMsg: MessageItem = {
        id: Date.now() + 1,
        type: 'ai',
        text: res.answer,
        sources: res.cited_sources,
        modelUsed: res.model_used,
        isSimulation: res.is_simulation,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err: any) {
      const errorMsg: MessageItem = {
        id: Date.now() + 1,
        type: 'ai',
        text: `Error retrieving memory: ${err.message || 'Could not query archives.'}`,
        timestamp: 'Now'
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  if (!activeProfile) {
    return (
      <div className="parchment-card rounded-2xl p-12 text-center border border-amber-900/40">
        <MessageCircleQuestion className="w-12 h-12 text-amber-500/60 mx-auto mb-3" />
        <h3 className="font-playfair text-xl font-bold text-amber-100">No Loved One Selected</h3>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16 max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-950/60 border border-amber-600/30 text-amber-300 text-xs font-medium">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Factual Memory Retrieval • Qwen2.5-3B-Instruct</span>
        </div>
        <h2 className="font-playfair text-3xl sm:text-4xl font-bold text-amber-100">
          Ask Your Memories
        </h2>
        <p className="text-sm text-stone-300 max-w-xl mx-auto font-serif">
          Search the recollections of {activeProfile.name}. Answers are drawn exclusively from authentic audio transcripts, stories, and vault records.
        </p>
      </div>

      {/* Strict Factual Recall Notice */}
      <div className="p-3.5 rounded-xl bg-obsidian-900/80 border border-amber-800/40 flex items-center justify-between gap-3 text-xs text-amber-200/90">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>
            <strong>Zero-Hallucination Policy:</strong> The model never fabricates memories or roleplays as the departed. If an event wasn't recorded, it will state so truthfully.
          </span>
        </div>
      </div>

      {/* Suggested Prompt Chips */}
      <div className="space-y-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400/80 block">
          Suggested Inquiries:
        </span>
        <div className="flex flex-wrap gap-2">
          {suggestedQuestions.map((sq, idx) => (
            <button
              key={idx}
              type="button"
              disabled={loading}
              onClick={() => handleSend(sq)}
              className="text-xs px-3.5 py-1.5 rounded-full bg-obsidian-900 hover:bg-amber-950/60 text-amber-200/90 hover:text-amber-100 border border-amber-900/40 hover:border-amber-500/50 transition flex items-center gap-1 text-left"
            >
              <span>{sq}</span>
              <ArrowRight className="w-3 h-3 text-amber-400/70" />
            </button>
          ))}
        </div>
      </div>

      {/* Conversation Container */}
      <div className="parchment-card rounded-2xl border border-amber-600/30 shadow-ofrenda flex flex-col h-[520px] overflow-hidden">
        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {messages.map((msg) => {
            const isUser = msg.type === 'user';
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1.5`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl p-4 sm:p-5 text-sm leading-relaxed ${
                    isUser
                      ? 'bg-gradient-to-r from-amber-600 to-orange-700 text-white font-medium shadow-candle-sm rounded-br-none'
                      : 'bg-obsidian-900/90 border border-amber-900/50 text-amber-100 font-serif rounded-bl-none shadow-md'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>

                  {/* Cited Memory Sources */}
                  {!isUser && msg.sources && msg.sources.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-amber-900/30 space-y-1.5">
                      <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-amber-400 block flex items-center gap-1">
                        <BookmarkCheck className="w-3.5 h-3.5 text-amber-400" />
                        Verified Memory Sources Cited:
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {msg.sources.map((src, sIdx) => (
                          <span
                            key={sIdx}
                            className="text-[11px] font-sans px-2.5 py-1 rounded-lg bg-obsidian-950/70 border border-amber-800/40 text-amber-300"
                          >
                            "{src.title}" {src.date ? `(${src.date})` : ''}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {!isUser && msg.modelUsed && (
                    <div className="mt-2 text-[10px] font-sans text-stone-500 font-mono">
                      Engine: {msg.modelUsed}
                    </div>
                  )}
                </div>

                <span className="text-[10px] text-stone-500 font-mono px-1">
                  {msg.timestamp}
                </span>
              </div>
            );
          })}

          {loading && (
            <div className="flex items-start space-y-1">
              <div className="rounded-2xl rounded-bl-none p-4 bg-obsidian-900/90 border border-amber-900/50 text-stone-300 text-sm flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin" />
                <span className="font-serif italic text-amber-200/90">
                  Searching {activeProfile.name}'s memory records...
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-4 bg-obsidian-900/90 border-t border-amber-900/40 flex items-center gap-3">
          <input
            type="text"
            value={inputQuestion}
            onChange={(e) => setInputQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSend();
            }}
            placeholder={`Ask a question about ${activeProfile.name}'s memories...`}
            className="flex-1 bg-obsidian-950 border border-amber-900/60 rounded-xl px-4 py-3 text-sm text-amber-100 placeholder:text-stone-500 focus:outline-none focus:border-amber-500"
          />
          <button
            type="button"
            disabled={loading || !inputQuestion.trim()}
            onClick={() => handleSend()}
            className="px-5 py-3 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-medium text-sm shadow-candle-sm transition disabled:opacity-50 flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Ask</span>
          </button>
        </div>
      </div>
    </div>
  );
};
