import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProfileProvider, useProfile } from './context/ProfileContext';
import { SystemProvider, useSystem } from './context/SystemContext';

import { Navbar } from './components/Navbar';
import { PetalShower } from './components/PetalShower';
import { StoryWeaverModal } from './components/StoryWeaverModal';
import { LightCandleModal } from './components/LightCandleModal';
import { AddOfferingModal } from './components/AddOfferingModal';
import { ExportVaultModal } from './components/ExportVaultModal';
import { SystemStatusModal } from './components/SystemStatusModal';

import { HomePage } from './pages/HomePage';
import { RecordPage } from './pages/RecordPage';
import { StorytellerPage } from './pages/StorytellerPage';
import { VaultPage } from './pages/VaultPage';
import { OfrendaPage } from './pages/OfrendaPage';
import { AskMemoriesPage } from './pages/AskMemoriesPage';
import { LovedOnesManagerPage } from './pages/LovedOnesManagerPage';
import { AuthPage } from './pages/AuthPage';

import { AudioRecording, Story } from './types';

const MainLayout: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const { activeProfile, refreshLovedOnes } = useProfile();

  const [currentTab, setCurrentTab] = useState<string>('home');
  const [petalsEnabled, setPetalsEnabled] = useState<boolean>(true);

  // Modals
  const [isWeaverOpen, setIsWeaverOpen] = useState(false);
  const [selectedRecordingForWeave, setSelectedRecordingForWeave] = useState<AudioRecording | null>(null);

  const [isLightCandleOpen, setIsLightCandleOpen] = useState(false);
  const [isAddOfferingOpen, setIsAddOfferingOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-obsidian-950 flex items-center justify-center text-amber-200">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
          <span className="font-playfair text-sm italic">Entering Echoes Sanctuary...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  const handleWeaveFromAudio = (rec: AudioRecording) => {
    setSelectedRecordingForWeave(rec);
    setIsWeaverOpen(true);
  };

  const handleOpenWeaverClean = () => {
    setSelectedRecordingForWeave(null);
    setIsWeaverOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-obsidian-950 text-amber-50 relative selection:bg-amber-600 selection:text-white">
      {/* Gentle Floating Marigold Petals */}
      <PetalShower density={20} enabled={petalsEnabled} />

      {/* Top Navbar */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={(tab) => setCurrentTab(tab)}
        petalsEnabled={petalsEnabled}
        onTogglePetals={() => setPetalsEnabled(!petalsEnabled)}
        onOpenCreateProfile={() => setCurrentTab('manage-profiles')}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {currentTab === 'home' && (
          <HomePage
            onNavigate={(tab) => setCurrentTab(tab)}
            onOpenWeaver={handleOpenWeaverClean}
          />
        )}
        {currentTab === 'record' && (
          <RecordPage
            onWeaveStory={handleWeaveFromAudio}
          />
        )}
        {currentTab === 'storyteller' && (
          <StorytellerPage
            onOpenWeaver={handleOpenWeaverClean}
          />
        )}
        {currentTab === 'vault' && (
          <VaultPage
            onOpenExport={() => setIsExportOpen(true)}
          />
        )}
        {currentTab === 'ofrenda' && (
          <OfrendaPage
            onOpenLightCandle={() => setIsLightCandleOpen(true)}
            onOpenAddOffering={() => setIsAddOfferingOpen(true)}
          />
        )}
        {currentTab === 'ask' && (
          <AskMemoriesPage />
        )}
        {currentTab === 'manage-profiles' && (
          <LovedOnesManagerPage
            onSelectSanctuary={() => setCurrentTab('home')}
          />
        )}
      </main>

      {/* Global Modals */}
      {activeProfile && (
        <>
          <StoryWeaverModal
            isOpen={isWeaverOpen}
            onClose={() => setIsWeaverOpen(false)}
            lovedOneId={activeProfile.id}
            initialRecording={selectedRecordingForWeave}
            onStorySaved={() => {
              if (currentTab === 'storyteller') {
                // Will reload automatically
              }
            }}
          />

          <LightCandleModal
            isOpen={isLightCandleOpen}
            onClose={() => setIsLightCandleOpen(false)}
            lovedOneId={activeProfile.id}
            lovedOneName={activeProfile.name}
            onCandleLit={() => {
              refreshLovedOnes();
            }}
          />

          <AddOfferingModal
            isOpen={isAddOfferingOpen}
            onClose={() => setIsAddOfferingOpen(false)}
            lovedOneId={activeProfile.id}
            onOfferingAdded={() => {
              refreshLovedOnes();
            }}
          />

          <ExportVaultModal
            isOpen={isExportOpen}
            onClose={() => setIsExportOpen(false)}
            lovedOneId={activeProfile.id}
          />
        </>
      )}

      {/* System Status Diagnostic Modal */}
      <SystemStatusModal />

      {/* Footer */}
      <footer className="w-full border-t border-amber-900/30 bg-obsidian-950/90 py-8 text-center text-xs text-stone-400 font-serif">
        <div className="max-w-7xl mx-auto px-4 space-y-2">
          <p className="font-playfair text-amber-200/90 font-semibold text-sm">
            Echoes – Memories Never Die
          </p>
          <p className="text-stone-400 max-w-xl mx-auto text-xs leading-relaxed">
            Built for the Hacktoberfest 2026 "Ghost in the Machine" challenge. Powered by local Whisper speech-to-text, Qwen2.5-3B-Instruct, and SQLite local storage.
          </p>
          <p className="text-[11px] text-stone-600">
            100% On-Device Privacy • Strictly Factual Recall • Dedicated to Eternal Loved Ones
          </p>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <ProfileProvider>
        <SystemProvider>
          <MainLayout />
        </SystemProvider>
      </ProfileProvider>
    </AuthProvider>
  );
}
