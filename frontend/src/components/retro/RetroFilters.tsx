import { motion } from "framer-motion";
import { Search, Filter, SlidersHorizontal } from "lucide-react";

interface RetroFiltersProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedTag: string;
  setSelectedTag: (tag: string) => void;
  showOnlyUnread: boolean;
  setShowOnlyUnread: (show: boolean) => void;
  showOnlyFavorites: boolean;
  setShowOnlyFavorites: (show: boolean) => void;
  showOnlyScheduled: boolean;
  setShowOnlyScheduled: (show: boolean) => void;
  tags: string[];
}

export const RetroFilters = ({
  searchQuery,
  setSearchQuery,
  selectedTag,
  setSelectedTag,
  showOnlyUnread,
  setShowOnlyUnread,
  showOnlyFavorites,
  setShowOnlyFavorites,
  showOnlyScheduled,
  setShowOnlyScheduled,
  tags,
}: RetroFiltersProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="retro-card p-4 md:p-6 mb-6"
    >
      <div className="flex items-center gap-2 mb-4">
        <SlidersHorizontal className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-serif font-semibold text-foreground">Filters</h2>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search your library..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-background border-2 border-input rounded-lg text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all font-sans"
          />
        </div>

        {/* Tag Filter */}
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <select
            value={selectedTag}
            onChange={(e) => setSelectedTag(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-background border-2 border-input rounded-lg text-foreground focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all font-sans appearance-none cursor-pointer"
          >
            <option value="">All Tags</option>
            {tags.map((tag) => (
              <option key={tag} value={tag}>
                {tag}
              </option>
            ))}
          </select>
        </div>

        {/* Toggle Filters */}
        <div className="flex flex-wrap gap-2 lg:col-span-2">
          <ToggleChip
            checked={showOnlyUnread}
            onChange={setShowOnlyUnread}
            label="Unread"
          />
          <ToggleChip
            checked={showOnlyFavorites}
            onChange={setShowOnlyFavorites}
            label="Favorites"
          />
          <ToggleChip
            checked={showOnlyScheduled}
            onChange={setShowOnlyScheduled}
            label="Scheduled"
          />
        </div>
      </div>
    </motion.div>
  );
};

interface ToggleChipProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}

const ToggleChip = ({ checked, onChange, label }: ToggleChipProps) => (
  <motion.button
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    onClick={() => onChange(!checked)}
    className={`px-4 py-2 rounded-lg font-medium text-sm border-2 transition-all ${
      checked
        ? 'bg-primary text-primary-foreground border-primary shadow-glow'
        : 'bg-background text-muted-foreground border-input hover:border-primary/50'
    }`}
  >
    {label}
  </motion.button>
);
