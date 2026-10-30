import React, { useState } from 'react';
import { X, Gift, Sparkles, Flower2, Utensils, Coffee, Music, Heart, Smile, Image as ImageIcon } from 'lucide-react';
import { api } from '../services/api';
import { OfrendaOffering } from '../types';

interface AddOfferingModalProps {
  isOpen: boolean;
  onClose: () => void;
  lovedOneId: number;
  onOfferingAdded?: (offering: OfrendaOffering) => void;
}

export const AddOfferingModal: React.FC<AddOfferingModalProps> = ({
  isOpen,
  onClose,
  lovedOneId,
  onOfferingAdded
}) => {
  const [title, setTitle] = useState('');
  const [itemType, setItemType] = useState<string>('pan_de_muerto');
  const [tier, setTier] = useState<number>(2);
  const [dedicationNote, setDedicationNote] = useState('');
  const [placedBy, setPlacedBy] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const offeringTemplates = [
    { type: 'marigold', title: 'Fresh Cempasúchil Marigolds', tier: 1, icon: Flower2, desc: 'Golden petals guiding the spirit home' },
    { type: 'pan_de_muerto', title: 'Traditional Pan de Muerto', tier: 2, icon: Utensils, desc: 'Sweet bread baked in sacred remembrance' },
    { type: 'beverage', title: 'Clay Cup of Café de Olla', tier: 2, icon: Coffee, desc: 'Steaming spiced Mexican coffee with cinnamon' },
    { type: 'food', title: 'Heirloom Mole & Rice Plate', tier: 2, icon: Utensils, desc: 'Their absolute favorite savory dish' },
    { type: 'keepsake', title: 'Handmade Huipil & Keepsakes', tier: 2, icon: Heart, desc: 'Personal clothing, jewelry, or cherished tools' },
    { type: 'calavera', title: 'Decorated Sugar Skull (Calavera)', tier: 3, icon: Smile, desc: 'Celebration of sweet joy in memory' },
    { type: 'music', title: 'Carved Guitar & Boleros Sheet', tier: 3, icon: Music, desc: 'Songs and melodies they loved to hear' },
  ];

  const handleSelectTemplate = (tmpl: any) => {
    setTitle(tmpl.title);
    setItemType(tmpl.type);
    setTier(tmpl.tier);
  };

  const handleAdd = async () => {
    if (!title.trim()) {
      setError("Please specify the offering title.");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const res = await api.addOffering(lovedOneId, {
        title: title.trim(),
        item_type: itemType as any,
        tier: tier as any,
        dedication_note: dedicationNote.trim() || undefined,
        placed_by: placedBy.trim() || undefined
      });

      if (onOfferingAdded) onOfferingAdded(res.offering);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to place offering on altar.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-xl parchment-card rounded-2xl border border-amber-600/40 shadow-2xl p-6 sm:p-8 space-y-6 my-8">
        <div className="flex items-center justify-between pb-3 border-b border-amber-900/40">
          <div className="flex items-center gap-2.5">
            <Gift className="w-5 h-5 text-amber-400" />
            <h3 className="font-playfair text-xl font-bold text-amber-100">Place an Offering on the Altar</h3>
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

        {/* Quick Offering Presets */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-amber-400/80 mb-2.5">
            Traditional Ofrenda Offerings (Click to choose)
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {offeringTemplates.map((t, idx) => {
              const Icon = t.icon;
              const isSelected = title === t.title;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectTemplate(t)}
                  className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                    isSelected
                      ? 'border-amber-400 bg-amber-950/60 text-amber-100 shadow-candle-sm font-medium'
                      : 'border-amber-900/30 bg-obsidian-900/50 hover:bg-obsidian-900/90 text-stone-300'
                  }`}
                >
                  <Icon className="w-4 h-4 text-amber-400 mb-1" />
                  <span className="text-xs font-semibold line-clamp-1">{t.title}</span>
                  <span className="text-[10px] text-stone-400 line-clamp-1 mt-0.5">Tier {t.tier}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Input */}
        <div className="space-y-4 pt-1">
          <div>
            <label className="block text-xs text-amber-300/80 mb-1">Offering Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Grandma's Famous Lemon Tart, Vintage Leather Journal"
              className="w-full bg-obsidian-900 border border-amber-900/60 rounded-xl px-4 py-2 text-sm text-amber-100 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-amber-300/80 mb-1">Altar Tier</label>
              <select
                value={tier}
                onChange={(e) => setTier(Number(e.target.value))}
                className="w-full bg-obsidian-900 border border-amber-900/60 rounded-xl px-4 py-2 text-sm text-amber-100 focus:outline-none focus:border-amber-500"
              >
                <option value={1}>Tier 1 (Upper Arch - Portrait & Sacred Flowers)</option>
                <option value={2}>Tier 2 (Middle Hearth - Feasts, Bread & Heirlooms)</option>
                <option value={3}>Tier 3 (Lower Altar - Music, Calaveras & Keepsakes)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-amber-300/80 mb-1">Offered In Devotion By</label>
              <input
                type="text"
                value={placedBy}
                onChange={(e) => setPlacedBy(e.target.value)}
                placeholder="e.g. Your Loving Family, Grandchild Alex"
                className="w-full bg-obsidian-900 border border-amber-900/60 rounded-xl px-4 py-2 text-sm text-amber-100 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-amber-300/80 mb-1">Dedication Note (Optional)</label>
            <textarea
              rows={2}
              value={dedicationNote}
              onChange={(e) => setDedicationNote(e.target.value)}
              placeholder="e.g. Placed with sweet memories of lazy Sunday breakfasts together..."
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
            onClick={handleAdd}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-medium text-xs shadow-candle-sm transition disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{loading ? "Placing on Altar..." : "Place Offering"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
