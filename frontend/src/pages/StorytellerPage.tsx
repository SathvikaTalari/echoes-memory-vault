import React, { useState, useEffect } from 'react';
import { 
  BookOpen, Sparkles, Plus, Star, Heart, Feather, Compass, 
  Tag, Clock, MapPin, Quote, Copy, Check, Trash2, RefreshCw 
} from 'lucide-react';
import { useProfile } from '../context/ProfileContext';
import { api } from '../services/api';
import { Story } from '../types';

interface StorytellerPageProps {
  onOpenWeaver: () => void;
}

export const StorytellerPage: React.FC<StorytellerPageProps> = ({ onOpenWeaver }) => {
  const { activeProfile } = useProfile();
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [filterFavorite, setFilterFavorite] = useState(false);

  const loadStories = async () => {
    if (!activeProfile) return;
    try {
      setLoading(true);
      const res = await api.getStories(activeProfile.id);
      setStories(res.stories);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStories();
  }, [activeProfile]);

  const toggleFavorite = async (story: Story) => {
    try {
      const newState = story.is_favorite === 1 ? 0 : 1;
      await api.updateStory(story.id, { is_favorite: newState });
      setStories(prev => prev.map(s => s.id === story.id ? { ...s, is_favorite: newState } : s));
    } catch (e) {
      console.error(e);
    }
  };

  const deleteStory = async (id: number) => {
    if (!window.confirm("Remove this story chapter from the vault?")) return;
    try {
      await api.deleteStory(id);
      setStories(prev => prev.filter(s => s.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  const copyStory = (story: Story) => {
    const text = `# ${story.title}\n\n${story.narrative}\n\nKey Wisdom: "${story.key_wisdom || ''}"`;
    navigator.clipboard.writeText(text);
    setCopiedId(story.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const displayedStories = filterFavorite ? stories.filter(s => s.is_favorite === 1) : stories;

  if (!activeProfile) {
    return (
      <div className="parchment-card rounded-2xl p-12 text-center border border-amber-900/40">
        <BookOpen className="w-12 h-12 text-amber-500/60 mx-auto mb-3" />
        <h3 className="font-playfair text-xl font-bold text-amber-100">No Loved One Selected</h3>
        <p className="text-sm text-stone-400 mt-1">Please select or create a memorial sanctuary first.</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-950/60 border border-amber-600/30 text-amber-300 text-xs font-medium mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>AI Storyteller • Qwen2.5-3B-Instruct</span>
          </div>
          <h2 className="font-playfair text-3xl sm:text-4xl font-bold text-amber-100">
            AI Memory Storyteller Studio
          </h2>
          <p className="text-sm text-stone-300 mt-1 font-serif">
            Transforming spoken fragments and reminiscences of {activeProfile.name} into enduring literary heirlooms.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setFilterFavorite(!filterFavorite)}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border text-xs font-medium transition ${
              filterFavorite
                ? 'bg-amber-950/70 border-amber-500 text-amber-200'
                : 'bg-obsidian-900 border-amber-900/40 text-stone-400 hover:text-amber-200'
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${filterFavorite ? 'fill-amber-400 text-amber-400' : ''}`} />
            <span>Favorites</span>
          </button>

          <button
            type="button"
            onClick={onOpenWeaver}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-medium text-xs sm:text-sm shadow-candle-sm hover:shadow-candle-md transition"
          >
            <Plus className="w-4 h-4" />
            <span>Weave Story with AI</span>
          </button>
        </div>
      </div>

      {/* Stories List */}
      <div className="space-y-8">
        {loading ? (
          <div className="flex items-center justify-center p-16 text-stone-400">
            <div className="w-6 h-6 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin mr-3" />
            <span>Retrieving memory chapters...</span>
          </div>
        ) : displayedStories.length === 0 ? (
          <div className="parchment-card rounded-2xl p-12 text-center border border-amber-900/30 space-y-4">
            <BookOpen className="w-12 h-12 text-amber-400/50 mx-auto" />
            <h3 className="font-playfair text-xl font-bold text-amber-100">
              {filterFavorite ? "No Favorite Stories Marked" : "No Stories Preserved Yet"}
            </h3>
            <p className="text-sm text-stone-400 max-w-md mx-auto font-serif">
              Weave your first story chapter from an audio recording transcript or typed reminiscence using Qwen2.5!
            </p>
            <button
              type="button"
              onClick={onOpenWeaver}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-amber-600 text-white text-xs font-semibold shadow-candle-sm"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Weave First Story</span>
            </button>
          </div>
        ) : (
          displayedStories.map((story) => (
            <article 
              key={story.id}
              className="parchment-card rounded-2xl border border-amber-900/40 p-6 sm:p-10 shadow-md space-y-6 relative overflow-hidden group hover:border-amber-600/40 transition-colors"
            >
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-amber-900/30">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-950/70 border border-amber-700/40 text-amber-300 font-medium">
                      {story.story_style}
                    </span>
                    {story.audio_title && (
                      <span className="text-[11px] text-amber-400/80 font-mono">
                        From Voice Tape: "{story.audio_title}"
                      </span>
                    )}
                  </div>
                  <h3 className="font-playfair text-2xl sm:text-3xl font-bold text-amber-100 pt-1">
                    {story.title}
                  </h3>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-stone-400 pt-0.5">
                    {story.era_timeframe && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                        {story.era_timeframe}
                      </span>
                    )}
                    {story.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-amber-400" />
                        {story.location}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 self-end sm:self-start">
                  <button
                    type="button"
                    onClick={() => toggleFavorite(story)}
                    title={story.is_favorite === 1 ? "Favorited" : "Mark as favorite"}
                    className="p-2 rounded-lg bg-obsidian-900/80 hover:bg-obsidian-850 text-stone-400 hover:text-amber-300 transition"
                  >
                    <Star className={`w-4 h-4 ${story.is_favorite === 1 ? 'fill-amber-400 text-amber-400' : ''}`} />
                  </button>
                  <button
                    type="button"
                    onClick={() => copyStory(story)}
                    title="Copy story text"
                    className="p-2 rounded-lg bg-obsidian-900/80 hover:bg-obsidian-850 text-stone-400 hover:text-amber-300 transition"
                  >
                    {copiedId === story.id ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteStory(story.id)}
                    title="Delete story"
                    className="p-2 rounded-lg bg-obsidian-900/80 hover:bg-obsidian-850 text-stone-400 hover:text-red-400 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Narrative Text */}
              <div className="prose prose-invert max-w-none">
                {story.narrative.split('\n\n').map((paragraph, pIdx) => (
                  <p key={pIdx} className="text-sm sm:text-base text-amber-100/90 leading-relaxed font-serif mb-4">
                    {paragraph}
                  </p>
                ))}
              </div>

              {/* Core Wisdom Box */}
              {story.key_wisdom && (
                <div className="p-4 rounded-xl bg-gradient-to-r from-amber-950/40 to-obsidian-900 border border-amber-600/30 flex items-start gap-3">
                  <Quote className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 block mb-0.5">
                      Core Wisdom Preserved
                    </span>
                    <p className="text-xs sm:text-sm text-amber-200 font-serif italic">
                      "{story.key_wisdom}"
                    </p>
                  </div>
                </div>
              )}

              {/* Footer Tags */}
              {story.tags && story.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2 border-t border-amber-900/20">
                  {story.tags.map((tag, tIdx) => (
                    <span 
                      key={tIdx} 
                      className="text-xs px-2.5 py-0.5 rounded-full bg-obsidian-900/80 text-stone-300 border border-amber-900/30 flex items-center gap-1"
                    >
                      <Tag className="w-3 h-3 text-amber-500/70" />
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </article>
          ))
        )}
      </div>
    </div>
  );
};
