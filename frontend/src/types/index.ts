export interface User {
  id: number;
  username: string;
  display_name: string;
  email?: string;
  created_at?: string;
}

export interface FavoriteThings {
  foods?: string[];
  music?: string[];
  passions?: string[];
  [key: string]: any;
}

export interface LovedOne {
  id: number;
  user_id: number;
  name: string;
  relationship: string;
  birth_date?: string;
  passing_date?: string;
  resting_place?: string;
  avatar_url?: string;
  cover_url?: string;
  epitaph?: string;
  bio?: string;
  favorite_things?: FavoriteThings;
  audio_count?: number;
  story_count?: number;
  vault_count?: number;
  offering_count?: number;
  lit_candle_count?: number;
  created_at?: string;
}

export interface TranscriptSegment {
  start: number;
  end: number;
  text: string;
}

export interface AudioRecording {
  id: number;
  loved_one_id: number;
  title: string;
  filename: string;
  file_path: string;
  duration_seconds: number;
  transcript_raw: string;
  transcript_segments: TranscriptSegment[];
  recorded_date?: string;
  notes?: string;
  story_count?: number;
  created_at?: string;
}

export interface Story {
  id: number;
  loved_one_id: number;
  audio_recording_id?: number;
  audio_title?: string;
  title: string;
  narrative: string;
  story_style: 'Classic Biographer' | 'Intimate Family Chronicle' | 'Life Lesson & Wisdom' | 'Poetic Vignette';
  era_timeframe?: string;
  location?: string;
  key_wisdom?: string;
  emotional_tone?: string;
  tags?: string[];
  is_favorite?: number;
  created_at?: string;
  model_used?: string;
  is_simulation?: boolean;
}

export interface VaultItem {
  id: number;
  loved_one_id: number;
  type: 'photo' | 'story' | 'milestone' | 'quote' | 'artifact';
  title: string;
  description?: string;
  media_url?: string;
  memory_date?: string;
  location?: string;
  people_tagged?: string[];
  category: 'Family' | 'Love & Marriage' | 'Childhood' | 'Wisdom' | 'Adventures' | 'Everyday Joy';
  is_highlight?: number;
  created_at?: string;
}

export interface OfrendaOffering {
  id: number;
  loved_one_id: number;
  title: string;
  item_type: 'marigold' | 'pan_de_muerto' | 'food' | 'beverage' | 'keepsake' | 'calavera' | 'music' | 'photo';
  icon_name: string;
  custom_image_url?: string;
  tier: 1 | 2 | 3;
  dedication_note?: string;
  placed_by: string;
  created_at?: string;
}

export interface OfrendaCandle {
  id: number;
  loved_one_id: number;
  lit_by: string;
  message?: string;
  candle_type: 'cempasuchil_gold' | 'classic_amber' | 'eternal_white' | 'violet_prayer';
  is_lit: number;
  lit_at?: string;
}

export interface QACitation {
  title: string;
  date?: string;
  type?: string;
  excerpt?: string;
}

export interface QALog {
  id: number;
  loved_one_id: number;
  question: string;
  answer: string;
  cited_sources: QACitation[];
  created_at: string;
}

export interface SystemStatus {
  status: string;
  app_name: string;
  version: string;
  offline_ready: boolean;
  local_storage: {
    database: string;
    uploads_folder: string;
  };
  stats: {
    users: number;
    loved_ones: number;
    audio_recordings: number;
    stories: number;
    vault_items: number;
    lit_candles: number;
  };
  ai_subsystems: {
    ollama: {
      available: boolean;
      url: string;
      target_model: string;
      has_target_model: boolean;
      installed_models: string[];
      message: string;
    };
    whisper: {
      installed: boolean;
      model: string;
      status: string;
    };
  };
}
