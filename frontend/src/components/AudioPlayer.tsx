import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Sparkles, BookOpen, Clock, FileText } from 'lucide-react';
import { AudioRecording, TranscriptSegment } from '../types';
import { api } from '../services/api';

interface AudioPlayerProps {
  recording: AudioRecording;
  onWeaveStory?: (recording: AudioRecording) => void;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ recording, onWeaveStory }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(recording.duration_seconds || 0);
  const [isMuted, setIsMuted] = useState(false);
  const [activeSegmentIndex, setActiveSegmentIndex] = useState<number | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const streamUrl = api.getAudioStreamUrl(recording.id);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);

      // Match current time to segment
      if (recording.transcript_segments && recording.transcript_segments.length > 0) {
        const idx = recording.transcript_segments.findIndex(
          seg => audio.currentTime >= seg.start && audio.currentTime <= seg.end
        );
        setActiveSegmentIndex(idx !== -1 ? idx : null);
      }
    };

    const handleLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      setActiveSegmentIndex(null);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [recording]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().then(() => setIsPlaying(true)).catch(e => console.error(e));
    }
  };

  const seekTo = (seconds: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = seconds;
    setCurrentTime(seconds);
    if (!isPlaying) {
      audio.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    seekTo(Number(e.target.value));
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs)) return "00:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="parchment-card rounded-2xl p-6 border border-amber-900/40 shadow-md">
      <audio ref={audioRef} src={streamUrl} preload="metadata" />

      {/* Header with Title & Date */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h4 className="font-playfair text-lg font-bold text-amber-100 flex items-center gap-2">
            <span>{recording.title}</span>
            {recording.story_count && recording.story_count > 0 ? (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-900/60 text-amber-300 border border-amber-700/50">
                Woven into Story
              </span>
            ) : null}
          </h4>
          <p className="text-xs text-amber-400/60 flex items-center gap-2 mt-0.5">
            <Clock className="w-3.5 h-3.5" />
            <span>{recording.recorded_date || 'Undated oral record'}</span>
            {recording.notes && <span>• {recording.notes}</span>}
          </p>
        </div>

        {onWeaveStory && (
          <button
            type="button"
            onClick={() => onWeaveStory(recording)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-medium transition self-start sm:self-auto"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Weave Story with AI</span>
          </button>
        )}
      </div>

      {/* Controls Bar */}
      <div className="bg-obsidian-900/80 rounded-xl p-4 border border-amber-900/30 mb-5">
        <div className="flex items-center gap-4 mb-2">
          <button
            type="button"
            onClick={togglePlay}
            className="w-10 h-10 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white flex items-center justify-center shadow-candle-sm transition transform active:scale-95 flex-shrink-0"
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
          </button>

          {/* Time & Progress */}
          <div className="flex-1">
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={handleSliderChange}
              className="w-full h-1.5 bg-stone-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
            <div className="flex justify-between text-[11px] text-stone-400 font-mono mt-1">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={toggleMute}
            className="p-2 text-stone-400 hover:text-amber-300 transition"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Synchronized Transcript View */}
      {recording.transcript_segments && recording.transcript_segments.length > 0 ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-medium text-amber-300/80 mb-2">
            <FileText className="w-3.5 h-3.5 text-amber-400" />
            <span>Synchronized Transcript (Click any line to seek)</span>
          </div>
          <div className="max-h-48 overflow-y-auto space-y-1.5 pr-2">
            {recording.transcript_segments.map((seg, idx) => (
              <div
                key={idx}
                onClick={() => seekTo(seg.start)}
                className={`p-2.5 rounded-lg text-sm transition-all cursor-pointer ${
                  activeSegmentIndex === idx
                    ? 'bg-amber-950/70 border border-amber-500/50 text-amber-100 shadow-candle-sm font-medium'
                    : 'bg-obsidian-900/40 hover:bg-obsidian-900/80 text-stone-300 border border-transparent'
                }`}
              >
                <div className="flex items-start gap-2">
                  <span className="text-[11px] font-mono text-amber-400/60 pt-0.5 flex-shrink-0">
                    [{formatTime(seg.start)}]
                  </span>
                  <p className="leading-relaxed">{seg.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : recording.transcript_raw ? (
        <div className="bg-obsidian-900/40 rounded-xl p-4 border border-amber-900/20">
          <p className="text-xs font-medium text-amber-400/80 mb-1">Archived Transcript:</p>
          <p className="text-sm text-stone-300 leading-relaxed font-serif italic">
            "{recording.transcript_raw}"
          </p>
        </div>
      ) : (
        <p className="text-xs text-stone-500 italic">No transcript generated yet.</p>
      )}
    </div>
  );
};
