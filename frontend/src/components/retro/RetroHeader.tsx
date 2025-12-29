import { motion } from "framer-motion";
import { BookMarked, RefreshCw, LogOut, Calendar } from "lucide-react";
import { Link } from "react-router-dom";
import { ThemeToggle } from "./ThemeToggle";

interface RetroHeaderProps {
  onRefresh: () => void;
  onLogout: () => void;
  refreshing: boolean;
}

export const RetroHeader = ({ onRefresh, onLogout, refreshing }: RetroHeaderProps) => {
  return (
    <motion.header 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-0 z-50 border-b-2 border-border bg-card/95 backdrop-blur-sm shadow-retro"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-4 group">
            <motion.div 
              whileHover={{ scale: 1.05, rotate: -3 }}
              whileTap={{ scale: 0.95 }}
              className="relative p-3 bg-primary rounded-lg shadow-glow"
            >
              <BookMarked className="w-7 h-7 text-primary-foreground" />
              <div className="absolute inset-0 bg-primary rounded-lg animate-pulse-glow opacity-50" />
            </motion.div>
            <div>
              <h1 className="text-2xl md:text-3xl font-serif font-bold text-foreground group-hover:text-primary transition-colors">
                Reading Library
              </h1>
              <p className="text-sm text-muted-foreground font-sans">
                Your personal collection of wisdom
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-2 md:gap-3">
            <ThemeToggle />
            
            <Link to="/calendar">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-2 px-3 md:px-4 py-2 bg-accent text-accent-foreground rounded-lg font-medium text-sm border-2 border-accent shadow-retro hover:shadow-glow transition-all"
              >
                <Calendar className="w-4 h-4" />
                <span className="hidden sm:inline">Calendar</span>
              </motion.button>
            </Link>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-3 md:px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium text-sm border-2 border-primary shadow-retro hover:shadow-glow transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onLogout}
              className="flex items-center gap-2 px-3 md:px-4 py-2 bg-card text-destructive rounded-lg font-medium text-sm border-2 border-destructive/30 shadow-retro hover:bg-destructive/10 transition-all"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </motion.button>
          </div>
        </div>
      </div>
    </motion.header>
  );
};
