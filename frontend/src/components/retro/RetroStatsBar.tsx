import { motion } from "framer-motion";
import { BookOpen, Star, CheckCircle, Link as LinkIcon, Calendar } from "lucide-react";
import type { Stats } from "@/types";

interface RetroStatsBarProps {
  stats: Stats;
}

const statItems = [
  { key: 'total_links', label: 'Total', icon: LinkIcon, color: 'bg-primary/10 text-primary' },
  { key: 'unread', label: 'Unread', icon: BookOpen, color: 'bg-retro-orange/15 text-retro-orange' },
  { key: 'read', label: 'Read', icon: CheckCircle, color: 'bg-retro-green/15 text-retro-green' },
  { key: 'favorites', label: 'Favorites', icon: Star, color: 'bg-retro-gold/15 text-retro-gold' },
  { key: 'scheduled', label: 'Scheduled', icon: Calendar, color: 'bg-accent/15 text-accent' },
] as const;

export const RetroStatsBar = ({ stats }: RetroStatsBarProps) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4 mb-8">
      {statItems.map((item, index) => {
        const Icon = item.icon;
        const value = stats[item.key];
        
        return (
          <motion.div
            key={item.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.02, y: -2 }}
            className="retro-card p-4 cursor-default group"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-1">
                  {item.label}
                </p>
                <p className="text-2xl md:text-3xl font-serif font-bold text-foreground">
                  {value}
                </p>
              </div>
              <div className={`p-3 rounded-lg ${item.color} transition-all group-hover:scale-110`}>
                <Icon className="w-5 h-5 md:w-6 md:h-6" />
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};
