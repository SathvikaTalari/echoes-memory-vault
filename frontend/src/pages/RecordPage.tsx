import React, { useState, useEffect } from 'react';
import { Mic, UploadCloud, FileAudio, Sparkles, Filter, RefreshCw, AlertCircle } from 'lucide-react';
import { useProfile } from '../context/ProfileContext';
import { api } from '../services/api';
import { AudioRecording } from '../types';
import { AudioRecorder } from '../components/AudioRecorder';
import { AudioPlayer } from '../components/AudioPlayer';

interface RecordPageProps {
  onWeaveStory: (recording: AudioRecording) => void;
}

export const RecordPage: React.FC<RecordPageProps> = ({ onWeaveStory }) => {
  const { activeProfile } = useProfile();
  const [recordings, setRecordings] = useState<AudioRecording[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'record' | 'upload'>('record');

  // File upload state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDate, setUploadDate] = useState('');
  const [uploadNotes, setUploadNotes] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  const loadRecordings = async () => {
    if (!activeProfile) return;
    try {
      setLoading(true);
      const res = await api.getAudioRecordings(activeProfile.id);
      setRecordings(res.recordings);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecordings();
  }, [activeProfile]);

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile || !activeProfile) return;

    setUploading(true);
    setUploadError(null);
    setUploadSuccess(null);

    try {
      const title = uploadTitle.trim() || uploadFile.name.replace(/\.[^/.]+$/, "");
      await api.uploadAudio(activeProfile.id, uploadFile, title, uploadDate, uploadNotes, true);
      setUploadSuccess("Audio memory uploaded & transcribed by local Whisper AI!");
      setUploadFile(null);
      setUploadTitle('');
      setUploadNotes('');
      await loadRecordings();
    } catch (err: any) {
      setUploadError(err.message || "Failed to upload audio file.");
    } finally {
      setUploading(false);
    }
  };

  if (!activeProfile) {
    return (
      <div className="parchment-card rounded-2xl p-12 text-center border border-amber-900/40">
        <Mic className="w-12 h-12 text-amber-500/60 mx-auto mb-3" />
        <h3 className="font-playfair text-xl font-bold text-amber-100">No Loved One Selected</h3>
        <p className="text-sm text-stone-400 mt-1">Please create or select a memorial sanctuary first.</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-950/60 border border-amber-600/30 text-amber-300 text-xs font-medium mb-2">
            <Mic className="w-3.5 h-3.5 text-amber-400" />
            <span>Oral History & Speech-to-Text</span>
          </div>
          <h2 className="font-playfair text-3xl sm:text-4xl font-bold text-amber-100">
            Voice Recordings & Whisper Transcriptions
          </h2>
          <p className="text-sm text-stone-300 mt-1 font-serif">
            Archiving genuine spoken memories of {activeProfile.name} through local open-source AI.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center bg-obsidian-900 rounded-xl p-1 border border-amber-900/40 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setTab('record')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition ${
              tab === 'record'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-stone-400 hover:text-amber-200'
            }`}
          >
            <Mic className="w-3.5 h-3.5" />
            <span>Live Mic Recording</span>
          </button>
          <button
            type="button"
            onClick={() => setTab('upload')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition ${
              tab === 'upload'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-stone-400 hover:text-amber-200'
            }`}
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>Upload Audio File</span>
          </button>
        </div>
      </div>

      {/* Input Section */}
      {tab === 'record' ? (
        <AudioRecorder
          lovedOneId={activeProfile.id}
          onSuccess={() => loadRecordings()}
        />
      ) : (
        <form onSubmit={handleFileUpload} className="parchment-card rounded-2xl p-6 sm:p-8 border border-amber-600/30 shadow-ofrenda space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-700 flex items-center justify-center shadow-candle-sm">
              <UploadCloud className="w-5 h-5 text-amber-50" />
            </div>
            <div>
              <h3 className="font-playfair text-xl font-bold text-amber-100">Upload Historical Audio Archive</h3>
              <p className="text-xs text-amber-300/70">Digitized cassette tapes, voicemails, phone memos (.wav, .mp3, .m4a, .webm, .ogg)</p>
            </div>
          </div>

          {uploadError && (
            <div className="p-4 rounded-xl bg-red-950/70 border border-red-700/50 text-red-200 text-xs">
              {uploadError}
            </div>
          )}
          {uploadSuccess && (
            <div className="p-4 rounded-xl bg-amber-950/70 border border-amber-600/50 text-amber-200 text-xs flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>{uploadSuccess}</span>
            </div>
          )}

          <div className="border-2 border-dashed border-amber-900/60 rounded-xl p-8 text-center hover:border-amber-500/60 transition bg-obsidian-900/40 cursor-pointer relative">
            <input
              type="file"
              accept="audio/*"
              onChange={(e) => setUploadFile(e.target.files ? e.target.files[0] : null)}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
            <FileAudio className="w-10 h-10 text-amber-400/80 mx-auto mb-2" />
            {uploadFile ? (
              <p className="text-sm font-semibold text-amber-200">{uploadFile.name} ({(uploadFile.size / 1024 / 1024).toFixed(2)} MB)</p>
            ) : (
              <div>
                <p className="text-sm font-semibold text-amber-100">Click or Drag & Drop audio file here</p>
                <p className="text-xs text-stone-400 mt-1">Supports WAV, MP3, M4A, WEBM, OGG</p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-amber-300/80 mb-1">Recording Title</label>
              <input
                type="text"
                value={uploadTitle}
                onChange={(e) => setUploadTitle(e.target.value)}
                placeholder="e.g. 1984 Thanksgiving Kitchen Story"
                className="w-full bg-obsidian-900 border border-amber-900/60 rounded-xl px-4 py-2.5 text-sm text-amber-100 focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs text-amber-300/80 mb-1">Estimated Recording Date</label>
              <input
                type="date"
                value={uploadDate}
                onChange={(e) => setUploadDate(e.target.value)}
                className="w-full bg-obsidian-900 border border-amber-900/60 rounded-xl px-4 py-2.5 text-sm text-amber-100 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-amber-300/80 mb-1">Archival Notes</label>
            <textarea
              rows={2}
              value={uploadNotes}
              onChange={(e) => setUploadNotes(e.target.value)}
              placeholder="Background notes, people in the room, cassette label..."
              className="w-full bg-obsidian-900 border border-amber-900/60 rounded-xl px-4 py-2 text-sm text-amber-100 focus:outline-none focus:border-amber-500 resize-none"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={uploading || !uploadFile}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-medium text-sm shadow-candle-sm transition disabled:opacity-50"
            >
              {uploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Transcribing with Whisper AI...</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4" />
                  <span>Upload & Transcribe</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Archives List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-playfair text-2xl font-bold text-amber-100 flex items-center gap-2">
            <span>Preserved Oral Archives</span>
            <span className="text-sm font-sans px-2.5 py-0.5 rounded-full bg-amber-950/60 border border-amber-700/40 text-amber-300">
              {recordings.length}
            </span>
          </h3>
          <button
            onClick={loadRecordings}
            className="flex items-center gap-1.5 text-xs text-stone-400 hover:text-amber-300 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {recordings.length === 0 ? (
          <div className="parchment-card rounded-2xl p-10 text-center border border-amber-900/30">
            <p className="text-sm text-stone-400 font-serif italic">
              No voice recordings preserved yet for {activeProfile.name}.
            </p>
            <p className="text-xs text-stone-500 mt-1">
              Start by recording a spoken memory above or uploading an audio tape!
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {recordings.map((rec) => (
              <AudioPlayer
                key={rec.id}
                recording={rec}
                onWeaveStory={onWeaveStory}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
