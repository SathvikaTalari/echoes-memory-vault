import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Play, Pause, RotateCcw, UploadCloud, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '../services/api';

interface AudioRecorderProps {
  lovedOneId: number;
  onSuccess?: (recording: any, transcription: any) => void;
}

export const AudioRecorder: React.FC<AudioRecorderProps> = ({ lovedOneId, onSuccess }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Form fields
  const [title, setTitle] = useState('');
  const [recordedDate, setRecordedDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [autoTranscribe, setAutoTranscribe] = useState(true);

  // Audio refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<number | null>(null);
  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const visualizerCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (audioContextRef.current) audioContextRef.current.close().catch(() => {});
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  const drawVisualizer = () => {
    const canvas = visualizerCanvasRef.current;
    const analyser = analyserRef.current;
    if (!canvas || !analyser) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const render = () => {
      animFrameRef.current = requestAnimationFrame(render);
      analyser.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / 32) - 2;
      let x = 0;

      for (let i = 0; i < 32; i++) {
        // Average small chunks for smoother visualization
        const chunkIndex = Math.floor(i * (bufferLength / 32));
        const val = dataArray[chunkIndex];
        const barHeight = Math.max(4, (val / 255) * canvas.height * 0.9);

        // Warm candlelight gradient: amber to marigold
        const grad = ctx.createLinearGradient(0, canvas.height, 0, canvas.height - barHeight);
        grad.addColorStop(0, '#f59e0b');
        grad.addColorStop(0.6, '#ea580c');
        grad.addColorStop(1, '#fde68a');

        ctx.fillStyle = grad;
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

        x += barWidth + 2;
      }
    };

    render();
  };

  const startRecording = async () => {
    setError(null);
    setStatusMessage(null);
    audioChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true
        } 
      });

      // Set up audio context for real-time visualizer
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      audioContextRef.current = audioCtx;
      analyserRef.current = analyser;

      drawVisualizer();

      // Determine supported mime type
      const mimeTypes = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/wav'];
      let selectedMime = '';
      for (const mime of mimeTypes) {
        if (MediaRecorder.isTypeSupported(mime)) {
          selectedMime = mime;
          break;
        }
      }

      const recorder = new MediaRecorder(stream, selectedMime ? { mimeType: selectedMime } : undefined);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const mime = selectedMime || 'audio/webm';
        const finalBlob = new Blob(audioChunksRef.current, { type: mime });
        setAudioBlob(finalBlob);
        const url = URL.createObjectURL(finalBlob);
        setAudioUrl(url);

        // Stop all tracks in stream
        stream.getTracks().forEach(track => track.stop());
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      };

      recorder.start(250);
      setIsRecording(true);
      setIsPaused(false);
      setRecordingTime(0);

      timerIntervalRef.current = window.setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (err: any) {
      console.error("Microphone error:", err);
      setError("Microphone access was denied or is unavailable. Please check browser microphone permissions.");
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      if (!isPaused) {
        mediaRecorderRef.current.pause();
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        setIsPaused(true);
      } else {
        mediaRecorderRef.current.resume();
        timerIntervalRef.current = window.setInterval(() => {
          setRecordingTime(prev => prev + 1);
        }, 1000);
        setIsPaused(false);
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      setIsRecording(false);
      setIsPaused(false);
    }
  };

  const resetRecording = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingTime(0);
    setIsRecording(false);
    setIsPaused(false);
    setError(null);
    setStatusMessage(null);
  };

  const togglePreview = () => {
    if (!audioPreviewRef.current) return;
    if (isPlayingPreview) {
      audioPreviewRef.current.pause();
      setIsPlayingPreview(false);
    } else {
      audioPreviewRef.current.play();
      setIsPlayingPreview(true);
    }
  };

  const handleSaveAndTranscribe = async () => {
    if (!audioBlob) return;
    setUploading(true);
    setError(null);
    setStatusMessage(autoTranscribe ? "Archiving audio & transcribing with local Whisper AI..." : "Saving audio archive...");

    try {
      const finalTitle = title.trim() || `Voice Memory (${new Date().toLocaleDateString()})`;
      const res = await api.uploadAudio(lovedOneId, audioBlob, finalTitle, recordedDate, notes, autoTranscribe);

      setStatusMessage("Memory saved! Transcribed successfully by local Whisper.");
      setTimeout(() => {
        if (onSuccess) onSuccess(res.recording, res.transcription);
        resetRecording();
        setTitle('');
        setNotes('');
      }, 1200);
    } catch (err: any) {
      setError(err.message || "Failed to process audio recording.");
    } finally {
      setUploading(false);
    }
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="parchment-card rounded-2xl p-6 sm:p-8 border border-amber-600/30 shadow-ofrenda">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-700 flex items-center justify-center shadow-candle-sm">
          <Mic className="w-5 h-5 text-amber-50" />
        </div>
        <div>
          <h3 className="font-playfair text-2xl font-bold text-amber-100">Live Voice Recorder</h3>
          <p className="text-sm text-amber-300/70">Record oral histories, reminiscences, or family tales in high fidelity</p>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-950/60 border border-red-700/50 flex items-center gap-3 text-red-200 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {statusMessage && (
        <div className="mb-6 p-4 rounded-xl bg-amber-950/60 border border-amber-600/50 flex items-center gap-3 text-amber-200 text-sm animate-pulse">
          <Sparkles className="w-5 h-5 flex-shrink-0 text-amber-400" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Visualizer & Recording status */}
      <div className="bg-obsidian-900/90 rounded-xl p-6 border border-amber-900/40 mb-6 flex flex-col items-center justify-center min-h-[140px] relative overflow-hidden">
        {isRecording ? (
          <div className="w-full flex flex-col items-center">
            <canvas ref={visualizerCanvasRef} width={380} height={60} className="w-full max-w-sm mb-3" />
            <div className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full bg-red-500 ${isPaused ? '' : 'animate-ping'}`} />
              <span className="font-mono text-2xl font-bold text-amber-200 tracking-wider">
                {formatSeconds(recordingTime)}
              </span>
              {isPaused && <span className="text-xs uppercase bg-amber-950 text-amber-400 px-2 py-0.5 rounded border border-amber-700/50">Paused</span>}
            </div>
          </div>
        ) : audioUrl ? (
          <div className="w-full flex flex-col items-center">
            <p className="text-xs text-amber-400/80 mb-2 font-mono">RECORDING CAPTURED ({formatSeconds(recordingTime)})</p>
            <audio 
              ref={audioPreviewRef} 
              src={audioUrl} 
              onEnded={() => setIsPlayingPreview(false)} 
              className="hidden" 
            />
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={togglePreview}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 text-sm font-medium transition-all"
              >
                {isPlayingPreview ? <Pause className="w-4 h-4 text-amber-400" /> : <Play className="w-4 h-4 text-amber-400" />}
                {isPlayingPreview ? 'Pause Preview' : 'Listen to Preview'}
              </button>
              <button
                type="button"
                onClick={resetRecording}
                className="flex items-center gap-1.5 px-3 py-2 text-stone-400 hover:text-stone-200 text-xs transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Discard & Re-record
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-2 text-amber-400">
              <Mic className="w-6 h-6 opacity-75" />
            </div>
            <p className="text-sm text-stone-300">Ready to record. Click below to begin capturing oral history.</p>
            <p className="text-xs text-stone-500 mt-1">Processed locally on your machine with Whisper AI.</p>
          </div>
        )}
      </div>

      {/* Control buttons */}
      <div className="flex items-center justify-center gap-4 mb-6">
        {!isRecording && !audioUrl && (
          <button
            type="button"
            onClick={startRecording}
            className="flex items-center gap-3 px-8 py-3.5 rounded-full bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-medium shadow-candle-sm hover:shadow-candle-md transition-all transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <span className="w-3 h-3 rounded-full bg-white animate-pulse" />
            <span>Start Voice Recording</span>
          </button>
        )}

        {isRecording && (
          <>
            <button
              type="button"
              onClick={pauseRecording}
              className="flex items-center gap-2 px-5 py-3 rounded-full bg-stone-800 hover:bg-stone-700 text-amber-200 border border-stone-600 text-sm font-medium transition"
            >
              {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
              {isPaused ? 'Resume' : 'Pause'}
            </button>
            <button
              type="button"
              onClick={stopRecording}
              className="flex items-center gap-2 px-6 py-3 rounded-full bg-red-600 hover:bg-red-500 text-white text-sm font-semibold shadow-md transition"
            >
              <Square className="w-4 h-4 fill-white" />
              Finish Recording
            </button>
          </>
        )}
      </div>

      {/* Save metadata form (Shown once audio is recorded) */}
      {audioUrl && (
        <div className="pt-4 border-t border-amber-900/30 space-y-4">
          <div>
            <label className="block text-xs font-medium text-amber-300/80 mb-1">Recording Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Memories of the Old Farmhouse & Summer Harvest"
              className="w-full bg-obsidian-900 border border-amber-900/60 rounded-xl px-4 py-2.5 text-sm text-amber-100 placeholder:text-stone-600 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-amber-300/80 mb-1">Approximate Memory Date</label>
              <input
                type="date"
                value={recordedDate}
                onChange={(e) => setRecordedDate(e.target.value)}
                className="w-full bg-obsidian-900 border border-amber-900/60 rounded-xl px-4 py-2.5 text-sm text-amber-100 focus:outline-none focus:border-amber-500"
              />
            </div>
            <div className="flex items-center gap-3 pt-6">
              <input
                type="checkbox"
                id="autoTranscribe"
                checked={autoTranscribe}
                onChange={(e) => setAutoTranscribe(e.target.checked)}
                className="w-4 h-4 accent-amber-500 rounded bg-obsidian-900"
              />
              <label htmlFor="autoTranscribe" className="text-xs text-amber-200/90 cursor-pointer flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Auto-transcribe with local Whisper AI
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-amber-300/80 mb-1">Archival Notes / Context</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Mention family members present, tape cassette label, or background details..."
              className="w-full bg-obsidian-900 border border-amber-900/60 rounded-xl px-4 py-2 text-sm text-amber-100 placeholder:text-stone-600 focus:outline-none focus:border-amber-500 resize-none"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="button"
              disabled={uploading}
              onClick={handleSaveAndTranscribe}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-medium text-sm shadow-candle-sm hover:shadow-candle-md transition disabled:opacity-50"
            >
              {uploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Transcribing with Whisper...</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4" />
                  <span>Save to Memory Vault</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
