import React, { useState, useEffect, useRef } from 'react';
import { 
  Flame, Gift, Sparkles, Heart, Plus, Volume2, VolumeX, 
  Trash2, RefreshCw, Calendar, Flower2, Coffee, Utensils, Music, Smile
} from 'lucide-react';
import { useProfile } from '../context/ProfileContext';
import { api } from '../services/api';
import { OfrendaOffering, OfrendaCandle } from '../types';
import { CandleFlame } from '../components/CandleFlame';

interface OfrendaPageProps {
  onOpenLightCandle: () => void;
  onOpenAddOffering: () => void;
}

export const OfrendaPage: React.FC<OfrendaPageProps> = ({
  onOpenLightCandle,
  onOpenAddOffering
}) => {
  const { activeProfile } = useProfile();
  const [offeringsByTier, setOfferingsByTier] = useState<{ 1: OfrendaOffering[]; 2: OfrendaOffering[]; 3: OfrendaOffering[] }>({ 1: [], 2: [], 3: [] });
  const [candles, setCandles] = useState<OfrendaCandle[]>([]);
  const [activeCandlesCount, setActiveCandlesCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [ambientAudioActive, setAmbientAudioActive] = useState(false);
  const [selectedCandle, setSelectedCandle] = useState<OfrendaCandle | null>(null);

  // Web Audio synthesizer ref for offline ambient hearth & warm acoustic chord
  const audioContextRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const timerRef = useRef<number | null>(null);

  const loadOfrenda = async () => {
    if (!activeProfile) return;
    try {
      setLoading(true);
      const res = await api.getOfrenda(activeProfile.id);
      setOfferingsByTier(res.offerings_by_tier);
      setCandles(res.candles);
      setActiveCandlesCount(res.active_candles_count);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOfrenda();
  }, [activeProfile]);

  // Clean up ambient audio on unmount
  useEffect(() => {
    return () => {
      stopAmbientAudio();
    };
  }, []);

  const startAmbientAudio = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.08, ctx.currentTime);
      masterGain.connect(ctx.destination);

      // Procedural warm crackling hearth & gentle chord progression
      const playGentleChimes = () => {
        if (ctx.state === 'closed') return;
        const notes = [220, 277.18, 329.63, 440, 554.37]; // A major bolero chord
        const osc = ctx.createOscillator();
        const noteGain = ctx.createGain();
        const freq = notes[Math.floor(Math.random() * notes.length)];
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);

        noteGain.gain.setValueAtTime(0, ctx.currentTime);
        noteGain.gain.linearRampToValueAtTime(0.04, ctx.currentTime + 1.5);
        noteGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 6.0);

        osc.connect(noteGain);
        noteGain.connect(masterGain);

        osc.start();
        osc.stop(ctx.currentTime + 6.0);
      };

      playGentleChimes();
      const interval = window.setInterval(playGentleChimes, 3500);
      timerRef.current = interval;

      audioContextRef.current = ctx;
      gainNodeRef.current = masterGain;
      setAmbientAudioActive(true);
    } catch (e) {
      console.warn("Web Audio ambient error:", e);
    }
  };

  const stopAmbientAudio = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
    }
    audioContextRef.current = null;
    setAmbientAudioActive(false);
  };

  const toggleAmbientAudio = () => {
    if (ambientAudioActive) {
      stopAmbientAudio();
    } else {
      startAmbientAudio();
    }
  };

  const handleToggleCandle = async (candle: OfrendaCandle) => {
    try {
      const res = await api.toggleCandle(candle.id);
      setCandles(prev => prev.map(c => c.id === candle.id ? { ...c, is_lit: res.is_lit } : c));
      setActiveCandlesCount(prev => res.is_lit === 1 ? prev + 1 : prev - 1);
      if (selectedCandle?.id === candle.id) {
        setSelectedCandle(prev => prev ? { ...prev, is_lit: res.is_lit } : null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRemoveOffering = async (offeringId: number) => {
    if (!window.confirm("Remove this offering from the altar?")) return;
    try {
      await api.removeOffering(offeringId);
      await loadOfrenda();
    } catch (e) {
      console.error(e);
    }
  };

  const getOfferingIcon = (itemType: string) => {
    switch (itemType) {
      case 'marigold': return <Flower2 className="w-4 h-4 text-orange-400" />;
      case 'pan_de_muerto': return <Utensils className="w-4 h-4 text-amber-300" />;
      case 'beverage': return <Coffee className="w-4 h-4 text-amber-400" />;
      case 'food': return <Utensils className="w-4 h-4 text-amber-200" />;
      case 'music': return <Music className="w-4 h-4 text-yellow-300" />;
      case 'calavera': return <Smile className="w-4 h-4 text-rose-300" />;
      default: return <Sparkles className="w-4 h-4 text-amber-400" />;
    }
  };

  if (!activeProfile) {
    return (
      <div className="parchment-card rounded-2xl p-12 text-center border border-amber-900/40">
        <Flame className="w-12 h-12 text-amber-500/60 mx-auto mb-3" />
        <h3 className="font-playfair text-xl font-bold text-amber-100">No Loved One Selected</h3>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-16">
      {/* Altar Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-950/60 border border-amber-600/30 text-amber-300 text-xs font-medium mb-2">
            <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400 animate-pulse" />
            <span>Virtual Ofrenda • Día de los Muertos Sanctuary</span>
          </div>
          <h2 className="font-playfair text-3xl sm:text-4xl font-bold text-amber-100">
            Sacred Altar of {activeProfile.name}
          </h2>
          <p className="text-sm text-stone-300 mt-1 font-serif">
            A three-tiered sanctuary of remembrance, glowing candlelight, and cempasúchil marigolds.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Ambient Sound Toggle */}
          <button
            type="button"
            onClick={toggleAmbientAudio}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border text-xs font-medium transition ${
              ambientAudioActive
                ? 'bg-amber-950/80 border-amber-500 text-amber-200 shadow-candle-sm'
                : 'bg-obsidian-900 border-amber-900/40 text-stone-400 hover:text-amber-200'
            }`}
            title="Toggle offline soothing guitar & hearth sound"
          >
            {ambientAudioActive ? <Volume2 className="w-4 h-4 text-amber-400 animate-pulse" /> : <VolumeX className="w-4 h-4" />}
            <span>{ambientAudioActive ? 'Ambient Sanctuary Playing' : 'Ambient Music'}</span>
          </button>

          <button
            type="button"
            onClick={onOpenAddOffering}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-amber-900/60 bg-obsidian-900 hover:bg-obsidian-850 text-amber-200 text-xs font-medium transition"
          >
            <Gift className="w-4 h-4 text-amber-400" />
            <span>Place Offering</span>
          </button>

          <button
            type="button"
            onClick={onOpenLightCandle}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-medium text-xs sm:text-sm shadow-candle-sm hover:shadow-candle-md transition"
          >
            <Flame className="w-4 h-4 fill-white" />
            <span>Light a Candle</span>
          </button>
        </div>
      </div>

      {/* THREE-TIER VIRTUAL OFRENDA ALTAR */}
      <div className="relative rounded-3xl bg-gradient-to-b from-[#180907] via-[#100707] to-[#0a0505] border-2 border-amber-600/40 shadow-2xl p-6 sm:p-12 overflow-hidden">
        {/* Soft background ambient warmth */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-black via-black/40 to-transparent pointer-events-none" />

        <div className="relative z-10 space-y-12">
          
          {/* TIER 1: UPPER ALTAR (CIELO / SACRED MEMORY & PORTRAIT) */}
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="text-[11px] font-cinzel tracking-widest text-amber-400/80 uppercase px-3 py-1 rounded-full bg-amber-950/60 border border-amber-700/40">
              Tier I • Sacred Arch & Eternal Portrait
            </div>

            {/* Marigold Arch framing the portrait */}
            <div className="relative p-6 sm:p-8 rounded-full border-4 border-amber-500/30 bg-gradient-to-b from-amber-950/40 to-transparent shadow-candle-lg">
              {/* Marigold Petal Accents on the Arch */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex items-center gap-2">
                <span className="text-xl">🌼</span>
                <span className="text-2xl">🏵️</span>
                <span className="text-xl">🌼</span>
              </div>

              {/* Framed Portrait */}
              <div className="relative w-40 h-40 sm:w-48 sm:h-48 rounded-2xl bg-gradient-to-br from-amber-700 to-amber-950 border-4 border-amber-400/70 p-1.5 shadow-2xl overflow-hidden flex items-center justify-center">
                {activeProfile.avatar_url ? (
                  <img
                    src={activeProfile.avatar_url}
                    alt={activeProfile.name}
                    className="w-full h-full object-cover rounded-xl filter sepia-[0.15] contrast-105"
                  />
                ) : (
                  <div className="w-full h-full rounded-xl bg-obsidian-900 flex flex-col items-center justify-center text-amber-300">
                    <Heart className="w-12 h-12 text-amber-400/80 mb-1" />
                    <span className="font-playfair text-xs font-semibold">{activeProfile.name}</span>
                  </div>
                )}
                <div className="absolute inset-0 rounded-xl border border-amber-300/40 pointer-events-none" />
              </div>

              {/* Flanking Guardian Candles */}
              <div className="absolute -left-6 top-1/2 -translate-y-1/2 hidden sm:block">
                <CandleFlame isLit={true} size="md" colorType="cempasuchil_gold" />
              </div>
              <div className="absolute -right-6 top-1/2 -translate-y-1/2 hidden sm:block">
                <CandleFlame isLit={true} size="md" colorType="cempasuchil_gold" />
              </div>
            </div>

            {/* Name & Epitaph */}
            <div>
              <h3 className="font-cinzel text-2xl sm:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-100 via-amber-200 to-amber-400">
                {activeProfile.name}
              </h3>
              <p className="font-serif italic text-xs sm:text-sm text-amber-300/80 max-w-lg mx-auto mt-1">
                "{activeProfile.epitaph || 'Forever loved, forever present in our memories.'}"
              </p>
            </div>

            {/* Tier 1 Offerings (Marigolds & Incense) */}
            {offeringsByTier[1].length > 0 && (
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                {offeringsByTier[1].map((off) => (
                  <div 
                    key={off.id}
                    className="px-3 py-1.5 rounded-full bg-amber-950/60 border border-amber-500/40 text-amber-200 text-xs flex items-center gap-2 shadow-candle-sm"
                  >
                    {getOfferingIcon(off.item_type)}
                    <span className="font-medium">{off.title}</span>
                    <button
                      onClick={() => handleRemoveOffering(off.id)}
                      className="text-stone-500 hover:text-red-400 ml-1 transition"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* TIER 2: MIDDLE ALTAR (TIERRA / FEASTS, PAN DE MUERTO & HEIRLOOMS) */}
          <div className="pt-8 border-t border-amber-900/40 space-y-5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-cinzel tracking-widest text-amber-400/80 uppercase px-3 py-1 rounded-full bg-amber-950/60 border border-amber-700/40">
                Tier II • Earthly Delights, Heirlooms & Pan de Muerto
              </span>
              <button
                type="button"
                onClick={onOpenAddOffering}
                className="text-xs text-amber-400 hover:text-amber-200 font-medium transition flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Feast / Keepsake</span>
              </button>
            </div>

            {/* Offering Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {offeringsByTier[2].length === 0 ? (
                <div className="col-span-full p-6 text-center text-xs text-stone-500 italic bg-obsidian-950/40 rounded-xl border border-amber-900/20">
                  No offerings on the middle tier yet. Place their favorite dish or pan de muerto above!
                </div>
              ) : (
                offeringsByTier[2].map((off) => (
                  <div
                    key={off.id}
                    className="parchment-card rounded-2xl p-4 border border-amber-900/40 hover:border-amber-500/50 transition-all flex flex-col justify-between space-y-2 group relative"
                  >
                    <div className="flex items-start justify-between">
                      <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
                        {getOfferingIcon(off.item_type)}
                      </div>
                      <button
                        onClick={() => handleRemoveOffering(off.id)}
                        className="p-1 text-stone-600 hover:text-red-400 transition"
                        title="Remove offering"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>

                    <div>
                      <h4 className="font-playfair font-bold text-sm text-amber-100 group-hover:text-amber-300 transition">
                        {off.title}
                      </h4>
                      {off.dedication_note && (
                        <p className="text-[11px] text-stone-300 font-serif italic mt-1 line-clamp-2">
                          "{off.dedication_note}"
                        </p>
                      )}
                    </div>

                    <div className="pt-2 border-t border-amber-900/20 text-[10px] text-amber-400/80 font-mono">
                      Offered by: {off.placed_by}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* TIER 3: LOWER ALTAR (CANDLES, PRAYERS & INCENSE) */}
          <div className="pt-8 border-t border-amber-900/40 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-[11px] font-cinzel tracking-widest text-amber-400/80 uppercase px-3 py-1 rounded-full bg-amber-950/60 border border-amber-700/40">
                  Tier III • Candles of Remembrance & Whispered Prayers
                </span>
                <span className="text-xs text-amber-300 ml-3 font-mono">
                  {activeCandlesCount} {activeCandlesCount === 1 ? 'Flame Lit' : 'Flames Lit'}
                </span>
              </div>

              <button
                type="button"
                onClick={onOpenLightCandle}
                className="text-xs text-amber-400 hover:text-amber-200 font-medium transition flex items-center gap-1 self-start sm:self-auto"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Light Another Flame</span>
              </button>
            </div>

            {/* Glowing Interactive Candles Row */}
            <div className="flex flex-wrap items-end justify-center gap-6 sm:gap-8 p-6 bg-obsidian-950/70 rounded-2xl border border-amber-900/30 min-h-[160px]">
              {candles.length === 0 ? (
                <div className="text-center text-xs text-stone-500 italic py-6">
                  No candles lit yet. Be the first to kindle a flame in their honor.
                </div>
              ) : (
                candles.map((candle) => {
                  const isSelected = selectedCandle?.id === candle.id;
                  return (
                    <div
                      key={candle.id}
                      className="flex flex-col items-center group cursor-pointer"
                      onClick={() => setSelectedCandle(candle)}
                    >
                      <CandleFlame
                        isLit={candle.is_lit === 1}
                        size="md"
                        colorType={candle.candle_type}
                        onToggle={() => handleToggleCandle(candle)}
                      />
                      <span className={`text-[10px] mt-2 font-mono truncate max-w-[80px] transition ${
                        isSelected ? 'text-amber-300 font-bold' : 'text-stone-400 group-hover:text-amber-200'
                      }`}>
                        {candle.lit_by}
                      </span>
                    </div>
                  );
                })
              )}
            </div>

            {/* Selected Candle Prayer Inspector */}
            {selectedCandle && (
              <div className="parchment-card rounded-2xl p-5 border border-amber-500/50 shadow-candle-md animate-in fade-in zoom-in-95">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <Flame className="w-4 h-4 text-amber-400 fill-amber-400" />
                    <div>
                      <h4 className="font-playfair font-bold text-sm text-amber-100">
                        Candle Lit by {selectedCandle.lit_by}
                      </h4>
                      <p className="text-[10px] text-stone-400 font-mono">{selectedCandle.lit_at || 'Eternal'}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedCandle(null)}
                    className="text-stone-500 hover:text-white text-xs"
                  >
                    ✕
                  </button>
                </div>
                {selectedCandle.message ? (
                  <p className="text-xs sm:text-sm text-amber-200/90 font-serif italic mt-3 leading-relaxed">
                    "{selectedCandle.message}"
                  </p>
                ) : (
                  <p className="text-xs text-stone-500 italic mt-2">
                    A silent flame of reverence and love.
                  </p>
                )}
                <div className="flex items-center justify-end gap-3 mt-3 pt-2 border-t border-amber-900/30">
                  <button
                    type="button"
                    onClick={() => handleToggleCandle(selectedCandle)}
                    className="text-xs text-amber-400 hover:underline"
                  >
                    {selectedCandle.is_lit === 1 ? 'Extinguish Flame' : 'Kindle Flame'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Remembrance Wall Section */}
      <section className="space-y-4">
        <h3 className="font-playfair text-2xl font-bold text-amber-100 flex items-center gap-2">
          <span>Whispers of Remembrance Wall</span>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-950/60 text-amber-300 font-sans">
            {candles.filter(c => c.message).length} Messages
          </span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {candles.filter(c => c.message).map((c) => (
            <div
              key={c.id}
              className="parchment-card rounded-2xl p-5 border border-amber-900/30 space-y-3"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-playfair font-bold text-amber-200 flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                  {c.lit_by}
                </span>
                <span className="text-[10px] text-stone-500 font-mono">{c.lit_at?.split(' ')[0] || ''}</span>
              </div>
              <p className="text-xs sm:text-sm text-stone-200 font-serif italic leading-relaxed">
                "{c.message}"
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
