import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import {
  ChevronLeft,
  Activity,
  AlertTriangle,
  Zap,
  Info,
  Upload,
  FileVideo,
  Mic,
  ShieldCheck,
  Clock,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../auth/AuthContext';
import { submitReport } from '../../infra/reportService';

type Step = 'upload' | 'review' | 'submitting' | 'success';
type EvidenceKind = 'audio' | 'video';
type NoiseType = 'Music' | 'Construction' | 'Traffic' | 'Fireworks' | 'Other';

export function Report() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const noiseTypes = useMemo(
    () => [
      { id: 'Music' as const, label: 'DJ/Music', icon: Activity },
      { id: 'Construction' as const, label: 'Construction', icon: AlertTriangle },
      { id: 'Traffic' as const, label: 'Traffic', icon: Zap },
      { id: 'Fireworks' as const, label: 'Fireworks', icon: AlertTriangle },
      { id: 'Other' as const, label: 'Other Illegal Noise', icon: Info },
    ],
    []
  );

  const [step, setStep] = useState<Step>('upload');
  const [selectedType, setSelectedType] = useState<NoiseType | null>(null);
  const [notes, setNotes] = useState('');

  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);

  const [audioPreviewUrl, setAudioPreviewUrl] = useState<string | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);

  const [incidentTimeLocal, setIncidentTimeLocal] = useState(() => toLocalInputValue(new Date()));
  const [locationHint, setLocationHint] = useState<string>('');
  const [reportId, setReportId] = useState<string>('');

  useEffect(() => {
    if (audioFile) {
      const url = URL.createObjectURL(audioFile);
      setAudioPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setAudioPreviewUrl(null);
  }, [audioFile]);

  useEffect(() => {
    if (videoFile) {
      const url = URL.createObjectURL(videoFile);
      setVideoPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setVideoPreviewUrl(null);
  }, [videoFile]);

  const canProceed = selectedType !== null && (audioFile !== null || videoFile !== null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePickFile = (kind: EvidenceKind) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (kind === 'audio') setAudioFile(file);
    if (kind === 'video') setVideoFile(file);
  };

  const handleSubmit = async () => {
    if (!user) return;
    if (!selectedType) return;
    if (!audioFile && !videoFile) return;

    setIsSubmitting(true);
    try {
      const coordinates = await getGpsCoordinates();
      const gpsLabel = `S${coordinates.lat.toFixed(4)}, E${coordinates.lng.toFixed(4)}`;
      const locationName = locationHint.trim() ? locationHint.trim() : gpsLabel;
      const incidentTimeIso = new Date(incidentTimeLocal).toISOString();

      const id = await submitReport({
        type: selectedType,
        summary: notes || `Citizen report of ${selectedType} noise disturbance.`,
        coordinates,
        location: locationName,
        incidentTimeIso,
        audioBlob: audioFile,
        videoBlob: videoFile,
      });

      setReportId(id);
      setStep('success');
    } catch (err) {
      console.error('Submit failed', err);
      alert('Submission failed. Please try again.');
      setStep('review');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-black text-black dark:text-white transition-colors duration-300">
      <header className="p-6 flex items-center justify-between border-b border-black/10 dark:border-white/10 bg-white/80 dark:bg-black/80 backdrop-blur-md sticky top-0 z-50">
        <button
          onClick={() => navigate(-1)}
          className="p-3 rounded-2xl hover:bg-black/5 dark:hover:bg-white/5 transition-all active:scale-90"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-black uppercase tracking-tighter italic">Operational Unit</h1>
        <div className="w-12" />
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full p-6 md:p-10 flex flex-col gap-8">
        <AnimatePresence mode="wait">
          {step === 'upload' && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col gap-8"
            >
              <div className="p-8 rounded-[2.5rem] bg-zinc-50 dark:bg-zinc-900/50 border border-black/10 dark:border-white/10 shadow-inner">
                <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500">
                  Evidence Upload
                </h2>
                <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-300 font-medium">
                  Upload your audio/video sample and the incident time. We match your report against active permits
                  by location and time (not by loudness level).
                </p>

                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <EvidenceCard
                    title="Audio Evidence"
                    subtitle="Upload an audio sample"
                    kind="audio"
                    file={audioFile}
                    previewUrl={audioPreviewUrl}
                    onPick={handlePickFile('audio')}
                    onClear={() => setAudioFile(null)}
                  />
                  <EvidenceCard
                    title="Video Evidence"
                    subtitle="Upload a video sample"
                    kind="video"
                    file={videoFile}
                    previewUrl={videoPreviewUrl}
                    onPick={handlePickFile('video')}
                    onClear={() => setVideoFile(null)}
                  />
                </div>
              </div>

              <div className="p-8 rounded-[2.5rem] bg-white dark:bg-black border border-black/10 dark:border-white/10 shadow-inner">
                <label className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-400 mb-4 block">
                  Incident Time
                </label>
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-zinc-400" />
                  <input
                    type="datetime-local"
                    value={incidentTimeLocal}
                    onChange={(e) => setIncidentTimeLocal(e.target.value)}
                    className={cn(
                      "w-full px-4 py-3 rounded-xl border-2 outline-none transition-all font-medium",
                      "border-black/10 dark:border-white/10 bg-zinc-50 dark:bg-zinc-900/40 focus:border-black dark:focus:border-white"
                    )}
                  />
                </div>
              </div>

              <div className="p-8 rounded-[2.5rem] bg-white dark:bg-black border border-black/10 dark:border-white/10 shadow-inner">
                <label className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-400 mb-4 block ml-1">
                  Location Label (Optional)
                </label>
                <input
                  type="text"
                  value={locationHint}
                  onChange={(e) => setLocationHint(e.target.value)}
                  placeholder="e.g. Main St & 4th Ave"
                  className={cn(
                    "w-full px-4 py-3 rounded-xl border-2 outline-none transition-all font-medium",
                    "border-black/10 dark:border-white/10 bg-zinc-50 dark:bg-zinc-900/40 focus:border-black dark:focus:border-white"
                  )}
                />
                <div className="mt-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400 opacity-70">
                  If empty, we use GPS coordinates for permit matching.
                </div>
              </div>

              <div className="p-8 rounded-[2.5rem] bg-white dark:bg-black border border-black/10 dark:border-white/10 shadow-inner">
                <label className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-400 mb-6 block ml-1">
                  Select Noise Category
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {noiseTypes.map((type) => (
                    <button
                      key={type.id}
                      onClick={() => setSelectedType(type.id)}
                      className={cn(
                        "p-6 rounded-[2rem] border-2 transition-all flex flex-col items-center space-y-4 group",
                        selectedType === type.id
                          ? "bg-black dark:bg-white border-black dark:border-white text-white dark:text-black shadow-2xl scale-[1.03]"
                          : "bg-white dark:bg-zinc-900 border-zinc-100 dark:border-white/5 text-zinc-400 hover:border-black/30 dark:hover:border-white/30 hover:text-black dark:hover:text-white"
                      )}
                    >
                      <type.icon
                        className={cn(
                          "w-8 h-8 transition-transform group-hover:scale-110",
                          selectedType === type.id
                            ? "text-white dark:text-black"
                            : "text-zinc-200 group-hover:text-black dark:group-hover:text-white"
                        )}
                      />
                      <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                        {type.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  disabled={!canProceed}
                  onClick={() => setStep('review')}
                  className={cn(
                    "flex-1 py-7 rounded-[2rem] font-black uppercase tracking-widest text-[10px] transition-all shadow-2xl",
                    canProceed
                      ? "bg-black dark:bg-white text-white dark:text-black hover:scale-[1.02] active:scale-[0.98]"
                      : "bg-zinc-100 dark:bg-zinc-900 text-zinc-300 dark:text-zinc-700 cursor-not-allowed border-2 border-zinc-200 dark:border-white/5"
                  )}
                >
                  CONTINUE
                </button>
              </div>
            </motion.div>
          )}

          {step === 'review' && (
            <motion.div
              key="review"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col gap-8"
            >
              <div className="p-8 rounded-[2.5rem] bg-zinc-900 text-white shadow-2xl">
                <div className="flex items-start justify-between gap-6">
                  <div>
                    <h2 className="text-[10px] font-black uppercase tracking-[0.4em] opacity-60">
                      AI Permit Match (Pre-Police Suggestion)
                    </h2>
                    <p className="mt-3 text-sm text-white/70 font-medium">
                      We’ll check whether your incident time and location align with existing permits. Loudness level
                      is not used for the verdict.
                    </p>
                  </div>
                  <div className="px-4 py-2 rounded-xl bg-white/10 border border-white/10">
                    <span className="text-[10px] font-black uppercase tracking-widest">
                      Evidence Ready
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-8 rounded-[2.5rem] bg-white dark:bg-black border border-black/10 dark:border-white/10 shadow-inner">
                <label className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-400 mb-4 block ml-1">
                  Operation Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Event at the main entrance; noise started at 9:15pm near sector 7."
                  className="w-full p-6 rounded-[2rem] bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-white/5 focus:border-black dark:focus:border-white transition-all outline-none text-lg min-h-[180px] font-medium placeholder:text-zinc-300 shadow-inner"
                />

                <div className="mt-6 text-xs font-bold text-zinc-400 uppercase tracking-widest">
                  Incident: {new Date(incidentTimeLocal).toLocaleString()}
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setStep('upload')}
                  className="flex-1 py-7 rounded-[2rem] border-2 border-black/10 dark:border-white/10 font-black uppercase tracking-widest text-[10px] hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all"
                >
                  Back
                </button>

                <button
                  onClick={async () => {
                    setStep('submitting');
                    await handleSubmit();
                  }}
                  disabled={isSubmitting}
                  className={cn(
                    "flex-[2] py-7 rounded-[2rem] font-black text-xl uppercase tracking-widest transition-all shadow-2xl",
                    "bg-black dark:bg-white text-white dark:text-black hover:scale-[1.02] active:scale-[0.98]"
                  )}
                >
                  TRANSMIT REPORT
                </button>
              </div>
            </motion.div>
          )}

          {step === 'submitting' && (
            <motion.div
              key="submitting"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col items-center justify-center space-y-8 py-20"
            >
              <div className="relative w-20 h-20">
                <motion.div
                  className="absolute inset-0 border-4 border-black/10 dark:border-white/10 rounded-[2rem]"
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <ShieldCheck className="w-10 h-10 animate-pulse" />
                </div>
              </div>
              <div className="text-center space-y-2">
                <h2 className="text-3xl font-black uppercase tracking-tighter italic">Checking permits...</h2>
                <p className="text-zinc-400 text-[10px] font-black uppercase tracking-[0.4em] animate-pulse">
                  Uploading evidence + matching time/location
                </p>
              </div>
            </motion.div>
          )}

          {step === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="flex-1 flex flex-col items-center justify-center text-center py-20 space-y-10"
            >
              <div className="w-28 h-28 bg-black dark:bg-white text-white dark:text-black rounded-[2.5rem] flex items-center justify-center shadow-2xl rotate-12">
                <ShieldCheck className="w-14 h-14" />
              </div>

              <div className="space-y-4">
                <h2 className="text-5xl font-black uppercase tracking-tighter leading-none italic">Log Successful.</h2>
                <div className="flex items-center justify-center gap-4 text-[10px] font-black uppercase tracking-[0.5em] text-zinc-400">
                  <span>Report ID</span>
                  <span className="text-black dark:text-white underline underline-offset-8">#{reportId}</span>
                </div>
                <p className="text-zinc-500 font-medium max-w-md">
                  Your report is queued for HQ verification. The final verdict is decided on ground by authorities.
                </p>
              </div>

              <button
                onClick={() => navigate('/command')}
                className="w-full md:w-auto px-16 py-6 bg-black dark:bg-white text-white dark:text-black rounded-2xl font-black uppercase tracking-widest hover:scale-[1.02] transition-all shadow-2xl active:scale-[0.98]"
              >
                View Command Center
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

function toLocalInputValue(d: Date) {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

async function getGpsCoordinates(): Promise<{ lat: number; lng: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => reject(err),
      { timeout: 7000 }
    );
  });
}

function EvidenceCard(props: {
  title: string;
  subtitle: string;
  kind: EvidenceKind;
  file: File | null;
  previewUrl: string | null;
  onPick: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClear: () => void;
}) {
  const { title, subtitle, kind, file, previewUrl, onPick, onClear } = props;
  const Icon = kind === 'audio' ? Mic : FileVideo;

  return (
    <div
      className={cn(
        "w-full p-7 rounded-[2.5rem] border-2 transition-all shadow-inner",
        file
          ? "border-black/20 dark:border-white/10 bg-white dark:bg-zinc-900"
          : "border-black/10 dark:border-white/10 bg-zinc-50 dark:bg-zinc-900/40"
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-[1.8rem] bg-black/5 dark:bg-white/10 flex items-center justify-center">
              <Icon className="w-6 h-6 text-zinc-500" />
            </div>
            <div>
              <div className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{title}</div>
              <div className="text-sm font-medium text-zinc-600 dark:text-zinc-300 mt-1">{subtitle}</div>
            </div>
          </div>
        </div>
        {file && (
          <button
            onClick={onClear}
            className="text-[10px] font-black text-red-500 uppercase tracking-widest underline decoration-2 underline-offset-4"
          >
            Remove
          </button>
        )}
      </div>

      <div className="mt-6">
        <input
          type="file"
          accept={kind === 'audio' ? 'audio/*' : 'video/*'}
          onChange={onPick}
          className="hidden"
          id={`evidence-${kind}`}
        />

        <label
          htmlFor={`evidence-${kind}`}
          className={cn(
            "w-full flex flex-col items-center justify-center gap-4 py-10 rounded-[2rem] cursor-pointer transition-all",
            file
              ? "bg-black/5 dark:bg-white/10 text-black dark:text-white border border-black/10 dark:border-white/10"
              : "bg-white dark:bg-zinc-800 border-2 border-dashed border-black/10 dark:border-white/10 text-zinc-500 hover:border-black/30 dark:hover:border-white/30"
          )}
        >
          {file ? (
            <div className="text-center">
              <div className="text-xl font-black uppercase tracking-tighter">{file.name}</div>
              <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-2">
                Selected
              </div>
            </div>
          ) : (
            <>
              <Upload className="w-10 h-10 text-zinc-400" />
              <div className="text-xs font-black uppercase tracking-widest text-zinc-500">
                Click to upload {kind}
              </div>
            </>
          )}
        </label>
      </div>

      {previewUrl && (
        <div className="mt-6">
          {kind === 'audio' ? (
            <audio controls src={previewUrl} className="w-full h-10" />
          ) : (
            <video controls src={previewUrl} className="w-full aspect-video object-cover rounded-xl" />
          )}
        </div>
      )}
    </div>
  );
}

