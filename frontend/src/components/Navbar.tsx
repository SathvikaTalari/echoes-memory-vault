import React, { useState } from 'react';
import { 
  Flame, Mic, BookOpen, Archive, Sparkles, MessageCircleQuestion, 
  ChevronDown, User as UserIcon, LogOut, Plus, Settings, Flower2, Heart
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../context/ProfileContext';
import { useSystem } from '../context/SystemContext';
import { CandleFlame } from './CandleFlame';

interface NavbarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  petalsEnabled: boolean;
  onTogglePetals: () => void;
  onOpenCreateProfile: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  petalsEnabled,
  onTogglePetals,
  onOpenCreateProfile
}) => {
  const { user, logout } = useAuth();
  const { lovedOnes, activeProfile, setActiveProfile } = useProfile();
  const { status, setIsModalOpen } = useSystem();

  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const ollamaOnline = status?.ai_subsystems?.ollama?.available;

  const navItems = [
    { id: 'home', label: 'Sanctuary', icon: Heart },
    { id: 'record', label: 'Voice & Audio', icon: Mic },
    { id: 'storyteller', label: 'AI Storyteller', icon: BookOpen },
    { id: 'vault', label: 'Memory Vault', icon: Archive },
    { id: 'ofrenda', label: 'Virtual Ofrenda', icon: Flame },
    { id: 'ask', label: 'Ask Memories', icon: MessageCircleQuestion },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-obsidian-950/85 backdrop-blur-md border-b border-amber-900/30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo & Brand */}
          <div 
            onClick={() => onSelectTab('home')}
            className="flex items-center gap-3 cursor-pointer group select-none"
          >
            <div className="relative">
              <CandleFlame isLit={true} size="sm" colorType="cempasuchil_gold" showWax={false} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-cinzel text-xl sm:text-2xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-amber-100 via-amber-300 to-amber-500">
                  ECHOES
                </span>
                <span className="text-[10px] font-sans font-semibold tracking-widest text-amber-500/80 uppercase px-1.5 py-0.5 rounded border border-amber-600/30 bg-amber-950/40">
                  2026
                </span>
              </div>
              <p className="text-[11px] font-playfair italic text-amber-400/70 -mt-1 hidden sm:block">
                Memories Never Die
              </p>
            </div>
          </div>

          {/* Active Loved One Sanctuary Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-obsidian-900/90 hover:bg-obsidian-850 border border-amber-900/40 text-amber-100 text-xs sm:text-sm font-medium transition shadow-sm"
            >
              <div className="w-6 h-6 rounded-full bg-amber-600/30 border border-amber-500/40 flex items-center justify-center overflow-hidden">
                {activeProfile?.avatar_url ? (
                  <img src={activeProfile.avatar_url} alt={activeProfile.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-amber-300 text-[11px] font-bold">
                    {activeProfile?.name ? activeProfile.name[0] : 'E'}
                  </span>
                )}
              </div>
              <span className="max-w-[120px] sm:max-w-[160px] truncate font-playfair font-semibold">
                {activeProfile ? activeProfile.name : 'Select Loved One'}
              </span>
              <ChevronDown className={`w-3.5 h-3.5 text-amber-400 transition-transform ${profileDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {profileDropdownOpen && (
              <div 
                className="absolute left-0 sm:right-0 sm:left-auto mt-2 w-64 parchment-card rounded-2xl border border-amber-600/40 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150"
                onClick={() => setProfileDropdownOpen(false)}
              >
                <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-400/80">
                  Loved Ones' Sanctuaries
                </div>
                <div className="max-h-56 overflow-y-auto space-y-1 my-1">
                  {lovedOnes.map((p) => {
                    const isActive = activeProfile?.id === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setActiveProfile(p)}
                        className={`w-full flex items-center gap-2.5 p-2 rounded-xl text-left transition ${
                          isActive
                            ? 'bg-amber-950/70 border border-amber-500/40 text-amber-100 font-medium'
                            : 'hover:bg-obsidian-900/80 text-stone-300'
                        }`}
                      >
                        <div className="w-7 h-7 rounded-full bg-amber-900/50 border border-amber-700/40 flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {p.avatar_url ? (
                            <img src={p.avatar_url} alt={p.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-amber-300 text-xs font-bold">{p.name[0]}</span>
                          )}
                        </div>
                        <div className="truncate flex-1">
                          <p className="text-xs font-playfair font-semibold text-amber-100 truncate">{p.name}</p>
                          <p className="text-[10px] text-stone-400">{p.relationship}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
                <div className="pt-2 border-t border-amber-900/40">
                  <button
                    type="button"
                    onClick={onOpenCreateProfile}
                    className="w-full flex items-center justify-center gap-1.5 p-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-medium transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ New Memorial Sanctuary</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-amber-500/20 text-amber-200 border border-amber-500/40 shadow-candle-sm font-semibold'
                      : 'text-stone-300 hover:text-amber-200 hover:bg-obsidian-900/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-stone-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Action Icons & Status */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Petal Shower Toggle */}
            <button
              type="button"
              onClick={onTogglePetals}
              title={petalsEnabled ? 'Disable floating marigolds' : 'Enable floating marigolds'}
              className={`p-2 rounded-xl border text-xs transition ${
                petalsEnabled
                  ? 'border-amber-500/40 bg-amber-950/40 text-amber-300'
                  : 'border-stone-800 bg-obsidian-900 text-stone-500 hover:text-stone-300'
              }`}
            >
              <Flower2 className="w-4 h-4" />
            </button>

            {/* AI Engine Status Pill */}
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-full bg-obsidian-900 border border-amber-900/50 hover:border-amber-500/60 text-xs text-amber-200 transition"
              title="Click to inspect local AI & Whisper status"
            >
              <span 
                className={`w-2 h-2 rounded-full ${
                  ollamaOnline 
                    ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]' 
                    : 'bg-amber-400 animate-pulse'
                }`} 
              />
              <span className="hidden sm:inline font-mono text-[11px]">
                {ollamaOnline ? 'Qwen2.5 Online' : 'Simulation Mode'}
              </span>
            </button>

            {/* User Profile Menu */}
            {user && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="w-8 h-8 rounded-full bg-amber-900/40 border border-amber-700/40 flex items-center justify-center text-amber-300 hover:text-white transition"
                >
                  <UserIcon className="w-4 h-4" />
                </button>

                {userMenuOpen && (
                  <div 
                    className="absolute right-0 mt-2 w-48 parchment-card rounded-2xl border border-amber-600/40 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <div className="px-3 py-2 border-b border-amber-900/30">
                      <p className="text-xs font-semibold text-amber-100">{user.display_name}</p>
                      <p className="text-[10px] text-stone-400 truncate">@{user.username}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onSelectTab('manage-profiles')}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-stone-300 hover:text-amber-200 hover:bg-obsidian-900 rounded-xl transition"
                    >
                      <Settings className="w-3.5 h-3.5" />
                      <span>Manage Sanctuaries</span>
                    </button>
                    <button
                      type="button"
                      onClick={logout}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-red-950/40 rounded-xl transition"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Mobile Navigation Bar */}
        <div className="flex lg:hidden overflow-x-auto py-2.5 gap-1.5 scrollbar-none border-t border-amber-900/20">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-amber-500/25 text-amber-200 border border-amber-500/40 font-semibold'
                    : 'text-stone-400 hover:text-stone-200 bg-obsidian-900/40'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-amber-400' : 'text-stone-500'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
