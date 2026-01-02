import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  ArrowLeft,
  BookOpen 
} from "lucide-react";
import type { Link as LinkType } from "@/types";
import { RetroLinkCard } from "@/components/retro/RetroLinkCard";
import { RetroLoading } from "@/components/retro/RetroLoading";

const CalendarPage = () => {
  const [links, setLinks] = useState<LinkType[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const navigate = useNavigate();

  useEffect(() => {
    const loadScheduled = async () => {
      setLoading(true);
      try {
        const res = await (await import("@/lib/api")).getLinks({ is_scheduled: true, limit: 1000 });
        console.log("📅 Calendar - Fetched scheduled links:", res.links?.length || 0);
        console.log("📅 Links with scheduled_at:", res.links?.filter(l => l.scheduled_at).length || 0);
        setLinks(res.links || []);
      } catch (err: any) {
        console.error("Failed to load scheduled links", err);
        if (err.status === 401) {
          (await import("@/lib/api")).clearAuthToken();
          navigate("/login");
        }
      } finally {
        setLoading(false);
      }
    };

    loadScheduled();
  }, [navigate]);

  const daysInMonth = (year: number, month: number) =>
    new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) =>
    new Date(year, month, 1).getDay();

  const prevMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
    );
  };

  const nextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
    );
  };

  const monthName = currentDate.toLocaleString("default", { month: "long" });
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const days: (number | null)[] = [];
  const totalDays = daysInMonth(year, month);
  const startDay = firstDayOfMonth(year, month);

  for (let i = 0; i < startDay; i++) {
    days.push(null);
  }

  for (let i = 1; i <= totalDays; i++) {
    days.push(i);
  }

  const getLinksForDay = (day: number) => {
    return links.filter((link) => {
      if (!link.scheduled_at) return false;
      const d = new Date(link.scheduled_at);
      return (
        d.getDate() === day &&
        d.getMonth() === month &&
        d.getFullYear() === year
      );
    });
  };

  const handleToggleRead = (id: string, isRead: boolean) => {
    setLinks((prev) =>
      prev.map((link) => (link.id === id ? { ...link, is_read: isRead } : link))
    );
  };

  const handleToggleFavorite = (id: string, isFavorite: boolean) => {
    setLinks((prev) =>
      prev.map((link) =>
        link.id === id ? { ...link, is_favorite: isFavorite } : link
      )
    );
  };

  const handleSchedule = (id: string, scheduledAt: string | null) => {
    setLinks((prev) =>
      prev.map((link) =>
        link.id === id ? { ...link, scheduled_at: scheduledAt || undefined } : link
      )
    );
  };

  const handleDelete = async (id: string) => {
    setLinks((prev) => prev.filter((link) => link.id !== id));
  };

  if (loading) {
    return <RetroLoading />;
  }

  const upcomingLinks = links
    .filter((l) => l.scheduled_at && new Date(l.scheduled_at) >= new Date())
    .sort(
      (a, b) =>
        new Date(a.scheduled_at!).getTime() - new Date(b.scheduled_at!).getTime()
    );

  return (
    <div className="min-h-screen bg-background retro-scrollbar">
      {/* Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-50 border-b-2 border-border bg-card/95 backdrop-blur-sm shadow-retro"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-2 hover:bg-muted rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-6 h-6 text-foreground" />
                </motion.button>
              </Link>

              <motion.div
                whileHover={{ scale: 1.05, rotate: -3 }}
                className="p-3 bg-accent rounded-lg shadow-glow"
              >
                <CalendarIcon className="w-7 h-7 text-accent-foreground" />
              </motion.div>

              <div>
                <h1 className="text-2xl md:text-3xl font-serif font-bold text-foreground">
                  Reading Calendar
                </h1>
                <p className="text-sm text-muted-foreground font-sans">
                  Schedule your reading sessions
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Calendar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="retro-card overflow-hidden mb-8"
        >
          {/* Calendar Header */}
          <div className="p-6 border-b-2 border-border flex items-center justify-between bg-muted/30">
            <h2 className="text-2xl font-serif font-bold text-foreground">
              {monthName} {year}
            </h2>
            <div className="flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={prevMonth}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-foreground" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setCurrentDate(new Date())}
                className="px-4 py-1.5 text-sm font-medium text-primary bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors"
              >
                Today
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={nextMonth}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-foreground" />
              </motion.button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div
                key={day}
                className="py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider bg-muted/50 border-b border-border"
              >
                {day}
              </div>
            ))}
            {days.map((day, idx) => {
              const dayLinks = day ? getLinksForDay(day) : [];
              const isToday =
                day === new Date().getDate() &&
                month === new Date().getMonth() &&
                year === new Date().getFullYear();

              return (
                <motion.div
                  key={idx}
                  whileHover={day ? { backgroundColor: "hsl(var(--muted))" } : {}}
                  className={`min-h-[100px] md:min-h-[120px] p-2 border-b border-r border-border transition-colors ${
                    day ? "cursor-pointer" : "bg-muted/20"
                  }`}
                >
                  {day && (
                    <>
                      <span
                        className={`inline-flex items-center justify-center w-7 h-7 text-sm font-medium rounded-full mb-1 ${
                          isToday
                            ? "bg-primary text-primary-foreground shadow-glow"
                            : "text-foreground"
                        }`}
                      >
                        {day}
                      </span>
                      <div className="space-y-1">
                        {dayLinks.map((link) => (
                          <motion.div
                            key={link.id}
                            whileHover={{ scale: 1.02 }}
                            className="text-[10px] p-1.5 bg-primary/10 text-primary rounded border border-primary/20 truncate cursor-pointer hover:bg-primary/20 transition-colors"
                            title={link.title}
                          >
                            {new Date(link.scheduled_at!).toLocaleTimeString(
                              [],
                              { hour: "2-digit", minute: "2-digit" }
                            )}{" "}
                            {link.title}
                          </motion.div>
                        ))}
                      </div>
                    </>
                  )}
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Upcoming Readings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-2xl font-serif font-bold text-foreground mb-6 flex items-center gap-3">
            <BookOpen className="w-6 h-6 text-primary" />
            Upcoming Readings
          </h2>

          {upcomingLinks.length === 0 ? (
            <div className="retro-card p-12 text-center border-2 border-dashed">
              <CalendarIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground font-sans">
                No upcoming readings scheduled. Start planning your reading
                journey!
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {upcomingLinks.map((link, index) => (
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
            </div>
          )}
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="border-t-2 border-border bg-card/50 py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-muted-foreground text-sm font-sans">
            Plan your reading • Build the habit • Grow your mind
          </p>
        </div>
      </footer>
    </div>
  );
};

export default CalendarPage;
