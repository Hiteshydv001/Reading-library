import { motion } from "framer-motion";
import { BookMarked } from "lucide-react";

interface RetroEmptyStateProps {
  hasFilters: boolean;
}

export const RetroEmptyState = ({ hasFilters }: RetroEmptyStateProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center py-16"
    >
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        className="inline-block p-6 bg-muted rounded-full mb-6"
      >
        <BookMarked className="w-16 h-16 text-muted-foreground" />
      </motion.div>
      
      <h3 className="text-2xl font-serif font-bold text-foreground mb-3">
        {hasFilters ? 'No matches found' : 'Your library awaits'}
      </h3>
      <p className="text-muted-foreground max-w-md mx-auto font-sans">
        {hasFilters
          ? 'Try adjusting your filters to discover more reads'
          : 'Share a link in your Telegram group to start building your collection'}
      </p>
    </motion.div>
  );
};
