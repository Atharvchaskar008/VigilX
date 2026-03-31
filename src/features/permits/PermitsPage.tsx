import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Filter, LayoutGrid, List, Calendar, MapPin, Shield, Clock, AlertTriangle, FileText, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Permit } from '../../domain/types';
import { getPermits } from '../../infra/reportService';

export function Permits() {
  const [view, setView] = useState<'grid' | 'table'>('grid');
  const [search, setSearch] = useState('');
  const [permits, setPermits] = useState<Permit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await getPermits();
        setPermits(data);
      } catch (err) {
        console.error("Failed to load permits", err);
      }
      setLoading(false);
    }
    load();
  }, []);

  const filteredPermits = permits.filter(p => 
    p.eventName.toLowerCase().includes(search.toLowerCase()) ||
    p.organizer.toLowerCase().includes(search.toLowerCase()) ||
    p.location.toLowerCase().includes(search.toLowerCase())
  );

  const stats = [
    { label: 'Active Permits', value: permits.filter(p => p.status === 'Active').length.toString(), icon: Shield, color: 'text-zinc-400' },
    { label: 'Upcoming', value: permits.filter(p => p.status === 'Upcoming').length.toString(), icon: Clock, color: 'text-zinc-500' },
    { label: 'Total Logs', value: permits.length.toString(), icon: FileText, color: 'text-zinc-300' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 bg-white dark:bg-black text-black dark:text-white transition-colors duration-300 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-20 space-y-8 md:space-y-0">
        <div>
          <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tighter mb-6 italic">Public Permits.</h1>
          <p className="text-zinc-500 font-bold uppercase tracking-[0.2em] text-[10px] max-w-xl leading-relaxed">
            Authorized noise emission registry. Ensuring transparency for construction, events, and industrial operations within city limits.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
          <div className="relative group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 group-focus-within:text-black dark:group-focus-within:text-white transition-colors" />
            <input 
              type="text"
              placeholder="Search registry..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-16 pr-8 py-5 rounded-[2rem] border-2 outline-none transition-all w-full sm:w-80 bg-zinc-50 dark:bg-zinc-900 border-black/5 dark:border-white/5 focus:border-black dark:focus:border-white font-medium shadow-inner"
            />
          </div>
          <button className="flex items-center space-x-3 px-8 py-5 rounded-[2rem] border-2 font-black uppercase tracking-widest text-[10px] bg-white dark:bg-zinc-800 border-black/5 dark:border-white/5 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-all shadow-sm">
            <Filter className="w-4 h-4" />
            <span>Filter Systems</span>
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
        {stats.map((stat, idx) => (
          <div key={idx} className="p-10 rounded-[3rem] border-2 flex items-center space-x-8 bg-zinc-50 dark:bg-zinc-900/50 border-black/5 dark:border-white/5 shadow-inner group hover:border-black/20 dark:hover:border-white/20 transition-all">
            <div className={cn("p-5 rounded-2xl bg-white dark:bg-zinc-800 border border-black/5 dark:border-white/5 shadow-xl group-hover:scale-110 transition-transform", stat.color)}>
              <stat.icon className="w-8 h-8" />
            </div>
            <div>
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em] mb-2">{stat.label}</p>
              <p className="text-4xl font-black tabular-nums tracking-tighter">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* View Toggle */}
      <div className="flex justify-between items-center mb-12">
        <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400">Registry Records</h2>
        <div className="flex p-1.5 bg-zinc-100 dark:bg-zinc-900 rounded-2xl border border-black/5 dark:border-white/5 shadow-inner">
          <button 
            onClick={() => setView('grid')}
            className={cn(
              "p-3 rounded-xl transition-all",
              view === 'grid' ? "bg-white dark:bg-zinc-800 shadow-2xl text-black dark:text-white" : "text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300"
            )}
          >
            <LayoutGrid className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setView('table')}
            className={cn(
              "p-3 rounded-xl transition-all",
              view === 'table' ? "bg-white dark:bg-zinc-800 shadow-2xl text-black dark:text-white" : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
            )}
          >
            <List className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Permits View */}
      {loading ? (
        <div className="py-40 flex flex-col items-center justify-center space-y-6 opacity-30">
          <Loader2 className="w-12 h-12 animate-spin" />
          <p className="text-[10px] font-black uppercase tracking-[0.4em]">Fetching Authority Data...</p>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {view === 'grid' ? (
            <motion.div 
              key="grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10"
            >
              {filteredPermits.map((permit) => (
                <motion.div
                  key={permit.id}
                  layout
                  className="p-10 rounded-[3.5rem] border-2 group transition-all bg-white dark:bg-zinc-900 border-black/5 dark:border-white/5 hover:border-black dark:hover:border-white hover:shadow-[0_20px_50px_rgba(0,0,0,0.1)] relative overflow-hidden"
                >
                  <div className="scanline absolute inset-0 opacity-5 pointer-events-none" />
                  <div className="flex justify-between items-start mb-10 relative z-10">
                    <span className={cn(
                      "px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest",
                      permit.status === 'Active' ? "bg-black dark:bg-white text-white dark:text-black shadow-xl" :
                      permit.status === 'Upcoming' ? "bg-zinc-500 text-white" :
                      "bg-zinc-100 dark:bg-zinc-800 text-zinc-400"
                    )}>
                      {permit.status}
                    </span>
                    <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest opacity-40">ID: {permit.id.toUpperCase()}</span>
                  </div>

                  <h3 className="text-3xl font-black uppercase tracking-tighter mb-3 italic">
                    {permit.eventName}
                  </h3>
                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-10">{permit.organizer}</p>

                  <div className="space-y-5 mb-12 relative z-10 opacity-70">
                    <div className="flex items-center text-xs font-bold">
                      <MapPin className="w-5 h-5 mr-4 text-black dark:text-white" />
                      {permit.location}
                    </div>
                    <div className="flex items-center text-xs font-bold">
                      <Calendar className="w-5 h-5 mr-4 text-black dark:text-white" />
                      {new Date(permit.startTime).toLocaleDateString(undefined, { weekday: 'short', month: 'long', day: 'numeric' })}
                    </div>
                    <div className="flex items-center text-xs font-bold">
                      <Clock className="w-5 h-5 mr-4 text-black dark:text-white" />
                      {new Date(permit.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} — {new Date(permit.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>

                  <div className="pt-10 border-t border-black/5 dark:border-white/5 relative z-10">
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.3em] mb-3 leading-none underline decoration-zinc-200 underline-offset-4">Max Acoustic Limit</p>
                        <p className="text-5xl font-black tabular-nums tracking-tighter">{permit.maxDb ?? 0} <span className="text-sm font-medium opacity-20">dB</span></p>
                      </div>
                      <div className="w-32 h-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden shadow-inner flex items-center">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${((permit.maxDb ?? 0) / 120) * 100}%` }}
                          className="h-full bg-black dark:bg-white" 
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div 
              key="table"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="rounded-[3.5rem] border-2 overflow-hidden bg-white dark:bg-zinc-900 border-black/5 dark:border-white/5 shadow-2xl"
            >
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead>
                    <tr className="border-b border-black/5 dark:border-white/5 bg-zinc-50 dark:bg-zinc-800/80">
                      <th className="p-10 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">Event / ID</th>
                      <th className="p-10 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">Organizer</th>
                      <th className="p-10 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">Time Window</th>
                      <th className="p-10 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">Status</th>
                      <th className="p-10 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">Limit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPermits.map((permit) => (
                      <tr key={permit.id} className="border-b border-black/5 dark:border-white/5 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors group">
                        <td className="p-10">
                          <p className="font-black uppercase text-xl tracking-tight italic">{permit.eventName}</p>
                          <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mt-1 opacity-40">{permit.id}</p>
                        </td>
                        <td className="p-10 text-xs font-black uppercase tracking-widest text-zinc-600 dark:text-zinc-400">{permit.organizer}</td>
                        <td className="p-10">
                          <p className="text-xs font-bold text-zinc-500">{new Date(permit.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} — {new Date(permit.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        </td>
                        <td className="p-10">
                          <span className={cn(
                            "px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest",
                            permit.status === 'Active' ? "bg-black dark:bg-white text-white dark:text-black" :
                            permit.status === 'Upcoming' ? "bg-zinc-500 text-white" :
                            "bg-zinc-100 dark:bg-zinc-800 text-zinc-400"
                          )}>
                            {permit.status}
                          </span>
                        </td>
                        <td className="p-10">
                          <p className="font-black text-3xl tabular-nums tracking-tighter">{permit.maxDb ?? 0} <span className="text-xs font-medium opacity-20">dB</span></p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* Footer Support Section */}
      <div className="mt-32 p-12 rounded-[4rem] bg-zinc-50 dark:bg-zinc-950 border-2 border-black/5 dark:border-white/5 flex flex-col md:flex-row items-center justify-between space-y-10 md:space-y-0 shadow-inner overflow-hidden relative">
        <div className="scanline absolute inset-0 opacity-5 pointer-events-none" />
        <div className="flex items-center space-x-10 relative z-10">
          <div className="w-24 h-24 rounded-[2rem] bg-white dark:bg-zinc-900 border-2 border-black/5 dark:border-white/5 flex items-center justify-center shadow-xl rotate-3">
            <AlertTriangle className="text-black dark:text-white w-10 h-10" />
          </div>
          <div className="space-y-2">
            <p className="text-3xl font-black uppercase tracking-tighter italic">Found a discrepancy?</p>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em] max-w-sm leading-relaxed">
              If an active operation is exceeding the registered decibel threshold, initiate a field report for immediate verification.
            </p>
          </div>
        </div>
        <button className="px-16 py-7 bg-black dark:bg-white text-white dark:text-black rounded-3xl font-black uppercase tracking-[0.2em] text-sm hover:scale-105 active:scale-95 transition-all shadow-2xl relative z-10 w-full md:w-auto">
          INITIATE FIELD REPORT
        </button>
      </div>

      <div className="mt-20 pt-10 border-t border-black/5 dark:border-white/5 flex flex-col md:flex-row justify-between items-center opacity-30">
        <p className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.5em]">
          Authority Sync: Standard Sync Protocol Active
        </p>
        <span className="text-[9px] font-black uppercase tracking-widest leading-loose">
          Last Global Update: {new Date().toLocaleTimeString()}
        </span>
      </div>
    </div>
  );
}
