import React, { createContext, useContext, useState, useEffect } from 'react';
import { LovedOne } from '../types';
import { api } from '../services/api';
import { useAuth } from './AuthContext';

interface ProfileContextType {
  lovedOnes: LovedOne[];
  activeProfile: LovedOne | null;
  loading: boolean;
  refreshLovedOnes: () => Promise<void>;
  setActiveProfile: (profile: LovedOne) => void;
  setActiveProfileById: (id: number) => void;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export const ProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [lovedOnes, setLovedOnes] = useState<LovedOne[]>([]);
  const [activeProfile, setActiveProfileState] = useState<LovedOne | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshLovedOnes = async () => {
    if (!user) {
      setLovedOnes([]);
      setActiveProfileState(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await api.getLovedOnes();
      setLovedOnes(res.loved_ones);

      const savedId = localStorage.getItem('echoes_active_profile_id');
      if (savedId) {
        const found = res.loved_ones.find(p => p.id === Number(savedId));
        if (found) {
          setActiveProfileState(found);
          return;
        }
      }

      // Default to first profile if available
      if (res.loved_ones.length > 0) {
        setActiveProfileState(res.loved_ones[0]);
        localStorage.setItem('echoes_active_profile_id', String(res.loved_ones[0].id));
      } else {
        setActiveProfileState(null);
      }
    } catch (e) {
      console.warn("Could not load loved ones profiles:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshLovedOnes();
  }, [user]);

  const setActiveProfile = (profile: LovedOne) => {
    setActiveProfileState(profile);
    localStorage.setItem('echoes_active_profile_id', String(profile.id));
  };

  const setActiveProfileById = (id: number) => {
    const found = lovedOnes.find(p => p.id === id);
    if (found) {
      setActiveProfile(found);
    }
  };

  return (
    <ProfileContext.Provider value={{
      lovedOnes,
      activeProfile,
      loading,
      refreshLovedOnes,
      setActiveProfile,
      setActiveProfileById
    }}>
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (!context) throw new Error('useProfile must be used within a ProfileProvider');
  return context;
};
