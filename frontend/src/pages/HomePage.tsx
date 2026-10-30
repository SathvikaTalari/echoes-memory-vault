import React from 'react';
import { 
  Mic, BookOpen, Archive, Flame, MessageCircleQuestion, 
  Sparkles, ShieldCheck, Heart, ArrowRight, Clock, MapPin, Feather, Quote
} from 'lucide-react';
import { useProfile } from '../context/ProfileContext';
import { CandleFlame } from '../components/CandleFlame';

interface HomePageProps {
  onNavigate: (tab: string) => void;
  onOpenWeaver: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate, onOpenWeaver }) => {
  const { activeProfile, lovedOnes } = useProfile();

  const favThings = activeProfile?.favorite_things;

  return (
    <div className="space-y-12 pb-16">
      {/* Hero Sanctuary Section */}
      <section className="relative overflow-hidden rounded-3xl parchment-card border border-amber-600/30 p-8 sm:p-12 shadow-altar">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-orange-700/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-8 space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-950/60 border border-amber-600/40 text-amber-300 text-xs font-medium">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Hacktoberfest 2026 • Ghost in the Machine</span>
            </div>

            <h1 className="font-cinzel text-3xl sm:text-5xl font-extrabold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-amber-100 via-amber-200 to-orange-400 leading-tight">
              ECHOES
              <span className="block font-playfair font-normal italic text-2xl sm:text-3xl text-amber-300/90 mt-1">
                Where Genuine Memories Live Forever
              </span>
            </h1>

            <p className="text-sm sm:text-base text-amber-100/80 max-w-2xl font-serif leading-relaxed">
              Preserve your loved ones' authentic voice recordings, photographs, life lessons, and oral histories. Powered entirely on your machine by local <strong>Whisper</strong> speech-to-text and <strong>Qwen2.5-3B-Instruct</strong>—guarding personal privacy with sacred reverence.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                type="button"
                onClick={() => onNavigate('record')}
                className="flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-medium text-sm shadow-candle-md hover:shadow-candle-lg transition-all transform hover:-translate-y-0.5"
              >
                <Mic className="w-4 h-4" />
                <span>Record Voice Memory</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigate('ofrenda')}
                className="flex items-center gap-2 px-6 py-3 rounded-full bg-obsidian-900/80 hover:bg-obsidian-850 text-amber-200 border border-amber-500/40 font-medium text-sm transition-all"
              >
                <Flame className="w-4 h-4 text-amber-400" />
                <span>Visit Virtual Ofrenda</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigate('ask')}
                className="flex items-center gap-2 px-5 py-3 rounded-full bg-transparent hover:bg-amber-950/30 text-amber-300 text-sm font-medium transition"
              >
                <MessageCircleQuestion className="w-4 h-4" />
                <span>Ask Memories</span>
              </button>
            </div>
          </div>

          {/* Glowing Sanctuary Altar Focal Point */}
          <div className="lg:col-span-4 flex flex-col items-center justify-center p-6 bg-obsidian-950/70 rounded-2xl border border-amber-900/50 shadow-inner">
            <CandleFlame isLit={true} size="hero" colorType="cempasuchil_gold" />
            <p className="font-playfair text-amber-200 font-semibold text-base mt-4 text-center">
              The Eternal Flame
            </p>
            <p className="text-xs text-amber-400/60 text-center font-serif italic mt-0.5">
              "To live in hearts we leave behind is not to die."
            </p>
          </div>
        </div>
      </section>

      {/* Active Memorial Sanctuary Overview Card */}
      {activeProfile && (
        <section className="parchment-card rounded-2xl border border-amber-600/30 p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-amber-900/30">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-amber-600/40 to-orange-800/40 border border-amber-500/50 flex items-center justify-center overflow-hidden shadow-candle-sm flex-shrink-0">
                {activeProfile.avatar_url ? (
                  <img src={activeProfile.avatar_url} alt={activeProfile.name} className="w-full h-full object-cover" />
                ) : (
                  <Heart className="w-8 h-8 text-amber-300 opacity-80" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-playfair text-2xl sm:text-3xl font-bold text-amber-100">
                    {activeProfile.name}
                  </h2>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-950/60 border border-amber-700/50 text-amber-300">
                    {activeProfile.relationship}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-stone-400 mt-1">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    {activeProfile.birth_date || 'Unknown'} — {activeProfile.passing_date || 'Present'}
                  </span>
                  {activeProfile.resting_place && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-amber-400" />
                      {activeProfile.resting_place}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onNavigate('vault')}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-semibold transition"
            >
              <span>Explore Vault</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Epitaph / Quote */}
          {activeProfile.epitaph && (
            <div className="relative pl-6 py-2 border-l-2 border-amber-500/60 italic text-amber-200/90 font-serif text-sm sm:text-base">
              <Quote className="w-4 h-4 text-amber-500/50 absolute -top-1 left-1" />
              "{activeProfile.epitaph}"
            </div>
          )}

          {/* Bio */}
          {activeProfile.bio && (
            <p className="text-xs sm:text-sm text-stone-300 leading-relaxed font-serif">
              {activeProfile.bio}
            </p>
          )}

          {/* Cherished Preferences (Foods, Music, Passions) */}
          {favThings && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              {favThings.foods && favThings.foods.length > 0 && (
                <div className="p-3 rounded-xl bg-obsidian-900/70 border border-amber-900/30">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 block mb-1">
                    Cherished Recipes & Foods
                  </span>
                  <p className="text-xs text-stone-300">{favThings.foods.join(', ')}</p>
                </div>
              )}
              {favThings.music && favThings.music.length > 0 && (
                <div className="p-3 rounded-xl bg-obsidian-900/70 border border-amber-900/30">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 block mb-1">
                    Beloved Songs & Music
                  </span>
                  <p className="text-xs text-stone-300">{favThings.music.join(', ')}</p>
                </div>
              )}
              {favThings.passions && favThings.passions.length > 0 && (
                <div className="p-3 rounded-xl bg-obsidian-900/70 border border-amber-900/30">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 block mb-1">
                    Passions & Pastimes
                  </span>
                  <p className="text-xs text-stone-300">{favThings.passions.join(', ')}</p>
                </div>
              )}
            </div>
          )}

          {/* Sanctuary Quick Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-3 border-t border-amber-900/30">
            <div className="p-3 rounded-xl bg-obsidian-900/40 text-center">
              <span className="font-mono text-xl font-bold text-amber-400">{activeProfile.audio_count || 0}</span>
              <p className="text-[11px] text-stone-400">Audio Tapes</p>
            </div>
            <div className="p-3 rounded-xl bg-obsidian-900/40 text-center">
              <span className="font-mono text-xl font-bold text-amber-400">{activeProfile.story_count || 0}</span>
              <p className="text-[11px] text-stone-400">Woven Stories</p>
            </div>
            <div className="p-3 rounded-xl bg-obsidian-900/40 text-center">
              <span className="font-mono text-xl font-bold text-amber-400">{activeProfile.vault_count || 0}</span>
              <p className="text-[11px] text-stone-400">Vault Keepsakes</p>
            </div>
            <div className="p-3 rounded-xl bg-obsidian-900/40 text-center">
              <span className="font-mono text-xl font-bold text-amber-400">{activeProfile.offering_count || 0}</span>
              <p className="text-[11px] text-stone-400">Altar Offerings</p>
            </div>
            <div className="p-3 rounded-xl bg-obsidian-900/40 text-center col-span-2 sm:col-span-1">
              <span className="font-mono text-xl font-bold text-amber-400">{activeProfile.lit_candle_count || 0}</span>
              <p className="text-[11px] text-stone-400">Flames Lit</p>
            </div>
          </div>
        </section>
      )}

      {/* Core Feature Pillars */}
      <section className="space-y-4">
        <h3 className="font-playfair text-2xl font-bold text-amber-100 flex items-center gap-2">
          <span>The Four Pillars of Echoes</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Pillar 1: Voice & Whisper */}
          <div 
            onClick={() => onNavigate('record')}
            className="parchment-card parchment-card-hover rounded-2xl p-6 border border-amber-900/40 cursor-pointer space-y-3 group"
          >
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
              <Mic className="w-6 h-6" />
            </div>
            <h4 className="font-playfair text-xl font-bold text-amber-100 group-hover:text-amber-300 transition">
              1. Voice Recording & Local Whisper
            </h4>
            <p className="text-xs sm:text-sm text-stone-300 leading-relaxed font-serif">
              Capture oral histories directly through your browser or upload legacy cassette digitizations. OpenAI Whisper transcribes every spoken word with synchronized segment timestamps—running 100% locally.
            </p>
            <div className="pt-2 flex items-center gap-1.5 text-xs font-semibold text-amber-400">
              <span>Open Voice Studio</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Pillar 2: AI Memory Storyteller */}
          <div 
            onClick={() => onNavigate('storyteller')}
            className="parchment-card parchment-card-hover rounded-2xl p-6 border border-amber-900/40 cursor-pointer space-y-3 group"
          >
            <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400 group-hover:scale-105 transition-transform">
              <BookOpen className="w-6 h-6" />
            </div>
            <h4 className="font-playfair text-xl font-bold text-amber-100 group-hover:text-amber-300 transition">
              2. AI Memory Storyteller (Qwen2.5)
            </h4>
            <p className="text-xs sm:text-sm text-stone-300 leading-relaxed font-serif">
              Transforms spoken fragments into literary heirloom chapters across 4 narrative styles (Classic Biographer, Family Chronicle, Wisdom & Lessons, Poetic Vignette) using locally hosted Qwen2.5-3B-Instruct.
            </p>
            <div className="pt-2 flex items-center gap-1.5 text-xs font-semibold text-amber-400">
              <span>Weave Memories</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Pillar 3: Virtual Ofrenda */}
          <div 
            onClick={() => onNavigate('ofrenda')}
            className="parchment-card parchment-card-hover rounded-2xl p-6 border border-amber-900/40 cursor-pointer space-y-3 group"
          >
            <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 group-hover:scale-105 transition-transform">
              <Flame className="w-6 h-6" />
            </div>
            <h4 className="font-playfair text-xl font-bold text-amber-100 group-hover:text-amber-300 transition">
              3. Virtual Ofrenda Sanctuary
            </h4>
            <p className="text-xs sm:text-sm text-stone-300 leading-relaxed font-serif">
              Inspired by Día de los Muertos, honor your loved ones with a 3-tier altar featuring floating cempasúchil petals, traditional pan de muerto, personalized offerings, and interactive glowing memorial candles.
            </p>
            <div className="pt-2 flex items-center gap-1.5 text-xs font-semibold text-amber-400">
              <span>Light a Candle</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Pillar 4: Ask Your Memories */}
          <div 
            onClick={() => onNavigate('ask')}
            className="parchment-card parchment-card-hover rounded-2xl p-6 border border-amber-900/40 cursor-pointer space-y-3 group"
          >
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 group-hover:scale-105 transition-transform">
              <MessageCircleQuestion className="w-6 h-6" />
            </div>
            <h4 className="font-playfair text-xl font-bold text-amber-100 group-hover:text-amber-300 transition">
              4. Ask Your Memories (Factual RAG)
            </h4>
            <p className="text-xs sm:text-sm text-stone-300 leading-relaxed font-serif">
              Ask deep questions about your loved one's advice, recipes, and childhood memories. Strict factual guardrails ensure answers cite exact memory records without ever hallucinating or roleplaying.
            </p>
            <div className="pt-2 flex items-center gap-1.5 text-xs font-semibold text-amber-400">
              <span>Converse with Archives</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </section>

      {/* Ethical AI Manifesto */}
      <section className="p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-obsidian-900 to-obsidian-850 border border-amber-700/40 flex flex-col sm:flex-row items-center gap-6">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center flex-shrink-0 text-amber-400 shadow-candle-sm">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <h4 className="font-playfair text-lg font-bold text-amber-100">
            Our Sacred Ethical Guarantee
          </h4>
          <p className="text-xs sm:text-sm text-stone-300 leading-relaxed font-serif">
            Echoes never fabricates memories or attempts to simulate/resurrect the persona of departed individuals. We treat grief and remembrance with dignity, serving strictly as a biographer and archival keeper of authentic spoken words.
          </p>
        </div>
      </section>
    </div>
  );
};
