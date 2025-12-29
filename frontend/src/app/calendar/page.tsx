'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Link, Stats } from '@/types';
import LinkCard from '@/components/LinkCard';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, BookMarked, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import NextLink from 'next/link';

export default function CalendarPage() {
  const [links, setLinks] = useState<Link[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const router = useRouter();

  const fetchData = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const data = await api.getLinks({ is_scheduled: true } as any);
      setLinks(data.links);
    } catch (error) {
      console.error('Error fetching scheduled links:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const monthName = currentDate.toLocaleString('default', { month: 'long' });
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const days = [];
  const totalDays = daysInMonth(year, month);
  const startDay = firstDayOfMonth(year, month);

  // Fill empty slots for previous month
  for (let i = 0; i < startDay; i++) {
    days.push(null);
  }

  // Fill days of the month
  for (let i = 1; i <= totalDays; i++) {
    days.push(i);
  }

  const getLinksForDay = (day: number) => {
    return links.filter(link => {
      if (!link.scheduled_at) return false;
      const d = new Date(link.scheduled_at);
      return d.getDate() === day && d.getMonth() === month && d.getFullYear() === year;
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <NextLink href="/" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <ArrowLeft className="w-6 h-6 text-gray-600" />
              </NextLink>
              <div className="p-2 bg-indigo-600 rounded-lg">
                <CalendarIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Reading Calendar</h1>
                <p className="text-sm text-gray-500">Manage your scheduled readings</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Calendar Header */}
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">
              {monthName} {year}
            </h2>
            <div className="flex items-center gap-2">
              <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setCurrentDate(new Date())}
                className="px-3 py-1 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-md"
              >
                Today
              </button>
              <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 bg-gray-200 gap-px">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="bg-gray-50 py-2 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {day}
              </div>
            ))}
            {days.map((day, idx) => {
              const dayLinks = day ? getLinksForDay(day) : [];
              const isToday = day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();

              return (
                <div 
                  key={idx} 
                  className={`bg-white min-h-[120px] p-2 transition-colors ${day ? 'hover:bg-gray-50' : ''}`}
                >
                  {day && (
                    <>
                      <span className={`inline-flex items-center justify-center w-7 h-7 text-sm font-medium rounded-full mb-1 ${
                        isToday ? 'bg-blue-600 text-white' : 'text-gray-700'
                      }`}>
                        {day}
                      </span>
                      <div className="space-y-1">
                        {dayLinks.map(link => (
                          <div 
                            key={link.id}
                            className="text-[10px] p-1 bg-blue-50 text-blue-700 rounded border border-blue-100 truncate cursor-pointer hover:bg-blue-100"
                            title={link.title}
                          >
                            {new Date(link.scheduled_at!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} {link.title}
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Upcoming List */}
        <div className="mt-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Upcoming Readings</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {links
              .filter(l => new Date(l.scheduled_at!) >= new Date())
              .sort((a, b) => new Date(a.scheduled_at!).getTime() - new Date(b.scheduled_at!).getTime())
              .map(link => (
                <LinkCard key={link.id} link={link} onUpdate={fetchData} />
              ))
            }
            {links.filter(l => new Date(l.scheduled_at!) >= new Date()).length === 0 && (
              <div className="col-span-full text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
                <p className="text-gray-500">No upcoming readings scheduled.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
