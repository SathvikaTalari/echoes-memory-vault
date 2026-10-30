import React, { useState } from 'react';
import { X, Cpu, HardDrive, ShieldCheck, RefreshCw, CheckCircle2, AlertTriangle, Terminal, Sparkles } from 'lucide-react';
import { useSystem } from '../context/SystemContext';

export const SystemStatusModal: React.FC = () => {
  const { status, loading, isModalOpen, setIsModalOpen, recheckOllama, switchModel } = useSystem();
  const [selectedModel, setSelectedModel] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  if (!isModalOpen) return null;

  const handleRefresh = async () => {
    setRefreshing(true);
    await recheckOllama();
    setRefreshing(false);
  };

  const handleModelChange = async (newModel: string) => {
    setSelectedModel(newModel);
    await switchModel(newModel);
  };

  const ollama = status?.ai_subsystems?.ollama;
  const whisper = status?.ai_subsystems?.whisper;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl parchment-card rounded-2xl border border-amber-600/40 shadow-2xl p-6 sm:p-8 space-y-6 my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-amber-900/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-700 flex items-center justify-center shadow-candle-sm">
              <Cpu className="w-5 h-5 text-amber-50" />
            </div>
            <div>
              <h3 className="font-playfair text-xl font-bold text-amber-100">
                Local AI Engine & Offline Privacy
              </h3>
              <p className="text-xs text-amber-300/70">
                Echoes – Hacktoberfest 2026 "Ghost in the Machine"
              </p>
            </div>
          </div>
          <button onClick={() => setIsModalOpen(false)} className="p-1.5 text-stone-400 hover:text-white rounded-lg transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 100% Privacy Banner */}
        <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-600/30 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-bold text-emerald-300 uppercase tracking-wide">
              100% On-Device & Private Architecture
            </h4>
            <p className="text-xs text-emerald-200/80 leading-relaxed mt-0.5">
              Personal audio memories, photographs, and stories never leave your computer. Both Whisper speech-to-text and the Qwen2.5-3B-Instruct story model execute entirely on your local machine.
            </p>
          </div>
        </div>

        {/* Ollama Status Section */}
        <div className="bg-obsidian-900/80 rounded-xl p-5 border border-amber-900/40 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${ollama?.available ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'bg-amber-400 animate-pulse'}`} />
              <h4 className="font-semibold text-sm text-amber-100">
                Ollama LLM Engine: Qwen2.5-3B-Instruct
              </h4>
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 text-xs border border-amber-500/30 transition"
            >
              <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Re-check</span>
            </button>
          </div>

          <div className="text-xs text-stone-300 leading-relaxed">
            {ollama?.available ? (
              <p className="text-emerald-300">
                Connected to local Ollama on <code className="bg-stone-900 px-1.5 py-0.5 rounded text-stone-200">{ollama.url}</code>. Target model: <code className="bg-stone-900 px-1.5 py-0.5 rounded text-amber-300 font-bold">{ollama.target_model}</code>.
              </p>
            ) : (
              <div className="space-y-2">
                <p className="text-amber-300/90">
                  Ollama daemon is currently offline at <code className="bg-stone-900 px-1.5 py-0.5 rounded">{ollama?.url || 'http://localhost:11434'}</code>.
                  Echoes is active in <strong>Smart Simulation Fallback Mode</strong> so you can test all features without interruption.
                </p>
                <div className="p-3 bg-black/60 rounded-lg border border-stone-800 font-mono text-[11px] text-amber-200/90 space-y-1">
                  <div className="flex items-center gap-1.5 text-stone-400 mb-1">
                    <Terminal className="w-3.5 h-3.5 text-amber-400" />
                    <span>To launch local Qwen2.5 inference in your terminal:</span>
                  </div>
                  <div className="text-amber-400 select-all">ollama pull qwen2.5:3b-instruct</div>
                  <div className="text-amber-400 select-all">ollama run qwen2.5:3b-instruct</div>
                </div>
              </div>
            )}
          </div>

          {/* Model Switcher if multiple models installed */}
          {ollama?.installed_models && ollama.installed_models.length > 0 && (
            <div className="pt-2">
              <label className="block text-[11px] text-stone-400 mb-1">Select Installed Local Model:</label>
              <select
                value={selectedModel || ollama.target_model}
                onChange={(e) => handleModelChange(e.target.value)}
                className="w-full bg-stone-900 border border-stone-700 rounded-lg px-3 py-1.5 text-xs text-amber-100 focus:outline-none"
              >
                {ollama.installed_models.map((m, idx) => (
                  <option key={idx} value={m}>{m}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Whisper STT Section */}
        <div className="bg-obsidian-900/80 rounded-xl p-5 border border-amber-900/40 space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
            <h4 className="font-semibold text-sm text-amber-100">
              Whisper Speech-to-Text Transcription Engine
            </h4>
          </div>
          <p className="text-xs text-stone-300 leading-relaxed">
            Local OpenAI-Whisper model <code className="bg-stone-900 px-1.5 py-0.5 rounded text-amber-300 font-bold">{whisper?.model || 'base'}</code> is installed in the local Python runtime. Automatically generates timestamped spoken words and transcript segments from microphone recordings and audio file uploads.
          </p>
        </div>

        {/* Local Storage Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 bg-obsidian-900/60 rounded-xl border border-amber-900/30 text-center">
            <span className="text-xl font-bold font-mono text-amber-400">{status?.stats?.audio_recordings ?? 0}</span>
            <div className="text-[11px] text-stone-400 mt-0.5">Voice Memories</div>
          </div>
          <div className="p-3 bg-obsidian-900/60 rounded-xl border border-amber-900/30 text-center">
            <span className="text-xl font-bold font-mono text-amber-400">{status?.stats?.stories ?? 0}</span>
            <div className="text-[11px] text-stone-400 mt-0.5">Woven Stories</div>
          </div>
          <div className="p-3 bg-obsidian-900/60 rounded-xl border border-amber-900/30 text-center">
            <span className="text-xl font-bold font-mono text-amber-400">{status?.stats?.vault_items ?? 0}</span>
            <div className="text-[11px] text-stone-400 mt-0.5">Vault Artifacts</div>
          </div>
          <div className="p-3 bg-obsidian-900/60 rounded-xl border border-amber-900/30 text-center">
            <span className="text-xl font-bold font-mono text-amber-400">{status?.stats?.lit_candles ?? 0}</span>
            <div className="text-[11px] text-stone-400 mt-0.5">Lit Candles</div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={() => setIsModalOpen(false)}
            className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shadow-sm transition"
          >
            Close Diagnostics
          </button>
        </div>
      </div>
    </div>
  );
};
