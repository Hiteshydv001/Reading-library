import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import type { Link, Stats } from "@/types";
import { RetroHeader } from "@/components/retro/RetroHeader";
import { RetroStatsBar } from "@/components/retro/RetroStatsBar";
import { RetroFilters } from "@/components/retro/RetroFilters";
import { RetroLinkCard } from "@/components/retro/RetroLinkCard";
import { RetroEmptyState } from "@/components/retro/RetroEmptyState";
import { RetroLoading } from "@/components/retro/RetroLoading";
import { getLinks, getTags, getStats, updateLink, deleteLink } from "@/lib/api";
import { clearAuthToken } from "@/lib/api";


const Index = () => {
  const [links, setLinks] = useState<Link[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const navigate = useNavigate();

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string>("");
  const [showOnlyUnread, setShowOnlyUnread] = useState(false);
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const [showOnlyScheduled, setShowOnlyScheduled] = useState(false);
  const [tags, setTags] = useState<string[]>([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = { skip: 0, limit: 100 };
      if (searchQuery) params.search = searchQuery;
      if (selectedTag) params.tag = selectedTag;
      if (showOnlyUnread) params.is_read = false;
      if (showOnlyFavorites) params.is_favorite = true;
      if (showOnlyScheduled) params.is_scheduled = true;

      const [linksRes, statsRes, tagsRes] = await Promise.all([
        getLinks(params),
        getStats(),
        getTags(),
      ]);

      setLinks(linksRes.links || []);
      setStats(statsRes || null);
      setTags(tagsRes.tags || []);
    } catch (err: any) {
      console.error("Error fetching data", err);
      if (err.status === 401) {
        clearAuthToken();
        navigate("/login");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleLogout = () => {
    clearAuthToken();
    navigate("/login");
  };

  const handleToggleRead = async (id: string, isRead: boolean) => {
    // Optimistic update
    const prev = links;
    setLinks((prevLinks) => prevLinks.map((l) => (l.id === id ? { ...l, is_read: isRead } : l)));
    try {
      await updateLink(id, { is_read: isRead });
    } catch (err) {
      // revert
      setLinks(prev);
      console.error("Failed to update read status", err);
    }
  };

  const handleToggleFavorite = async (id: string, isFavorite: boolean) => {
    const prev = links;
    setLinks((prevLinks) => prevLinks.map((l) => (l.id === id ? { ...l, is_favorite: isFavorite } : l)));
    try {
      await updateLink(id, { is_favorite: isFavorite });
    } catch (err) {
      setLinks(prev);
      console.error("Failed to update favorite", err);
    }
  };

  const handleSchedule = async (id: string, scheduledAt: string | null) => {
    const prev = links;
    setLinks((prevLinks) => prevLinks.map((l) => (l.id === id ? { ...l, scheduled_at: scheduledAt || undefined } : l)));
    try {
      await updateLink(id, { scheduled_at: scheduledAt });
    } catch (err) {
      setLinks(prev);
      console.error("Failed to schedule", err);
    }
  };

  const handleDelete = async (id: string) => {
    const prev = links;
    setLinks((prevLinks) => prevLinks.filter((l) => l.id !== id));
    try {
      await deleteLink(id);
    } catch (err) {
      setLinks(prev);
      console.error("Failed to delete", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [searchQuery, selectedTag, showOnlyUnread, showOnlyFavorites, showOnlyScheduled]);

  if (loading) {
    return <RetroLoading />;
  }

  const hasFilters = !!(searchQuery || selectedTag || showOnlyUnread || showOnlyFavorites || showOnlyScheduled);

  return (
    <div className="min-h-screen bg-background retro-scrollbar">
      <RetroHeader
        onRefresh={handleRefresh}
        onLogout={handleLogout}
        refreshing={refreshing}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {stats && <RetroStatsBar stats={stats} />}

        <RetroFilters
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedTag={selectedTag}
          setSelectedTag={setSelectedTag}
          showOnlyUnread={showOnlyUnread}
          setShowOnlyUnread={setShowOnlyUnread}
          showOnlyFavorites={showOnlyFavorites}
          setShowOnlyFavorites={setShowOnlyFavorites}
          showOnlyScheduled={showOnlyScheduled}
          setShowOnlyScheduled={setShowOnlyScheduled}
          tags={tags}
        />

        {links.length === 0 ? (
          <RetroEmptyState hasFilters={hasFilters} />
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
          >
            {links.map((link, index) => (
              <RetroLinkCard
                key={link.id}
                link={link}
                index={index}
                onToggleRead={handleToggleRead}
                onToggleFavorite={handleToggleFavorite}
                onSchedule={handleSchedule}
                onDelete={handleDelete}
              />
            ))}
          </motion.div>
        )}
      </main>

      {/* Decorative Footer */}
      <footer className="border-t-2 border-border bg-card/50 py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-muted-foreground text-sm font-sans">
            Your personal reading sanctuary • Built with love for readers
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
