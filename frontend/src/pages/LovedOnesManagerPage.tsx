import React, { useState } from 'react';
import { 
  Heart, Plus, Calendar, MapPin, Trash2, Edit2, 
  Check, X, Sparkles, ArrowRight, User 
} from 'lucide-react';
import { useProfile } from '../context/ProfileContext';
import { api } from '../services/api';
import { LovedOne } from '../types';

interface LovedOnesManagerPageProps {
  onSelectSanctuary: () => void;
}

export const LovedOnesManagerPage: React.FC<LovedOnesManagerPageProps> = ({ onSelectSanctuary }) => {
  const { lovedOnes, activeProfile, setActiveProfile, refreshLovedOnes } = useProfile();
  const [isCreating, setIsCreating] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState('Grandmother');
  const [birthDate, setBirthDate] = useState('');
  const [passingDate, setPassingDate] = useState('');
  const [restingPlace, setRestingPlace] = useState('');
  const [epitaph, setEpitaph] = useState('');
  const [bio, setBio] = useState('');
  const [foods, setFoods] = useState('');
  const [music, setMusic] = useState('');
  const [passions, setPassions] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const relationships = ['Grandmother', 'Grandfather', 'Mother', 'Father', 'Aunt', 'Uncle', 'Sibling', 'Mentor', 'Beloved Friend', 'Partner'];

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please specify the loved one's name.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const favs = {
        foods: foods.split(',').map(s => s.trim()).filter(Boolean),
        music: music.split(',').map(s => s.trim()).filter(Boolean),
        passions: passions.split(',').map(s => s.trim()).filter(Boolean)
      };

      const res = await api.createLovedOne({
        name: name.trim(),
        relationship,
        birth_date: birthDate || undefined,
        passing_date: passingDate || undefined,
        resting_place: restingPlace.trim() || undefined,
        epitaph: epitaph.trim() || undefined,
        bio: bio.trim() || undefined,
        favorite_things: favs
      });

      await refreshLovedOnes();
      setActiveProfile(res.loved_one);
      setIsCreating(false);
      setName('');
      setBirthDate('');
      setPassingDate('');
      setRestingPlace('');
      setEpitaph('');
      setBio('');
      setFoods('');
      setMusic('');
      setPassions('');
      onSelectSanctuary();
    } catch (err: any) {
      setError(err.message || "Could not create memorial profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this memorial sanctuary? All associated memories and altar items will be removed.")) return;
    try {
      await api.deleteLovedOne(id);
      await refreshLovedOnes();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-10 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-950/60 border border-amber-600/30 text-amber-300 text-xs font-medium mb-2">
            <Heart className="w-3.5 h-3.5 text-amber-400" />
            <span>Memorial Sanctuaries</span>
          </div>
          <h2 className="font-playfair text-3xl sm:text-4xl font-bold text-amber-100">
            Loved Ones' Sanctuaries
          </h2>
          <p className="text-sm text-stone-300 mt-1 font-serif">
            Create and switch between separate dedicated archives and virtual altars for each family member.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-medium text-xs sm:text-sm shadow-candle-sm hover:shadow-candle-md transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>+ New Memorial Sanctuary</span>
        </button>
      </div>

      {/* Grid of Memorial Sanctuaries */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {lovedOnes.map((p) => {
          const isActive = activeProfile?.id === p.id;
          return (
            <div
              key={p.id}
              className={`parchment-card rounded-2xl border p-6 flex flex-col justify-between space-y-4 transition-all ${
                isActive
                  ? 'border-amber-500 shadow-candle-md ring-1 ring-amber-500/50'
                  : 'border-amber-900/40 hover:border-amber-600/40'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-600/40 to-orange-800/40 border border-amber-500/40 flex items-center justify-center overflow-hidden">
                    {p.avatar_url ? (
                      <img src={p.avatar_url} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="font-playfair text-xl font-bold text-amber-300">{p.name[0]}</span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {isActive ? (
                      <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-950 border border-emerald-600/50 text-emerald-300 font-semibold flex items-center gap-1">
                        <Check className="w-3 h-3" /> Active
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setActiveProfile(p);
                          onSelectSanctuary();
                        }}
                        className="text-xs px-3 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 transition"
                      >
                        Enter Sanctuary
                      </button>
                    )}
                    {lovedOnes.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleDelete(p.id)}
                        className="p-1.5 text-stone-500 hover:text-red-400 rounded transition"
                        title="Delete sanctuary"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="font-playfair text-xl font-bold text-amber-100">{p.name}</h3>
                  <p className="text-xs text-amber-400/80">{p.relationship}</p>
                </div>

                {p.epitaph && (
                  <p className="text-xs text-stone-300 font-serif italic line-clamp-2">
                    "{p.epitaph}"
                  </p>
                )}

                <div className="space-y-1 text-xs text-stone-400">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-amber-400" />
                    <span>{p.birth_date || '?'} — {p.passing_date || 'Present'}</span>
                  </div>
                  {p.resting_place && (
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-amber-400" />
                      <span>{p.resting_place}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div className="pt-3 border-t border-amber-900/30 grid grid-cols-4 gap-2 text-center text-xs">
                <div>
                  <span className="font-mono font-bold text-amber-400">{p.audio_count ?? 0}</span>
                  <div className="text-[10px] text-stone-400">Tapes</div>
                </div>
                <div>
                  <span className="font-mono font-bold text-amber-400">{p.story_count ?? 0}</span>
                  <div className="text-[10px] text-stone-400">Stories</div>
                </div>
                <div>
                  <span className="font-mono font-bold text-amber-400">{p.vault_count ?? 0}</span>
                  <div className="text-[10px] text-stone-400">Vault</div>
                </div>
                <div>
                  <span className="font-mono font-bold text-amber-400">{p.lit_candle_count ?? 0}</span>
                  <div className="text-[10px] text-stone-400">Flames</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Sanctuary Modal */}
      {isCreating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-2xl parchment-card rounded-2xl border border-amber-600/40 shadow-2xl p-6 sm:p-8 space-y-5 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-amber-900/40">
              <div className="flex items-center gap-2.5">
                <Heart className="w-5 h-5 text-amber-400" />
                <h3 className="font-playfair text-xl font-bold text-amber-100">Create New Memorial Sanctuary</h3>
              </div>
              <button onClick={() => setIsCreating(false)} className="p-1.5 text-stone-400 hover:text-white rounded-lg transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="p-3.5 rounded-xl bg-red-950/70 border border-red-700/50 text-red-200 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-amber-300/80 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Grandfather Arthur Ramos"
                    className="w-full bg-obsidian-900 border border-amber-900/60 rounded-xl px-4 py-2 text-sm text-amber-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-amber-300/80 mb-1">Relationship</label>
                  <select
                    value={relationship}
                    onChange={(e) => setRelationship(e.target.value)}
                    className="w-full bg-obsidian-900 border border-amber-900/60 rounded-xl px-4 py-2 text-sm text-amber-100 focus:outline-none focus:border-amber-500"
                  >
                    {relationships.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-amber-300/80 mb-1">Birth Date</label>
                  <input
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="w-full bg-obsidian-900 border border-amber-900/60 rounded-xl px-4 py-2 text-sm text-amber-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-amber-300/80 mb-1">Passing Date</label>
                  <input
                    type="date"
                    value={passingDate}
                    onChange={(e) => setPassingDate(e.target.value)}
                    className="w-full bg-obsidian-900 border border-amber-900/60 rounded-xl px-4 py-2 text-sm text-amber-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-amber-300/80 mb-1">Resting Place / Hometown</label>
                  <input
                    type="text"
                    value={restingPlace}
                    onChange={(e) => setRestingPlace(e.target.value)}
                    placeholder="e.g. San Antonio, Texas"
                    className="w-full bg-obsidian-900 border border-amber-900/60 rounded-xl px-4 py-2 text-sm text-amber-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-amber-300/80 mb-1">Epitaph / Beloved Quote</label>
                <input
                  type="text"
                  value={epitaph}
                  onChange={(e) => setEpitaph(e.target.value)}
                  placeholder="e.g. Whose laughter was the hearth of our family."
                  className="w-full bg-obsidian-900 border border-amber-900/60 rounded-xl px-4 py-2 text-sm text-amber-100 focus:outline-none focus:border-amber-500 font-serif italic"
                />
              </div>

              <div>
                <label className="block text-xs text-amber-300/80 mb-1">Biographical Portrait / Tribute</label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="A short introduction to their life, personality, warmth, and enduring legacy..."
                  className="w-full bg-obsidian-900 border border-amber-900/60 rounded-xl p-3 text-sm text-amber-100 focus:outline-none focus:border-amber-500 font-serif resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] text-amber-300/80 mb-1">Favorite Foods (comma separated)</label>
                  <input
                    type="text"
                    value={foods}
                    onChange={(e) => setFoods(e.target.value)}
                    placeholder="e.g. Tamales, Fresh Coffee"
                    className="w-full bg-obsidian-900 border border-amber-900/60 rounded-xl px-3 py-1.5 text-xs text-amber-100 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-amber-300/80 mb-1">Favorite Music</label>
                  <input
                    type="text"
                    value={music}
                    onChange={(e) => setMusic(e.target.value)}
                    placeholder="e.g. Classical Guitar, Boleros"
                    className="w-full bg-obsidian-900 border border-amber-900/60 rounded-xl px-3 py-1.5 text-xs text-amber-100 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-amber-300/80 mb-1">Passions / Hobbies</label>
                  <input
                    type="text"
                    value={passions}
                    onChange={(e) => setPassions(e.target.value)}
                    placeholder="e.g. Woodworking, Gardening"
                    className="w-full bg-obsidian-900 border border-amber-900/60 rounded-xl px-3 py-1.5 text-xs text-amber-100 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 rounded-xl border border-stone-700 text-stone-300 hover:text-white text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-medium text-xs shadow-candle-sm transition disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{saving ? "Creating Sanctuary..." : "Create Sanctuary"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
