import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Shield, Music, Hammer, Car, Zap, ArrowRight, FileText, 
  Volume2, Mail, ShieldCheck, Headphones, PhoneCall,
  Activity, Lock, Share2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { useAuth } from '../../auth/AuthContext';
import { AuthModal } from '../../ui/AuthModal';

export function Home() {
  const { user, loginAsGuest } = useAuth();
  const [showAuth, setShowAuth] = useState(false);

  const helps = [
    { title: 'AI Analysis', desc: 'Real-time acoustic fingerprinting to verify noise levels.', icon: Activity },
    { title: 'Secure Evidence', desc: 'End-to-end encrypted storage for audio and video files.', icon: Lock },
    { title: 'Instant Dispatch', desc: 'Direct digital link to the nearest available patrol unit.', icon: Share2 },
    { title: 'Public Transparency', desc: 'Verified permit registry for construction and events.', icon: FileText },
  ];

  const categories = [
    { name: 'DJ/Music', icon: Music, desc: 'Loud music from venues or private parties.' },
    { name: 'Construction', icon: Hammer, desc: 'Heavy machinery noise outside permitted hours.' },
    { name: 'Traffic', icon: Car, desc: 'Excessive vehicle noise or illegal hooting.' },
    { name: 'General', icon: Volume2, desc: 'Persistent noise disturbances in residential zones.' },
  ];

  const steps = [
    { 
      id: '01', 
      title: 'Digital Capture', 
      desc: 'Record the disturbance using our encrypted mobile interface. AI auto-tags the location.',
      icon: Volume2
    },
    { 
      id: '02', 
      title: 'Acoustic Verification', 
      desc: 'Our system analyzes decibels and frequency to verify the type of violation instantly.',
      icon: Zap
    },
    { 
      id: '03', 
      title: 'Enforcement Action', 
      desc: 'Evidence is transmitted to the Command Center for immediate authority response.',
      icon: ShieldCheck
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-black text-black dark:text-white selection:bg-black selection:text-white dark:selection:bg-white dark:selection:text-black">
      {/* Auth Modal */}
      <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} />

      {/* Hero Section */}
      <section className="relative pt-32 pb-48 px-4 sm:px-6 lg:px-8 overflow-hidden min-h-[90vh] flex items-center">
        {/* Architect Pattern Background (Dots) */}
        <div className="absolute inset-0 z-0 opacity-[0.4] dark:opacity-[0.2]" 
          style={{ 
            backgroundImage: `radial-gradient(circle, currentColor 1px, transparent 1px)`, 
            backgroundSize: '32px 32px' 
          }} 
        />
        
        <div className="max-w-7xl mx-auto relative z-10 w-full">
          <div className="flex flex-col items-center text-center">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="mb-8"
            >
              <span className="px-4 py-1.5 rounded-full border border-black/10 dark:border-white/10 bg-white/50 dark:bg-white/5 backdrop-blur-md text-[10px] font-black uppercase tracking-[0.2em]">
                VigilX Engineering — MVP 1.0
              </span>
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="text-7xl md:text-[11rem] font-black tracking-tighter leading-[0.8] mb-12 uppercase italic"
            >
              NOISE<br />
              <span className="text-zinc-300 dark:text-zinc-800">ENFORCED.</span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-lg md:text-2xl text-zinc-500 mb-16 max-w-2xl mx-auto font-medium leading-relaxed"
            >
              Advanced AI monitoring and reporting for illegal noise disturbances. 
              Secure evidence, instant dispatch, urban peace.
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto"
            >
              {user ? (
                <Link 
                  to="/report" 
                  className="group relative w-full sm:w-auto px-12 py-6 bg-black dark:bg-white text-white dark:text-black rounded-2xl font-black text-xl flex items-center justify-center overflow-hidden transition-all hover:scale-[1.02]"
                >
                  <Shield className="w-5 h-5 mr-3 group-hover:rotate-12 transition-transform" />
                  INITIATE REPORT
                </Link>
              ) : (
                <button 
                  onClick={() => setShowAuth(true)}
                  className="w-full sm:w-auto px-16 py-7 bg-black dark:bg-white text-white dark:text-black rounded-2xl font-black text-2xl flex items-center justify-center hover:scale-[1.02] transition-all shadow-2xl"
                >
                  ACCESS SYSTEM
                </button>
              )}
              
              <Link 
                to="/permits" 
                className="w-full sm:w-auto px-12 py-6 bg-transparent border-2 border-black/10 dark:border-white/10 text-black dark:text-white rounded-2xl font-black text-xl flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/5 transition-all"
              >
                PUBLIC REGISTRY
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Emergency Call Section */}
      <section className="py-12 bg-red-600 text-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center animate-pulse">
              <PhoneCall className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-3xl font-black uppercase tracking-tighter">Emergency Hotline</h2>
              <p className="text-red-100 font-bold uppercase tracking-widest text-[10px] mt-1">Direct link to nearest police station</p>
            </div>
          </div>
          <a 
            href="tel:100"
            className="w-full md:w-auto px-12 py-6 bg-white text-red-600 rounded-2xl font-black text-3xl hover:scale-105 transition-transform flex items-center justify-center gap-4"
          >
            CALL 100
          </a>
        </div>
      </section>

      {/* Modular Capabilities Grid */}
      <section className="py-32 px-4 sm:px-6 lg:px-8 bg-zinc-50 dark:bg-zinc-950 border-b border-black/10 dark:border-white/10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-24">
            <h2 className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-400 mb-6">Core Infrastructure</h2>
            <h3 className="text-5xl md:text-8xl font-black uppercase tracking-tighter leading-none">Built for Action.</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {helps.map((help, idx) => (
              <div key={idx} className="p-10 bg-white dark:bg-zinc-900 border border-black/10 dark:border-white/10 rounded-[2rem] shadow-sm group hover:border-black dark:hover:border-white transition-all duration-500">
                <div className="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-10 group-hover:scale-110 transition-transform">
                  <help.icon className="w-6 h-6 text-zinc-400 group-hover:text-black dark:group-hover:text-white transition-colors" />
                </div>
                <h4 className="text-xl font-black uppercase tracking-tight mb-4">{help.title}</h4>
                <p className="text-zinc-500 font-medium leading-relaxed">{help.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works — Structural Re-design */}
      <section className="py-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center gap-20">
            <div className="flex-1 space-y-12">
              <div>
                <h2 className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-400 mb-6">Execution Path</h2>
                <h3 className="text-5xl md:text-8xl font-black uppercase tracking-tighter leading-none mb-12">Operation Protocol.</h3>
              </div>
              
              <div className="space-y-4">
                {steps.map((step, idx) => (
                  <motion.div 
                    key={idx}
                    whileHover={{ x: 10 }}
                    className="flex items-start gap-8 p-8 rounded-3xl border border-transparent hover:border-black/5 dark:hover:border-white/5 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all group"
                  >
                    <span className="text-4xl font-black text-zinc-200 dark:text-zinc-800 group-hover:text-black dark:group-hover:text-white transition-colors">
                      {step.id}
                    </span>
                    <div>
                      <h4 className="text-2xl font-black uppercase tracking-tight mb-2">{step.title}</h4>
                      <p className="text-zinc-500 font-medium max-w-sm leading-relaxed">{step.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
            
            <div className="flex-1 w-full aspect-square relative flex items-center justify-center">
              <div className="absolute inset-0 bg-zinc-100 dark:bg-zinc-900 rounded-[4rem] rotate-3 scale-95" />
              <div className="absolute inset-0 border-2 border-black/5 dark:border-white/5 rounded-[4rem] -rotate-3" />
              <div className="relative w-full h-full bg-white dark:bg-zinc-900 border border-black/10 dark:border-white/10 rounded-[4rem] p-12 flex flex-col justify-center">
                <Volume2 className="w-32 h-32 text-zinc-200 dark:text-zinc-800 mb-12" />
                <h4 className="text-4xl font-black uppercase tracking-tighter mb-6">AI Acoustic Fingerprinting</h4>
                <p className="text-xl text-zinc-500 font-medium leading-relaxed">
                  Our neural network identifies construction patterns, traffic peaks, and amplified music with 98.4% accuracy, ensuring zero false alarms for authorities.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 border-t border-black/10 dark:border-white/10 bg-white dark:bg-black">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-start gap-12 mb-16">
            <div className="space-y-6 max-w-xs">
              <span className="text-2xl font-black tracking-tighter uppercase italic">
                VIGIL<span className="text-zinc-400">X</span>
              </span>
              <p className="text-zinc-500 font-medium leading-relaxed">
                Architectural noise enforcement infrastructure for modern city-states.
              </p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-2 gap-20">
              <div className="space-y-6">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">System</h4>
                <ul className="space-y-3 font-bold text-sm">
                  <li><Link to="/report" className="hover:text-zinc-500 transition-colors">Report</Link></li>
                  <li><Link to="/permits" className="hover:text-zinc-500 transition-colors">Registry</Link></li>
                  <li><Link to="/command" className="hover:text-zinc-500 transition-colors">Command</Link></li>
                </ul>
              </div>
              <div className="space-y-6">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Security</h4>
                <ul className="space-y-3 font-bold text-sm">
                  <li><a href="#" className="hover:text-zinc-500 transition-colors">Privacy</a></li>
                  <li><a href="#" className="hover:text-zinc-500 transition-colors">Terms</a></li>
                  <li><a href="#" className="hover:text-zinc-500 transition-colors">Compliance</a></li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="pt-12 border-t border-black/5 dark:border-white/5 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-[9px] text-zinc-400 font-black uppercase tracking-[0.2em]">
              © 2026 VigilX Systems / A Civic Peace Infrastructure Project
            </p>
            <div className="flex items-center gap-4">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-[9px] font-black uppercase tracking-widest text-red-500">Live Backend Operation</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
