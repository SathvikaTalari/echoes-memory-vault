import React, { createContext, useContext, useState, useEffect } from 'react';
import { SystemStatus } from '../types';
import { api } from '../services/api';

interface SystemContextType {
  status: SystemStatus | null;
  loading: boolean;
  refreshStatus: () => Promise<void>;
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
  recheckOllama: () => Promise<void>;
  switchModel: (modelName: string) => Promise<void>;
}

const SystemContext = createContext<SystemContextType | undefined>(undefined);

export const SystemProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const refreshStatus = async () => {
    try {
      setLoading(true);
      const res = await api.getSystemStatus();
      setStatus(res);
    } catch (e) {
      console.warn("Could not retrieve system status:", e);
    } finally {
      setLoading(false);
    }
  };

  const recheckOllama = async () => {
    await api.recheckOllama();
    await refreshStatus();
  };

  const switchModel = async (modelName: string) => {
    await api.setModel(modelName);
    await refreshStatus();
  };

  useEffect(() => {
    refreshStatus();
    // Periodically re-check every 30 seconds
    const interval = setInterval(refreshStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <SystemContext.Provider value={{
      status,
      loading,
      refreshStatus,
      isModalOpen,
      setIsModalOpen,
      recheckOllama,
      switchModel
    }}>
      {children}
    </SystemContext.Provider>
  );
};

export const useSystem = () => {
  const context = useContext(SystemContext);
  if (!context) throw new Error('useSystem must be used within a SystemProvider');
  return context;
};
