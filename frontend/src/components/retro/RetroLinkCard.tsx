import { motion, AnimatePresence } from "framer-motion";
import { 
  Star, Trash2, ExternalLink, BookOpen, Clock, Link2, 
  X, Play, Calendar, CheckCircle2, AlertTriangle 
} from "lucide-react";
import { useState, useEffect } from "react";
import type { Link } from "@/types";

interface RetroLinkCardProps {
  link: Link;
  onToggleRead: (id: string, isRead: boolean) => void;
  onToggleFavorite: (id: string, isFavorite: boolean) => void;
  onSchedule: (id: string, scheduledAt: string | null) => void;
  onDelete: (id: string) => void;
  index: number;
}

export const RetroLinkCard = ({ 
  link, 
  onToggleRead, 
  onToggleFavorite, 
  onSchedule, 
  onDelete,
  index 
}: RetroLinkCardProps) => {
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');

  // Load existing scheduled time when opening modal
  useEffect(() => {
    if (showScheduleModal && link.scheduled_at) {
      // Convert UTC time to local datetime-local format
      const date = new Date(link.scheduled_at);
      const localDateTime = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
      setScheduleDate(localDateTime);
    } else if (!showScheduleModal) {
      setScheduleDate('');
    }
  }, [showScheduleModal, link.scheduled_at]);
  const [isDeleting, setIsDeleting] = useState(false);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const handleSchedule = () => {
    // Convert IST (local) datetime to UTC ISO string for server
    // datetime-local gives us: "2026-01-03T01:30" which browser treats as local time
    // new Date() converts it to UTC automatically based on browser timezone
    const utcDateTime = scheduleDate ? new Date(scheduleDate).toISOString() : null;
    console.log(`🕐 Scheduling: IST Time: ${scheduleDate} → UTC Time: ${utcDateTime}`);
    onSchedule(link.id, utcDateTime);
    setShowScheduleModal(false);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    await onDelete(link.id);
    setShowDeleteModal(false);
    setIsDeleting(false);
  };

  return (
    <>
      <motion.article
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05, duration: 0.4 }}
        whileHover={{ y: -4 }}
        className={`retro-card overflow-hidden group ${link.is_read ? 'opacity-70' : ''}`}
      >
        {/* Media Preview */}
        {(link.image_url || link.video_url) && (
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="relative h-44 w-full bg-muted cursor-pointer overflow-hidden"
            onClick={() => setShowMediaModal(true)}
          >
            {link.image_url && (
              <img 
                src={link.image_url} 
                alt={link.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
            )}
            {link.video_url && (
              <div className="absolute inset-0 flex items-center justify-center bg-foreground/20 group-hover:bg-foreground/40 transition-colors">
                <motion.div 
                  whileHover={{ scale: 1.1 }}
                  className="p-4 bg-card/95 rounded-full shadow-retro-lg"
                >
                  <Play className="w-6 h-6 text-primary fill-current" />
                </motion.div>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-foreground/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          </motion.div>
        )}

        <div className="p-5">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex-1 min-w-0">
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-lg font-serif font-semibold text-foreground hover:text-primary line-clamp-2 flex items-center gap-2 group/link transition-colors"
              >
                {link.title}
                <ExternalLink className="w-4 h-4 opacity-0 group-hover/link:opacity-100 transition-opacity flex-shrink-0" />
              </a>
              
              {link.domain && (
                <p className="text-sm text-muted-foreground mt-1 font-sans">{link.domain}</p>
              )}
            </div>

            <div className="flex items-center gap-1">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowScheduleModal(true)}
                className={`p-2 rounded-lg transition-colors ${
                  link.scheduled_at
                    ? 'text-accent bg-accent/15'
                    : 'text-muted-foreground hover:text-accent hover:bg-accent/10'
                }`}
                title="Schedule reading"
              >
                <Calendar className="w-5 h-5" />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.1, rotate: 15 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => onToggleFavorite(link.id, !link.is_favorite)}
                className={`p-2 rounded-lg transition-colors ${
                  link.is_favorite
                    ? 'text-retro-gold'
                    : 'text-muted-foreground hover:text-retro-gold'
                }`}
                title={link.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
              >
                <Star className="w-5 h-5" fill={link.is_favorite ? 'currentColor' : 'none'} />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowDeleteModal(true)}
                className="p-2 rounded-lg text-muted-foreground hover:text-destructive transition-colors"
                title="Delete link"
              >
                <Trash2 className="w-5 h-5" />
              </motion.button>
            </div>
          </div>

          {/* Scheduled Badge */}
          {link.scheduled_at && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-3 flex items-center gap-2 px-3 py-1.5 bg-accent/10 text-accent rounded-lg text-xs font-medium border border-accent/20"
            >
              <Clock className="w-3.5 h-3.5" />
              Scheduled: {new Date(link.scheduled_at).toLocaleString()}
            </motion.div>
          )}

          {/* Summary */}
          {link.summary && (
            <p className="text-foreground/80 text-sm line-clamp-3 mb-3 font-sans leading-relaxed">
              {link.summary}
            </p>
          )}

          {/* Metadata */}
          <div className="flex items-center flex-wrap gap-3 text-sm text-muted-foreground mb-3">
            {link.reading_time && link.reading_time > 0 && (
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {link.reading_time} min
              </span>
            )}
            
            {link.author && (
              <span className="truncate">by {link.author}</span>
            )}

            <span className="ml-auto text-xs">{formatDate(link.created_at)}</span>
          </div>

          {/* Tags */}
          {link.tags && link.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {link.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2.5 py-1 bg-primary/10 text-primary rounded-md text-xs font-medium border border-primary/20"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Nested Links */}
          {link.nested_links && link.nested_links.length > 0 && (
            <div className="mb-4 p-3 bg-muted/50 rounded-lg border border-border">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                <Link2 className="w-3 h-3" />
                Links found
              </p>
              <div className="space-y-1.5">
                {link.nested_links.slice(0, 3).map((url, idx) => (
                  <a
                    key={idx}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-xs text-primary hover:underline truncate"
                  >
                    {url}
                  </a>
                ))}
                {link.nested_links.length > 3 && (
                  <p className="text-xs text-muted-foreground">
                    +{link.nested_links.length - 3} more
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="pt-3 border-t border-border">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onToggleRead(link.id, !link.is_read)}
              className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                link.is_read
                  ? 'bg-muted text-muted-foreground hover:bg-muted/80 border-2 border-border'
                  : 'bg-primary text-primary-foreground hover:shadow-glow border-2 border-primary'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              {link.is_read ? 'Mark Unread' : 'Mark as Read'}
            </motion.button>
          </div>
        </div>
      </motion.article>

      {/* Media Modal */}
      <AnimatePresence>
        {showMediaModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/90 backdrop-blur-sm"
            onClick={() => setShowMediaModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-5xl w-full aspect-video bg-card rounded-xl overflow-hidden shadow-retro-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                onClick={() => setShowMediaModal(false)}
                className="absolute top-4 right-4 z-10 p-2 bg-card/80 text-foreground rounded-full hover:bg-card transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
              
              {link.video_url ? (
                <iframe
                  src={link.video_url}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <img 
                  src={link.image_url} 
                  alt={link.title}
                  className="w-full h-full object-contain"
                />
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Schedule Modal */}
      <AnimatePresence>
        {showScheduleModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/50 backdrop-blur-sm"
            onClick={() => setShowScheduleModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="retro-card max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-accent/15 rounded-lg">
                  <Calendar className="w-6 h-6 text-accent" />
                </div>
                <button 
                  onClick={() => setShowScheduleModal(false)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <h3 className="text-xl font-serif font-bold text-foreground mb-2">
                {link.scheduled_at ? 'Reschedule Reading' : 'Schedule Reading'}
              </h3>
              <p className="text-muted-foreground mb-6 text-sm">
                {link.scheduled_at 
                  ? `Change the reading time for "${link.title}".`
                  : `Set a date and time to read "${link.title}".`
                }
              </p>

              {/* Quick Schedule Buttons */}
              <div className="mb-4 flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    const now = new Date();
                    now.setMinutes(now.getMinutes() + 2);
                    setScheduleDate(now.toISOString().slice(0, 16));
                  }}
                  className="px-3 py-1.5 text-xs bg-primary/10 text-primary border border-primary/20 rounded-lg hover:bg-primary/20 transition-colors"
                >
                  ⚡ In 2 min
                </button>
                <button
                  onClick={() => {
                    const now = new Date();
                    now.setMinutes(now.getMinutes() + 5);
                    setScheduleDate(now.toISOString().slice(0, 16));
                  }}
                  className="px-3 py-1.5 text-xs bg-primary/10 text-primary border border-primary/20 rounded-lg hover:bg-primary/20 transition-colors"
                >
                  🕐 In 5 min
                </button>
                <button
                  onClick={() => {
                    const now = new Date();
                    now.setMinutes(now.getMinutes() + 10);
                    setScheduleDate(now.toISOString().slice(0, 16));
                  }}
                  className="px-3 py-1.5 text-xs bg-primary/10 text-primary border border-primary/20 rounded-lg hover:bg-primary/20 transition-colors"
                >
                  🕐 In 10 min
                </button>
                <button
                  onClick={() => {
                    const now = new Date();
                    now.setHours(now.getHours() + 1);
                    setScheduleDate(now.toISOString().slice(0, 16));
                  }}
                  className="px-3 py-1.5 text-xs bg-primary/10 text-primary border border-primary/20 rounded-lg hover:bg-primary/20 transition-colors"
                >
                  ⏰ In 1 hour
                </button>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-foreground mb-2">
                  📍 Pick Your Reading Time (IST - India Time)
                </label>
                <input
                  type="datetime-local"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  className="w-full px-4 py-2.5 bg-background border-2 border-input rounded-lg text-foreground focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
                />
                {scheduleDate && (
                  <div className="mt-2 p-2 bg-muted/50 rounded border border-border">
                    <p className="text-xs text-muted-foreground">
                      🇮🇳 Your time (IST): <span className="font-mono text-foreground">{new Date(scheduleDate).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      🌍 Server time (UTC): <span className="font-mono text-foreground">{new Date(scheduleDate).toISOString().slice(0, 19).replace('T', ' ')}</span>
                    </p>
                    <p className="text-xs text-primary mt-1">
                      ✅ Notification will be sent at your IST time above
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setScheduleDate('');
                    handleSchedule();
                  }}
                  className="flex-1 px-4 py-2.5 bg-muted text-muted-foreground font-medium rounded-lg border-2 border-border hover:bg-muted/80 transition-colors"
                >
                  {link.scheduled_at ? 'Unschedule' : 'Clear'}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSchedule}
                  disabled={!scheduleDate}
                  className="flex-1 px-4 py-2.5 bg-accent text-accent-foreground font-medium rounded-lg border-2 border-accent shadow-retro flex items-center justify-center gap-2 hover:shadow-glow transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  {link.scheduled_at ? 'Update' : 'Save'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/50 backdrop-blur-sm"
            onClick={() => setShowDeleteModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="retro-card max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-destructive/15 rounded-lg">
                  <AlertTriangle className="w-6 h-6 text-destructive" />
                </div>
                <button 
                  onClick={() => setShowDeleteModal(false)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <h3 className="text-xl font-serif font-bold text-foreground mb-2">Delete Link?</h3>
              <p className="text-muted-foreground mb-6 text-sm">
                Are you sure you want to delete <span className="font-semibold text-foreground">"{link.title}"</span>? This action cannot be undone.
              </p>

              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 px-4 py-2.5 bg-muted text-muted-foreground font-medium rounded-lg border-2 border-border hover:bg-muted/80 transition-colors"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2.5 bg-destructive text-destructive-foreground font-medium rounded-lg border-2 border-destructive shadow-retro flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
                >
                  {isDeleting ? (
                    <div className="w-5 h-5 border-2 border-destructive-foreground/30 border-t-destructive-foreground rounded-full animate-spin" />
                  ) : (
                    'Delete'
                  )}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
