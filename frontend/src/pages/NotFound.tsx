import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { BookX, Home } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <motion.div
          animate={{ 
            rotate: [-5, 5, -5],
            y: [0, -5, 0]
          }}
          transition={{ 
            duration: 3, 
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="inline-block p-6 bg-muted rounded-2xl mb-6"
        >
          <BookX className="w-16 h-16 text-muted-foreground" />
        </motion.div>
        
        <h1 className="text-6xl font-serif font-bold text-foreground mb-4">
          404
        </h1>
        <h2 className="text-2xl font-serif font-semibold text-foreground mb-3">
          Page Not Found
        </h2>
        <p className="text-muted-foreground mb-8 max-w-md mx-auto font-sans">
          This page seems to have wandered off from the library. 
          Let's get you back to your reading collection.
        </p>
        
        <Link to="/">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium shadow-retro hover:shadow-glow border-2 border-primary transition-all"
          >
            <Home className="w-5 h-5" />
            Back to Library
          </motion.button>
        </Link>
      </motion.div>
    </div>
  );
};

export default NotFound;
