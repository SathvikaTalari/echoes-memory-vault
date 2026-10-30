import React, { useState, useEffect } from 'react';
import { 
  Archive, Search, Plus, Filter, Calendar, MapPin, 
  Image as ImageIcon, BookOpen, Quote, Clock, Download, 
  Trash2, X, UploadCloud, Users, Sparkles, LayoutGrid, ListFilter
} from 'lucide-react';
import { useProfile } from '../context/ProfileContext';
import { api } from '../services/api';
import { VaultItem } from '../types';

interface VaultPageProps {
  onOpenExport: () => void;
}

export const VaultPage: React.FC<VaultPageProps> = ({ onOpenExport }) => {
  const { activeProfile } = useProfile();
  const [items, setItems] = useState<VaultItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'timeline'>('grid');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Add Item Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addTitle, setAddTitle] = useState('');
  const [addType, setAddType] = useState<'photo' | 'milestone' | 'quote' | 'artifact'>('photo');
  const [addDesc, setAddDesc] = useState('');
  const [addDate, setAddDate] = useState('');
  const [addLocation, setAddLocation] = useState('');
  const [addCategory, setAddCategory] = useState<'Family' | 'Love & Marriage' | 'Childhood' | 'Wisdom' | 'Adventures' | 'Everyday Joy'>('Family');
  const [addPeople, setAddPeople] = useState('');
  const [addPhotoFile, setAddPhotoFile] = useState<File | null>(null);
  const [savingItem, setSavingItem] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const categories = ['all', 'Family', 'Love & Marriage', 'Childhood', 'Wisdom', 'Adventures', 'Everyday Joy'];
  const types = ['all', 'photo', 'milestone', 'quote', 'artifact'];

  const loadItems = async () => {
    if (!activeProfile) return;
    try {
      setLoading(true);
      const res = await api.getVaultItems(activeProfile.id, {
        category: selectedCategory,
        type: selectedType,
        q: searchQuery
      });
      setItems(res.vault_items);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, [activeProfile, selectedCategory, selectedType, searchQuery]);

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addTitle.trim() || !activeProfile) return;

    setSavingItem(true);
    setModalError(null);

    try {
      let mediaUrl = undefined;
      if (addPhotoFile) {
        const uploadRes = await api.uploadVaultPhoto(activeProfile.id, addPhotoFile);
        mediaUrl = uploadRes.media_url;
      }

      const peopleList = addPeople.split(',').map(p => p.trim()).filter(Boolean);

      await api.createVaultItem(activeProfile.id, {
        title: addTitle.trim(),
        type: addType,
        description: addDesc.trim(),
        media_url: mediaUrl,
        memory_date: addDate || undefined,
        location: addLocation.trim() || undefined,
        category: addCategory,
        people_tagged: peopleList
      });

      setIsAddModalOpen(false);
      setAddTitle('');
      setAddDesc('');
      setAddDate('');
      setAddLocation('');
      setAddPeople('');
      setAddPhotoFile(null);
      await loadItems();
    } catch (err: any) {
      setModalError(err.message || "Failed to preserve memory item.");
    } finally {
      setSavingItem(false);
    }
  };

  const handleDeleteItem = async (id: number) => {
    if (!window.confirm("Remove this memory item from the vault?")) return;
    try {
      await api.deleteVaultItem(id);
      setItems(prev => prev.filter(item => item.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  if (!activeProfile) {
    return (
      <div className="parchment-card rounded-2xl p-12 text-center border border-amber-900/40">
        <Archive className="w-12 h-12 text-amber-500/60 mx-auto mb-3" />
        <h3 className="font-playfair text-xl font-bold text-amber-100">No Loved One Selected</h3>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-950/60 border border-amber-600/30 text-amber-300 text-xs font-medium mb-2">
            <Archive className="w-3.5 h-3.5 text-amber-400" />
            <span>Digital Memory Vault</span>
          </div>
          <h2 className="font-playfair text-3xl sm:text-4xl font-bold text-amber-100">
            Photographs, Milestones & Keepsakes
          </h2>
          <p className="text-sm text-stone-300 mt-1 font-serif">
            Preserving visual memories, life milestones, and artifacts of {activeProfile.name}.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenExport}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-amber-900/60 bg-obsidian-900 hover:bg-obsidian-850 text-amber-300 text-xs font-medium transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Memory Book</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-medium text-xs sm:text-sm shadow-candle-sm hover:shadow-candle-md transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Memory</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="parchment-card rounded-2xl p-4 sm:p-5 border border-amber-900/40 space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, location, or words..."
              className="w-full bg-obsidian-900 border border-amber-900/40 rounded-xl pl-10 pr-4 py-2 text-xs sm:text-sm text-amber-100 placeholder:text-stone-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-obsidian-900 rounded-xl p-1 border border-amber-900/40 self-end md:self-auto">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg text-xs transition ${
                viewMode === 'grid' ? 'bg-amber-600 text-white' : 'text-stone-400 hover:text-amber-200'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('timeline')}
              className={`p-2 rounded-lg text-xs transition ${
                viewMode === 'timeline' ? 'bg-amber-600 text-white' : 'text-stone-400 hover:text-amber-200'
              }`}
              title="Chronological Timeline View"
            >
              <ListFilter className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
          <span className="text-amber-400/80 font-medium whitespace-nowrap mr-1">Categories:</span>
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setSelectedCategory(c)}
              className={`px-3 py-1 rounded-full whitespace-nowrap transition ${
                selectedCategory === c
                  ? 'bg-amber-600 text-white font-medium shadow-sm'
                  : 'bg-obsidian-900 text-stone-400 hover:text-amber-200 border border-amber-900/30'
              }`}
            >
              {c === 'all' ? 'All Memories' : c}
            </button>
          ))}
        </div>
      </div>

      {/* Content View */}
      {loading ? (
        <div className="flex items-center justify-center p-16 text-stone-400">
          <div className="w-6 h-6 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin mr-3" />
          <span>Opening vault archives...</span>
        </div>
      ) : items.length === 0 ? (
        <div className="parchment-card rounded-2xl p-12 text-center border border-amber-900/30 space-y-4">
          <Archive className="w-12 h-12 text-amber-500/40 mx-auto" />
          <h3 className="font-playfair text-xl font-bold text-amber-100">No Memories Found</h3>
          <p className="text-sm text-stone-400 max-w-sm mx-auto font-serif">
            Try adjusting your search filters or click "Add Memory" to preserve a photograph or milestone.
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        /* Masonry Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <div
              key={item.id}
              className="parchment-card parchment-card-hover rounded-2xl border border-amber-900/40 overflow-hidden flex flex-col group relative"
            >
              {/* Image banner if photo */}
              {item.media_url && (
                <div className="relative h-56 w-full bg-obsidian-900 overflow-hidden">
                  <img
                    src={item.media_url}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                  <span className="absolute bottom-3 left-3 text-xs px-2.5 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-amber-300 border border-amber-500/30 font-medium">
                    {item.category}
                  </span>
                </div>
              )}

              <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                <div className="space-y-2">
                  {!item.media_url && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-950/60 text-amber-300 border border-amber-800/40 font-medium">
                        {item.type.toUpperCase()} • {item.category}
                      </span>
                    </div>
                  )}

                  <h3 className="font-playfair text-lg font-bold text-amber-100 group-hover:text-amber-300 transition">
                    {item.title}
                  </h3>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-stone-400">
                    {item.memory_date && (
                      <span className="flex items-center gap-1 font-mono">
                        <Calendar className="w-3.5 h-3.5 text-amber-400" />
                        {item.memory_date}
                      </span>
                    )}
                    {item.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-amber-400" />
                        {item.location}
                      </span>
                    )}
                  </div>

                  {item.description && (
                    <p className="text-xs sm:text-sm text-stone-300 font-serif leading-relaxed line-clamp-4">
                      {item.description}
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-amber-900/20 flex items-center justify-between text-xs text-stone-400">
                  {item.people_tagged && item.people_tagged.length > 0 ? (
                    <div className="flex items-center gap-1 text-[11px] text-amber-400/80 truncate">
                      <Users className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{item.people_tagged.join(', ')}</span>
                    </div>
                  ) : <span />}

                  <button
                    type="button"
                    onClick={() => handleDeleteItem(item.id)}
                    className="p-1.5 text-stone-500 hover:text-red-400 rounded transition"
                    title="Remove item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Chronological Timeline View */
        <div className="relative pl-6 sm:pl-8 border-l-2 border-amber-600/30 space-y-8 my-4">
          {items.map((item) => (
            <div key={item.id} className="relative group">
              {/* Timeline marker node */}
              <div className="absolute -left-[31px] sm:-left-[39px] top-1.5 w-4 h-4 rounded-full bg-amber-500 border-4 border-obsidian-950 shadow-candle-sm group-hover:scale-125 transition-transform" />

              <div className="parchment-card rounded-2xl p-6 border border-amber-900/40 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-amber-900/20">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-amber-400">
                      {item.memory_date || 'Undated Era'}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-obsidian-900 text-stone-300 border border-stone-800">
                      {item.category}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteItem(item.id)}
                    className="p-1 text-stone-500 hover:text-red-400 self-end transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <h3 className="font-playfair text-xl font-bold text-amber-100">
                  {item.title}
                </h3>

                {item.media_url && (
                  <div className="rounded-xl overflow-hidden max-w-md my-2 border border-amber-900/40">
                    <img src={item.media_url} alt={item.title} className="w-full h-48 object-cover" />
                  </div>
                )}

                <p className="text-sm text-stone-300 font-serif leading-relaxed">
                  {item.description}
                </p>

                {item.location && (
                  <div className="text-xs text-stone-400 flex items-center gap-1 pt-1">
                    <MapPin className="w-3.5 h-3.5 text-amber-400" />
                    <span>{item.location}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Memory Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-xl parchment-card rounded-2xl border border-amber-600/40 shadow-2xl p-6 sm:p-8 space-y-5 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-amber-900/40">
              <div className="flex items-center gap-2.5">
                <Archive className="w-5 h-5 text-amber-400" />
                <h3 className="font-playfair text-xl font-bold text-amber-100">Preserve a Memory in Vault</h3>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="p-1.5 text-stone-400 hover:text-white rounded-lg transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="p-3.5 rounded-xl bg-red-950/70 border border-red-700/50 text-red-200 text-xs">
                {modalError}
              </div>
            )}

            <form onSubmit={handleSaveItem} className="space-y-4">
              <div>
                <label className="block text-xs text-amber-300/80 mb-1">Memory Title *</label>
                <input
                  type="text"
                  required
                  value={addTitle}
                  onChange={(e) => setAddTitle(e.target.value)}
                  placeholder="e.g. Wedding Morning at Santo Domingo, First Bicycle Ride"
                  className="w-full bg-obsidian-900 border border-amber-900/60 rounded-xl px-4 py-2 text-sm text-amber-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-amber-300/80 mb-1">Memory Type</label>
                  <select
                    value={addType}
                    onChange={(e) => setAddType(e.target.value as any)}
                    className="w-full bg-obsidian-900 border border-amber-900/60 rounded-xl px-4 py-2 text-sm text-amber-100 focus:outline-none focus:border-amber-500"
                  >
                    <option value="photo">Photograph</option>
                    <option value="milestone">Life Milestone</option>
                    <option value="quote">Cherished Quote / Words</option>
                    <option value="artifact">Physical Keepsake</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-amber-300/80 mb-1">Category</label>
                  <select
                    value={addCategory}
                    onChange={(e) => setAddCategory(e.target.value as any)}
                    className="w-full bg-obsidian-900 border border-amber-900/60 rounded-xl px-4 py-2 text-sm text-amber-100 focus:outline-none focus:border-amber-500"
                  >
                    <option value="Family">Family</option>
                    <option value="Love & Marriage">Love & Marriage</option>
                    <option value="Childhood">Childhood</option>
                    <option value="Wisdom">Wisdom</option>
                    <option value="Adventures">Adventures</option>
                    <option value="Everyday Joy">Everyday Joy</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-amber-300/80 mb-1">Approximate Date</label>
                  <input
                    type="date"
                    value={addDate}
                    onChange={(e) => setAddDate(e.target.value)}
                    className="w-full bg-obsidian-900 border border-amber-900/60 rounded-xl px-4 py-2 text-sm text-amber-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-amber-300/80 mb-1">Location / Setting</label>
                  <input
                    type="text"
                    value={addLocation}
                    onChange={(e) => setAddLocation(e.target.value)}
                    placeholder="e.g. Oaxaca, The Mountain Courtyard"
                    className="w-full bg-obsidian-900 border border-amber-900/60 rounded-xl px-4 py-2 text-sm text-amber-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-amber-300/80 mb-1">People Tagged (Comma separated)</label>
                <input
                  type="text"
                  value={addPeople}
                  onChange={(e) => setAddPeople(e.target.value)}
                  placeholder="e.g. Elena, Manuel, Cousin Carlos"
                  className="w-full bg-obsidian-900 border border-amber-900/60 rounded-xl px-4 py-2 text-sm text-amber-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs text-amber-300/80 mb-1">Upload Photograph (Optional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setAddPhotoFile(e.target.files ? e.target.files[0] : null)}
                  className="w-full text-xs text-stone-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-amber-600 file:text-white hover:file:bg-amber-500 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs text-amber-300/80 mb-1">Memory Recollection / Story Description</label>
                <textarea
                  rows={4}
                  value={addDesc}
                  onChange={(e) => setAddDesc(e.target.value)}
                  placeholder="Describe the moment, what made it unforgettable, what was felt or spoken..."
                  className="w-full bg-obsidian-900 border border-amber-900/60 rounded-xl p-3 text-sm text-amber-100 focus:outline-none focus:border-amber-500 resize-none font-serif"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-stone-700 text-stone-300 hover:text-white text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingItem}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-medium text-xs shadow-candle-sm transition disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{savingItem ? "Preserving..." : "Save to Vault"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
