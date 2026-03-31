import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { ThemeProvider } from '../ui/ThemeProvider';
import { AuthProvider, useAuth } from '../auth/AuthContext';
import { Navbar } from '../ui/Navbar';
import { Home } from '../features/home/HomePage';
import { Report } from '../features/report/ReportPage';
import { CommandCenter } from '../features/command/CommandCenterPage';
import { Permits } from '../features/permits/PermitsPage';
import { useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function AppContent() {
  const location = useLocation();
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-black">
        <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col font-sans antialiased bg-white dark:bg-black text-black dark:text-white transition-colors duration-300">
      <ScrollToTop />
      <Navbar />
      
      <main className="flex-1 relative pt-20">
        <AnimatePresence mode="wait">
          <Routes location={location}>
            <Route path="/" element={<Home />} />
            <Route path="/permits" element={<Permits />} />
            <Route 
              path="/report" 
              element={user ? <Report /> : <Navigate to="/" />} 
            />
            <Route 
              path="/command" 
              element={user ? <CommandCenter /> : <Navigate to="/" />} 
            />
          </Routes>
        </AnimatePresence>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <Router>
          <AppContent />
        </Router>
      </ThemeProvider>
    </AuthProvider>
  );
}
