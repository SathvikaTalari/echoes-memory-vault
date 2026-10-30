import React, { useState } from 'react';
import { X, Flame, Sparkles } from 'lucide-react';
import { api } from '../services/api';
import { CandleFlame } from './CandleFlame';
import { OfrendaCandle } from '../types';

interface LightCandleModalProps {
  isOpen: boolean;
  onClose: () => void;
  lovedOneId: number;
  lovedOneName: string;
  onCandleLit?: (candle: OfrendaCandle) => void;
}

export const LightCandleModal: React.FC<LightCandleModalProps> = ({
  isOpen,
  onClose,
  lovedOneId,
  lovedOneName,
  onCandleLit
}) => {
  const [litBy, setLitBy] = useState('');
  const [message, setMessage] = useState('');
  const [candleType, setCandleType] = useState<'cempasuchil_gold' | 'classic_amber' | 'eternal_white' | 'violet_prayer'>('cempasuchil_gold');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const candleTypes = [
    {
      id: 'cempasuchil_gold',
      name: 'Cempasúchil Gold',
      desc: 'Traditional marigold flame to guide spirits home',
      color: 'border-amber-500 bg-amber-950/40 text-amber-200'
    },
    {
      id: 'classic_amber',
      name: 'Classic Beeswax',
      desc: 'Warm, golden hearth light of home and comfort',
      color: 'border-yellow-600 bg-yellow-950/40 text-yellow-200'
    },
    {
      id: 'eternal_white',
      name: 'Eternal White',
      desc: 'Purity, timeless peace, and sacred remembrance',
      color: 'border-stone-400 bg-stone-900/60 text-stone-100'
    },
    {
      id: 'violet_prayer',
      name: 'Violet Prayer',
      desc: 'Spiritual reverence and healing for deep grief',
      color: 'border-purple-500 bg-purple-950/40 text-purple-200'
    }
  ];

  const handleLight = async () => {
    if (!litBy.trim()) {
      setError("Please provide your name or family relationship.");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const res = await api.lightCandle(lovedOneId, {
        lit_by: litBy.trim(),
        message: message.trim() || undefined,
        candle_type: candleType
      });

      if (onCandleLit) onCandleLit(res.candle);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to light memorial candle.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-lg parchment-card rounded-2xl border border-amber-600/40 shadow-2xl p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-amber-900/40">
          <div className="flex items-center gap-2.5">
            <Flame className="w-5 h-5 text-amber-400 fill-amber-400 animate-pulse" />
            <h3 className="font-playfair text-xl font-bold text-amber-100">Light an Altar Candle</h3>
          </div>
          <button onClick={onClose} className="p-1.5 text-stone-400 hover:text-white rounded-lg transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-red-950/70 border border-red-700/50 text-red-200 text-xs">
            {error}
          </div>
        )}

        {/* Live Flame Preview */}
        <div className="flex flex-col items-center justify-center py-4 bg-obsidian-900/70 rounded-xl border border-amber-900/40">
          <CandleFlame isLit={true} size="lg" colorType={candleType} />
          <p className="text-xs text-amber-400/80 font-serif italic mt-3 text-center px-4">
            "A flame to guide, to remember, and to keep their presence near."
          </p>
        </div>

        {/* Candle Flame Color Selection */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-amber-400/80 mb-2">
            Select Flame Essence
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            {candleTypes.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCandleType(c.id as any)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  candleType === c.id
                    ? `${c.color} ring-1 ring-amber-400 shadow-candle-sm font-medium`
                    : 'border-amber-900/30 bg-obsidian-900/40 text-stone-400 hover:bg-obsidian-900/70'
                }`}
              >
                <div className="text-xs font-semibold text-amber-100">{c.name}</div>
                <div className="text-[10px] text-stone-400 line-clamp-1 mt-0.5">{c.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Form Inputs */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-amber-300/80 mb-1">Lit In Love By *</label>
            <input
              type="text"
              value={litBy}
              onChange={(e) => setLitBy(e.target.value)}
              placeholder="e.g. Granddaughter Sofia, Carlos & Maria, A Dear Friend"
              className="w-full bg-obsidian-900 border border-amber-900/60 rounded-xl px-4 py-2 text-sm text-amber-100 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs text-amber-300/80 mb-1">Whisper of Remembrance / Prayer (Optional)</label>
            <textarea
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="e.g. Thinking of your laughter today Abuela. We still sing your boleros under the evening sky..."
              className="w-full bg-obsidian-900 border border-amber-900/60 rounded-xl p-3 text-sm text-amber-100 focus:outline-none focus:border-amber-500 resize-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-stone-700 text-stone-300 hover:text-white text-xs transition"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={handleLight}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-medium text-xs shadow-candle-sm transition disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{loading ? "Lighting Flame..." : "Light Candle"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
