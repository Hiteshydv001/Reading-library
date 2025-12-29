import { motion } from "framer-motion";
import { BookOpen } from "lucide-react";

export const RetroLoading = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center"
      >
        <motion.div
          animate={{ 
            rotate: [0, 10, -10, 0],
            scale: [1, 1.05, 1]
          }}
          transition={{ 
            duration: 1.5, 
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="inline-block p-6 bg-primary/10 rounded-2xl mb-6 shadow-glow"
        >
          <BookOpen className="w-12 h-12 text-primary" />
        </motion.div>
        
        <h2 className="text-xl font-serif font-semibold text-foreground mb-2">
          Loading your library...
        </h2>
        <p className="text-muted-foreground text-sm">
          Gathering your reading collection
        </p>
        
        <div className="flex justify-center gap-1 mt-6">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{ y: [0, -10, 0] }}
              transition={{
                duration: 0.6,
                repeat: Infinity,
                delay: i * 0.2,
              }}
              className="w-2 h-2 bg-primary rounded-full"
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
};
