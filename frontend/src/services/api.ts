import { 
  User, LovedOne, AudioRecording, Story, VaultItem, 
  OfrendaOffering, OfrendaCandle, QALog, SystemStatus 
} from '../types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api';

function getAuthHeader(): HeadersInit {
  const token = localStorage.getItem('echoes_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(errorData.error || `HTTP error ${res.status}`);
  }
  return res.json();
}

export const api = {
  // Auth
  async login(username: string, password: string):Promise<{ token: string; user: User }> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    return handleResponse(res);
  },

  async signup(username: string, password: string, displayName: string, email?: string): Promise<{ token: string; user: User }> {
    const res = await fetch(`${API_BASE}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, display_name: displayName, email })
    });
    return handleResponse(res);
  },

  async getCurrentUser(): Promise<{ user: User }> {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  // Loved Ones
  async getLovedOnes(): Promise<{ loved_ones: LovedOne[] }> {
    const res = await fetch(`${API_BASE}/loved-ones`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async getLovedOne(id: number): Promise<{ loved_one: LovedOne }> {
    const res = await fetch(`${API_BASE}/loved-ones/${id}`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async createLovedOne(data: Partial<LovedOne>): Promise<{ loved_one: LovedOne }> {
    const res = await fetch(`${API_BASE}/loved-ones`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async updateLovedOne(id: number, data: Partial<LovedOne>): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/loved-ones/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async deleteLovedOne(id: number): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/loved-ones/${id}`, {
      method: 'DELETE',
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async uploadLovedOnePhoto(id: number, file: File, type: 'avatar' | 'cover'): Promise<{ url: string }> {
    const formData = new FormData();
    formData.append('photo', file);
    formData.append('type', type);

    const res = await fetch(`${API_BASE}/loved-ones/${id}/upload-photo`, {
      method: 'POST',
      headers: { ...getAuthHeader() },
      body: formData
    });
    return handleResponse(res);
  },

  // Audio Recordings & Whisper
  async getAudioRecordings(lovedOneId: number): Promise<{ recordings: AudioRecording[] }> {
    const res = await fetch(`${API_BASE}/loved-ones/${lovedOneId}/audio`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async uploadAudio(lovedOneId: number, file: Blob | File, title: string, recordedDate?: string, notes?: string, autoTranscribe = true): Promise<{ recording: AudioRecording; transcription: any }> {
    const formData = new FormData();
    formData.append('audio', file, file instanceof File ? file.name : 'recording.wav');
    formData.append('title', title);
    if (recordedDate) formData.append('recorded_date', recordedDate);
    if (notes) formData.append('notes', notes);
    formData.append('auto_transcribe', String(autoTranscribe));

    const res = await fetch(`${API_BASE}/loved-ones/${lovedOneId}/audio/upload`, {
      method: 'POST',
      headers: { ...getAuthHeader() },
      body: formData
    });
    return handleResponse(res);
  },

  async retranscribeAudio(audioId: number, language?: string): Promise<{ transcript_raw: string; segments: any[] }> {
    const res = await fetch(`${API_BASE}/audio/${audioId}/transcribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ language })
    });
    return handleResponse(res);
  },

  async updateAudio(audioId: number, data: { title?: string; transcript_raw?: string; recorded_date?: string; notes?: string }): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/audio/${audioId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  getAudioStreamUrl(audioId: number): string {
    return `${API_BASE}/audio/${audioId}/stream`;
  },

  // Stories (AI Storyteller)
  async generateStory(lovedOneId: number, payload: { transcript?: string; audio_recording_id?: number; style: string; context_notes?: string }): Promise<{ generated_story: any }> {
    const res = await fetch(`${API_BASE}/loved-ones/${lovedOneId}/stories/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(payload)
    });
    return handleResponse(res);
  },

  async getStories(lovedOneId: number): Promise<{ stories: Story[] }> {
    const res = await fetch(`${API_BASE}/loved-ones/${lovedOneId}/stories`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async saveStory(lovedOneId: number, story: Partial<Story>): Promise<{ story: Story }> {
    const res = await fetch(`${API_BASE}/loved-ones/${lovedOneId}/stories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(story)
    });
    return handleResponse(res);
  },

  async updateStory(storyId: number, data: Partial<Story>): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/stories/${storyId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async deleteStory(storyId: number): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/stories/${storyId}`, {
      method: 'DELETE',
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  // Memory Vault
  async getVaultItems(lovedOneId: number, filter?: { category?: string; type?: string; q?: string }): Promise<{ vault_items: VaultItem[] }> {
    const params = new URLSearchParams();
    if (filter?.category) params.append('category', filter.category);
    if (filter?.type) params.append('type', filter.type);
    if (filter?.q) params.append('q', filter.q);

    const res = await fetch(`${API_BASE}/loved-ones/${lovedOneId}/vault?${params.toString()}`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async createVaultItem(lovedOneId: number, data: Partial<VaultItem>): Promise<{ vault_item: VaultItem }> {
    const res = await fetch(`${API_BASE}/loved-ones/${lovedOneId}/vault`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async uploadVaultPhoto(lovedOneId: number, file: File): Promise<{ media_url: string }> {
    const formData = new FormData();
    formData.append('photo', file);

    const res = await fetch(`${API_BASE}/loved-ones/${lovedOneId}/vault/upload`, {
      method: 'POST',
      headers: { ...getAuthHeader() },
      body: formData
    });
    return handleResponse(res);
  },

  async deleteVaultItem(itemId: number): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/vault/${itemId}`, {
      method: 'DELETE',
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async exportMemoryBook(lovedOneId: number): Promise<{ loved_one_name: string; markdown_content: string; raw_data: any }> {
    const res = await fetch(`${API_BASE}/loved-ones/${lovedOneId}/export`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  // Virtual Ofrenda
  async getOfrenda(lovedOneId: number): Promise<{
    loved_one: LovedOne;
    offerings_by_tier: { 1: OfrendaOffering[]; 2: OfrendaOffering[]; 3: OfrendaOffering[] };
    offerings_total: number;
    candles: OfrendaCandle[];
    active_candles_count: number;
  }> {
    const res = await fetch(`${API_BASE}/loved-ones/${lovedOneId}/ofrenda`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async addOffering(lovedOneId: number, data: Partial<OfrendaOffering>): Promise<{ offering: OfrendaOffering }> {
    const res = await fetch(`${API_BASE}/loved-ones/${lovedOneId}/ofrenda/offerings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async removeOffering(offeringId: number): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/ofrenda/offerings/${offeringId}`, {
      method: 'DELETE',
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async lightCandle(lovedOneId: number, data: { lit_by?: string; message?: string; candle_type?: string }): Promise<{ candle: OfrendaCandle }> {
    const res = await fetch(`${API_BASE}/loved-ones/${lovedOneId}/ofrenda/candles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async toggleCandle(candleId: number): Promise<{ is_lit: number }> {
    const res = await fetch(`${API_BASE}/ofrenda/candles/${candleId}/toggle`, {
      method: 'PUT',
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  // Ask Your Memories (RAG Q&A)
  async askMemories(lovedOneId: number, question: string): Promise<{
    question: string;
    answer: string;
    cited_sources: any[];
    model_used?: string;
    is_simulation?: boolean;
    suggested_questions: string[];
  }> {
    const res = await fetch(`${API_BASE}/loved-ones/${lovedOneId}/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ question })
    });
    return handleResponse(res);
  },

  async getQAHistory(lovedOneId: number): Promise<{ history: QALog[]; suggested_questions: string[] }> {
    const res = await fetch(`${API_BASE}/loved-ones/${lovedOneId}/ask/history`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  // System & Health
  async getSystemStatus(): Promise<SystemStatus> {
    const res = await fetch(`${API_BASE}/system/status`);
    return handleResponse(res);
  },

  async recheckOllama(): Promise<any> {
    const res = await fetch(`${API_BASE}/system/check-ollama`, { method: 'POST' });
    return handleResponse(res);
  },

  async setModel(modelName: string): Promise<any> {
    const res = await fetch(`${API_BASE}/system/set-model`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model_name: modelName })
    });
    return handleResponse(res);
  }
};
