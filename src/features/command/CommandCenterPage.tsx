import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  AlertCircle,
  ChevronRight,
  Clock,
  MapPin,
  ShieldCheck,
  Trash2,
  Upload,
  Video,
  Volume2,
  Zap,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../auth/AuthContext';
import type { NoiseReport } from '../../domain/types';
import { seedInitialData, subscribeToPoliceFeed, updateReportStatus } from '../../infra/reportService';

type StatusFilter = NoiseReport['status'] | 'All';

export function CommandCenter() {
  const { user } = useAuth();

  const [reports, setReports] = useState<NoiseReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<NoiseReport | null>(null);
  const [filter, setFilter] = useState<StatusFilter>('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToPoliceFeed((data) => {
      setReports(data);
      setLoading(false);

      if (selectedReport) {
        const updated = data.find((r) => r.id === selectedReport.id);
        if (updated) setSelectedReport(updated);
      }
    });
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedReport]);

  const filteredReports = useMemo(() => {
    if (filter === 'All') return reports;
    return reports.filter((r) => r.status === filter);
  }, [filter, reports]);

  const handleStatusUpdate = async (id: string, status: NoiseReport['status']) => {
    try {
      await updateReportStatus(id, status);
    } catch (err) {
      console.error('Status update failed', err);
    }
  };

  return (
    <div className="min-h-screen flex bg-white dark:bg-black text-black dark:text-white transition-colors duration-300">
      {/* Left: Feed */}
      <div className="w-[420px] border-r border-black/5 dark:border-white/5 bg-white dark:bg-black">
        <div className="p-10 border-b border-black/5 dark:border-white/5 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <AlertCircle className="w-6 h-6" />
              <h2 className="text-3xl font-black uppercase tracking-tighter italic">Tactical Feed</h2>
            </div>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-400 mt-2">
              AI suggestions queued for HQ verification
            </p>
          </div>

          <div className="flex flex-col items-end gap-3">
            <button
              onClick={async () => {
                await seedInitialData();
              }}
              className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] transition-all shadow-sm"
            >
              Seed HQ Data
            </button>
            {loading && <Zap className="w-5 h-5 animate-spin text-zinc-400" />}
          </div>
        </div>

        <div className="p-6">
          <div className="flex p-1.5 bg-zinc-50 dark:bg-zinc-900 rounded-[1.5rem] border border-black/5 dark:border-white/5 shadow-inner">
            {(['All', 'Pending', 'Verified', 'Resolved', 'Dismissed'] as StatusFilter[]).map((t) => (
              <button
                key={t}
                onClick={() => setFilter(t)}
                className={cn(
                  'flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all',
                  filter === t
                    ? 'bg-white dark:bg-zinc-800 text-black dark:text-white shadow-xl'
                    : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
                )}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="px-8 pb-10 overflow-y-auto max-h-[calc(100vh-150px)] custom-scrollbar">
          {filteredReports.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-12 space-y-6 opacity-20">
              <Zap className="w-20 h-20" />
              <p className="text-[10px] font-black uppercase tracking-[0.4em]">
                Listening for Disturbances...
              </p>
            </div>
          ) : (
            filteredReports.map((report) => (
              <motion.div
                key={report.id}
                onClick={() => setSelectedReport(report)}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  'p-8 rounded-[2.5rem] border-2 transition-all cursor-pointer group relative mb-6',
                  selectedReport?.id === report.id
                    ? 'bg-zinc-50 dark:bg-zinc-900/50 border-black dark:border-white shadow-2xl scale-[1.01]'
                    : 'bg-white dark:bg-zinc-900 border-zinc-100 dark:border-white/5 hover:border-black/30 dark:hover:border-white/30'
                )}
              >
                <div className="flex items-start justify-between gap-6">
                  <div>
                    <div className="flex items-center gap-3">
                      <span
                        className={cn(
                          'w-3.5 h-3.5 rounded-full',
                          report.riskLevel === 'High'
                            ? 'bg-red-600'
                            : report.riskLevel === 'Medium'
                              ? 'bg-amber-500'
                              : 'bg-black dark:bg-white'
                        )}
                      />
                      <div className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                        {report.ai.verdict === 'LikelyPermitted' ? 'Permit Match' : 'Permit Mismatch'}
                      </div>
                    </div>
                    <h3 className="text-2xl font-black uppercase tracking-tight italic mt-3">
                      #{report.id.slice(0, 6).toUpperCase()} {report.type}
                    </h3>
                    <p className="text-xs font-bold flex items-center text-zinc-500 mt-3 uppercase tracking-[0.2em]">
                      <MapPin className="w-3 h-3 mr-2" />
                      {report.location}
                    </p>
                  </div>
                  <ChevronRight className="w-6 h-6 text-zinc-400 group-hover:translate-x-2 transition-all" />
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-black/5 dark:border-white/5 pt-4">
                  <div className="flex items-center gap-3">
                    <Clock className="w-4 h-4 text-zinc-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                      {new Date(report.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <span
                    className={cn(
                      'px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest',
                      report.status === 'Pending'
                        ? 'bg-zinc-200 dark:bg-zinc-800 text-black dark:text-zinc-400'
                        : report.status === 'Verified'
                          ? 'bg-green-500 text-white'
                          : report.status === 'Resolved'
                            ? 'bg-black dark:bg-white text-white dark:text-black'
                            : 'bg-zinc-500 text-white'
                    )}
                  >
                    {report.status}
                  </span>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Right: Detail */}
      <div className="flex-1 relative">
        <div className="p-10 max-w-3xl mx-auto">
          <div className="flex items-start justify-between gap-6 mb-8">
            <div>
              <h2 className="text-4xl font-black uppercase tracking-tighter italic">HQ Verification Panel</h2>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-400 mt-2">
                Final verdict decided by authorities on ground
              </p>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {selectedReport ? (
              <motion.div
                key={selectedReport.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-10"
              >
                {/* Evidence */}
                <section className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-400 leading-none">
                      Evidence (Audio/Video)
                    </h3>
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 opacity-60">
                      ID: {selectedReport.id.slice(0, 8)}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="rounded-[2rem] bg-zinc-50 dark:bg-zinc-900 border border-black/5 dark:border-white/5 p-6">
                      <div className="flex items-center gap-3">
                        <Volume2 className="w-5 h-5 text-zinc-600 dark:text-zinc-300" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                          Audio
                        </span>
                      </div>
                      {selectedReport.evidence.audioUrl ? (
                        <audio controls src={selectedReport.evidence.audioUrl} className="w-full mt-4" />
                      ) : (
                        <div className="mt-4 text-sm text-zinc-400">No audio uploaded.</div>
                      )}
                    </div>
                    <div className="rounded-[2rem] bg-zinc-50 dark:bg-zinc-900 border border-black/5 dark:border-white/5 p-6">
                      <div className="flex items-center gap-3">
                        <Video className="w-5 h-5 text-zinc-600 dark:text-zinc-300" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                          Video
                        </span>
                      </div>
                      {selectedReport.evidence.videoUrl ? (
                        <video controls src={selectedReport.evidence.videoUrl} className="w-full aspect-video mt-4 object-cover rounded-xl" />
                      ) : (
                        <div className="mt-4 text-sm text-zinc-400">No video uploaded.</div>
                      )}
                    </div>
                  </div>
                </section>

                {/* Notes */}
                <section className="space-y-4">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-400 leading-none">
                    Citizen Notes
                  </h3>
                  <div className="p-8 rounded-[2.5rem] bg-black text-white/90">
                    <p className="text-xl font-black uppercase tracking-tight italic">{selectedReport.summary}</p>
                  </div>
                </section>

                {/* AI Permit Verdict */}
                <section className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-400 leading-none">
                      AI Permit Match Verdict
                    </h3>
                    <Zap className="w-5 h-5 text-zinc-300" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-8 rounded-[2.5rem] bg-zinc-50 dark:bg-zinc-900 border border-black/5 dark:border-white/5">
                      <div className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">
                        AI Verdict
                      </div>
                      <div
                        className={cn(
                          'mt-3 text-4xl font-black uppercase tracking-tight',
                          selectedReport.ai.verdict === 'LikelyPermitted' ? 'text-green-600' : 'text-red-600'
                        )}
                      >
                        {selectedReport.ai.verdict === 'LikelyPermitted'
                          ? 'Likely Permitted'
                          : 'Likely Violation'}
                      </div>
                      <div className="mt-5 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                        Confidence: {(selectedReport.ai.confidence * 100).toFixed(0)}%
                      </div>
                      <div className="mt-5 text-sm text-zinc-600 dark:text-zinc-300">
                        {selectedReport.ai.rationale}
                      </div>
                    </div>

                    <div className="p-8 rounded-[2.5rem] bg-zinc-50 dark:bg-zinc-900 border border-black/5 dark:border-white/5">
                      <div className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">
                        Match Factors
                      </div>

                      <div className="mt-6 space-y-3">
                        <MatchRow
                          label="Time Matched"
                          value={selectedReport.ai.timeMatched ? 'Yes' : 'No'}
                          ok={selectedReport.ai.timeMatched}
                        />
                        <MatchRow
                          label="Location Matched"
                          value={selectedReport.ai.locationMatched ? 'Yes' : 'No'}
                          ok={selectedReport.ai.locationMatched}
                        />
                        <MatchRow
                          label="Match Score"
                          value={`${Math.round(selectedReport.ai.matchScore * 100)}%`}
                          ok={selectedReport.ai.matchScore >= 0.7}
                        />
                      </div>

                      <div className="mt-6 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                        Matched Permit IDs
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {selectedReport.ai.matchedPermitIds.length ? (
                          selectedReport.ai.matchedPermitIds.map((pid) => (
                            <span
                              key={pid}
                              className="px-4 py-2 rounded-xl bg-white/60 dark:bg-white/5 border border-black/10 dark:border-white/10 text-[10px] font-black uppercase tracking-widest text-zinc-500"
                            >
                              {pid}
                            </span>
                          ))
                        ) : (
                          <span className="text-sm text-zinc-400">No permit fully matched.</span>
                        )}
                      </div>
                    </div>
                  </div>
                </section>

                {/* Geo */}
                <section className="space-y-4">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-400 leading-none">
                    Geo Details
                  </h3>
                  <div className="p-8 rounded-[2.5rem] bg-zinc-50 dark:bg-zinc-900 border border-black/5 dark:border-white/5 flex items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                      <MapPin className="w-6 h-6 text-zinc-600 dark:text-zinc-300" />
                      <div>
                        <div className="text-xl font-black uppercase tracking-tight">{selectedReport.location}</div>
                        <div className="text-xs font-bold text-zinc-500 uppercase tracking-[0.1em] mt-1">
                          {selectedReport.coordinates.lat.toFixed(4)}, {selectedReport.coordinates.lng.toFixed(4)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                        Incident Time
                      </div>
                      <div className="text-sm font-bold text-zinc-600 dark:text-zinc-300 mt-1">
                        {new Date(selectedReport.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </section>

                {/* Actions */}
                <section className="flex gap-4 pt-4 border-t border-black/5 dark:border-white/5">
                  <button
                    onClick={() => handleStatusUpdate(selectedReport.id, 'Verified')}
                    disabled={selectedReport.status === 'Verified'}
                    className={cn(
                      'flex-1 py-6 rounded-[2rem] flex flex-col items-center justify-center gap-3 transition-all active:scale-95 shadow-sm',
                      selectedReport.status === 'Verified'
                        ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed'
                        : 'bg-black dark:bg-white text-white dark:text-black hover:scale-[1.02]'
                    )}
                  >
                    <ShieldCheck className="w-7 h-7" />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em]">Deploy Unit</span>
                  </button>

                  <button
                    onClick={() => handleStatusUpdate(selectedReport.id, 'Resolved')}
                    className="flex-1 py-6 rounded-[2rem] bg-white dark:bg-zinc-800 border-2 border-black/5 dark:border-white/5 text-black dark:text-white flex flex-col items-center justify-center gap-3 transition-all hover:bg-zinc-50 dark:hover:bg-zinc-700 active:scale-95 shadow-sm"
                  >
                    <Zap className="w-7 h-7" />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em]">Log Warning</span>
                  </button>

                  <button
                    onClick={() => handleStatusUpdate(selectedReport.id, 'Dismissed')}
                    className="flex-1 py-6 rounded-[2rem] bg-white dark:bg-zinc-800 border-2 border-black/5 dark:border-white/5 text-zinc-400 flex flex-col items-center justify-center gap-3 transition-all hover:bg-zinc-50 dark:hover:bg-zinc-700 active:scale-95 shadow-sm"
                  >
                    <Trash2 className="w-7 h-7" />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em]">Dismiss</span>
                  </button>
                </section>
              </motion.div>
            ) : (
              <div className="h-[calc(100vh-140px)] flex items-center justify-center flex-col gap-6 text-center opacity-30">
                <Upload className="w-20 h-20" />
                <p className="text-[10px] font-black uppercase tracking-[0.4em]">Select a report to inspect</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function MatchRow(props: { label: string; value: string; ok: boolean }) {
  const { label, value, ok } = props;
  return (
    <div className="flex items-center justify-between">
      <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{label}</span>
      <span
        className={cn(
          'px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border',
          ok ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
        )}
      >
        {value}
      </span>
    </div>
  );
}

