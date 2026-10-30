import React, { useState } from 'react';
import { X, Sparkles, BookOpen, Feather, Heart, Check, Compass, Tag } from 'lucide-react';
import { api } from '../services/api';
import { AudioRecording, Story } from '../types';

interface StoryWeaverModalProps {
  isOpen: boolean;
  onClose: () => void;
  lovedOneId: number;
  initialRecording?: AudioRecording | null;
  onStorySaved?: (story: Story) => void;
}

export const StoryWeaverModal: React.FC<StoryWeaverModalProps> = ({
  isOpen,
  onClose,
  lovedOneId,
  initialRecording,
  onStorySaved
}) => {
  const [transcript, setTranscript] = useState(initialRecording?.transcript_raw || '');
  const [style, setStyle] = useState<'Classic Biographer' | 'Intimate Family Chronicle' | 'Life Lesson & Wisdom' | 'Poetic Vignette'>('Intimate Family Chronicle');
  const [contextNotes, setContextNotes] = useState(initialRecording?.notes || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generated draft state
  const [generatedDraft, setGeneratedDraft] = useState<any | null>(null);
  const [editableTitle, setEditableTitle] = useState('');
  const [editableNarrative, setEditableNarrative] = useState('');
  const [editableWisdom, setEditableWisdom] = useState('');
  const [editableEra, setEditableEra] = useState('');
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const styles = [
    {
      id: 'Intimate Family Chronicle',
      title: 'Family Chronicle',
      desc: 'Warm, heartfelt memoir style for heirloom family books',
      icon: Heart,
      accent: 'border-amber-500/50 bg-amber-950/20 text-amber-200'
    },
    {
      id: 'Classic Biographer',
      title: 'Classic Biographer',
      desc: 'Eloquent, chronological narrative with historical reverence',
      icon: Feather,
      accent: 'border-yellow-600/50 bg-yellow-950/20 text-yellow-200'
    },
    {
      id: 'Life Lesson & Wisdom',
      title: 'Wisdom & Lessons',
      desc: 'Highlights core virtues, advice, and values passed down',
      icon: Compass,
      accent: 'border-orange-500/50 bg-orange-950/20 text-orange-200'
    },
    {
      id: 'Poetic Vignette',
      title: 'Poetic Vignette',
      desc: 'Atmospheric, lyrical capture of a single precious moment',
      icon: Sparkles,
      accent: 'border-rose-500/50 bg-rose-950/20 text-rose-200'
    }
  ];

  const handleGenerate = async () => {
    if (!transcript.trim()) {
      setError("Please provide a spoken transcript or memories to weave.");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const res = await api.generateStory(lovedOneId, {
        transcript,
        style,
        context_notes: contextNotes,
        audio_recording_id: initialRecording?.id
      });

      const story = res.generated_story;
      setGeneratedDraft(story);
      setEditableTitle(story.title || 'Woven Memory Chapter');
      setEditableNarrative(story.narrative || '');
      setEditableWisdom(story.key_wisdom || '');
      setEditableEra(story.era_timeframe || '');
    } catch (err: any) {
      setError(err.message || "Failed to generate story with AI.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!editableTitle.trim() || !editableNarrative.trim()) return;
    setSaving(true);
    try {
      const res = await api.saveStory(lovedOneId, {
        title: editableTitle,
        narrative: editableNarrative,
        story_style: style,
        key_wisdom: editableWisdom,
        era_timeframe: editableEra,
        tags: generatedDraft?.tags || ['Memoir', 'Voice Memory'],
        audio_recording_id: initialRecording?.id,
        location: generatedDraft?.location || 'Family Archives',
        emotional_tone: generatedDraft?.emotional_tone || 'Warmly Reverent'
      });

      if (onStorySaved) onStorySaved(res.story);
      onClose();
    } catch (err: any) {
      setError(err.message || "Could not save story to vault.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl parchment-card rounded-2xl border border-amber-600/40 shadow-2xl overflow-hidden my-8">
        {/* Top Header */}
        <div className="flex items-center justify-between p-6 border-b border-amber-900/40 bg-obsidian-900/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-700 flex items-center justify-center shadow-candle-sm">
              <BookOpen className="w-5 h-5 text-amber-50" />
            </div>
            <div>
              <h3 className="font-playfair text-xl font-bold text-amber-100">
                AI Memory Storyteller Studio
              </h3>
              <p className="text-xs text-amber-300/70">
                Powered locally by Qwen2.5-3B-Instruct through Ollama
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-amber-300 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 sm:p-8 space-y-6 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="p-4 rounded-xl bg-red-950/70 border border-red-700/50 text-red-200 text-sm">
              {error}
            </div>
          )}

          {!generatedDraft ? (
            <>
              {/* Style Selection */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-amber-400/80 mb-3">
                  1. Choose Narrative Literary Style
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {styles.map((s) => {
                    const Icon = s.icon;
                    const isSelected = style === s.id;
                    return (
                      <div
                        key={s.id}
                        onClick={() => setStyle(s.id as any)}
                        className={`p-4 rounded-xl border cursor-pointer transition-all ${
                          isSelected
                            ? `${s.accent} border-amber-500 shadow-candle-sm ring-1 ring-amber-500/50`
                            : 'border-amber-900/30 bg-obsidian-900/50 hover:bg-obsidian-900/80 text-stone-300'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 mb-1.5">
                          <Icon className="w-4 h-4 text-amber-400" />
                          <h4 className="font-playfair font-bold text-sm text-amber-100">{s.title}</h4>
                        </div>
                        <p className="text-xs text-stone-400 leading-relaxed">{s.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Transcript Input */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-amber-400/80 mb-2">
                  2. Spoken Transcript or Memory Notes *
                </label>
                <textarea
                  rows={6}
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  placeholder="Paste or type raw spoken words, recollections, oral history transcript, or key life moments..."
                  className="w-full bg-obsidian-900 border border-amber-900/60 rounded-xl p-4 text-sm text-amber-100 placeholder:text-stone-600 focus:outline-none focus:border-amber-500 leading-relaxed"
                />
              </div>

              {/* Additional Context Notes */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-amber-400/80 mb-2">
                  3. Context / Background (Optional)
                </label>
                <input
                  type="text"
                  value={contextNotes}
                  onChange={(e) => setContextNotes(e.target.value)}
                  placeholder="e.g. In the plaza after the 1956 rainstorm, early courting era..."
                  className="w-full bg-obsidian-900 border border-amber-900/60 rounded-xl px-4 py-2.5 text-sm text-amber-100 placeholder:text-stone-600 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Ethical Guardrail Notice */}
              <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-800/40 text-[12px] text-amber-300/80 leading-relaxed flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Ethical Preservation Guarantee:</strong> Echoes writes as an archival biographer honoring real memories. It never pretends to be or simulate the voice of deceased individuals, nor does it invent memories.
                </span>
              </div>
            </>
          ) : (
            /* Review & Edit Generated Story */
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-amber-900/40">
                <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">
                  Woven Chapter Preview & Editor
                </span>
                <button
                  type="button"
                  onClick={() => setGeneratedDraft(null)}
                  className="text-xs text-stone-400 hover:text-amber-300 transition"
                >
                  ← Weave Another Version
                </button>
              </div>

              <div>
                <label className="block text-xs text-amber-300/80 mb-1">Story Chapter Title</label>
                <input
                  type="text"
                  value={editableTitle}
                  onChange={(e) => setEditableTitle(e.target.value)}
                  className="w-full bg-obsidian-900 border border-amber-900/60 rounded-xl px-4 py-2.5 text-lg font-playfair font-bold text-amber-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-amber-300/80 mb-1">Era / Timeframe</label>
                  <input
                    type="text"
                    value={editableEra}
                    onChange={(e) => setEditableEra(e.target.value)}
                    placeholder="e.g. October 1956, Early Courting"
                    className="w-full bg-obsidian-900 border border-amber-900/60 rounded-xl px-4 py-2 text-sm text-amber-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-amber-300/80 mb-1">Key Wisdom / Lasting Truth</label>
                  <input
                    type="text"
                    value={editableWisdom}
                    onChange={(e) => setEditableWisdom(e.target.value)}
                    placeholder="Core lesson passed down..."
                    className="w-full bg-obsidian-900 border border-amber-900/60 rounded-xl px-4 py-2 text-sm text-amber-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-amber-300/80 mb-1">Narrative Memoir</label>
                <textarea
                  rows={10}
                  value={editableNarrative}
                  onChange={(e) => setEditableNarrative(e.target.value)}
                  className="w-full bg-obsidian-900 border border-amber-900/60 rounded-xl p-4 text-sm text-amber-100 font-serif leading-relaxed focus:outline-none focus:border-amber-500"
                />
              </div>

              {generatedDraft.tags && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {generatedDraft.tags.map((t: string, idx: number) => (
                    <span key={idx} className="text-xs px-2.5 py-1 rounded-full bg-amber-950/60 text-amber-300 border border-amber-800/40 flex items-center gap-1">
                      <Tag className="w-3 h-3 text-amber-400" />
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-6 border-t border-amber-900/40 bg-obsidian-900/80 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-stone-700 text-stone-300 hover:text-white text-sm transition"
          >
            Cancel
          </button>

          {!generatedDraft ? (
            <button
              type="button"
              disabled={loading}
              onClick={handleGenerate}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-medium text-sm shadow-candle-sm hover:shadow-candle-md transition disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Weaving with Qwen2.5...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Weave Story Narrative</span>
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              disabled={saving}
              onClick={handleSave}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-amber-600 hover:from-emerald-500 hover:to-amber-500 text-white font-medium text-sm shadow-candle-sm transition disabled:opacity-50"
            >
              {saving ? (
                <span>Preserving...</span>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Preserve in Memory Vault</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
