'use client';

import { Link } from '@/types';
import { api } from '@/lib/api';
import { Star, Trash2, ExternalLink, BookOpen, Clock, Link2, AlertTriangle, X, Play, Calendar, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';

interface LinkCardProps {
  link: Link;
  onUpdate: () => void;
}

export default function LinkCard({ link, onUpdate }: LinkCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');

  const toggleRead = async () => {
    try {
      await api.updateLink(link.id, { is_read: !link.is_read });
      onUpdate();
    } catch (error) {
      console.error('Failed to toggle read status:', error);
    }
  };

  const toggleFavorite = async () => {
    try {
      await api.updateLink(link.id, { is_favorite: !link.is_favorite });
      onUpdate();
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  const handleSchedule = async () => {
    try {
      await api.updateLink(link.id, { scheduled_at: scheduleDate || null });
      onUpdate();
      setShowScheduleModal(false);
    } catch (error) {
      console.error('Failed to schedule link:', error);
    }
  };

  const confirmDelete = async () => {
    setIsDeleting(true);
    try {
      await api.deleteLink(link.id);
      onUpdate();
      setShowDeleteModal(false);
    } catch (error) {
      console.error('Failed to delete link:', error);
      setIsDeleting(false);
    }
  };

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

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow ${link.is_read ? 'opacity-60' : ''}`}>
      {/* Media Preview */}
      {(link.image_url || link.video_url) && (
        <div 
          className="relative h-48 w-full bg-gray-100 cursor-pointer group"
          onClick={() => setShowMediaModal(true)}
        >
          {link.image_url && (
            <img 
              src={link.image_url} 
              alt={link.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          )}
          {link.video_url && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors">
              <div className="p-3 bg-white/90 rounded-full shadow-lg">
                <Play className="w-6 h-6 text-blue-600 fill-current" />
              </div>
            </div>
          )}
        </div>
      )}

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-lg font-semibold text-gray-900 hover:text-blue-600 line-clamp-2 flex items-center gap-2 group"
            >
              {link.title}
              <ExternalLink className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
            </a>
            
            {link.domain && (
              <p className="text-sm text-gray-500 mt-1">{link.domain}</p>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowScheduleModal(true)}
              className={`p-2 rounded-lg transition-colors ${
                link.scheduled_at
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'
              }`}
              title="Schedule reading"
            >
              <Calendar className="w-5 h-5" />
            </button>

            <button
              onClick={toggleFavorite}
              className={`p-2 rounded-lg transition-colors ${
                link.is_favorite
                  ? 'text-yellow-500 hover:text-yellow-600'
                  : 'text-gray-400 hover:text-yellow-500'
              }`}
              title={link.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              <Star className="w-5 h-5" fill={link.is_favorite ? 'currentColor' : 'none'} />
            </button>

            <button
              onClick={() => setShowDeleteModal(true)}
              disabled={isDeleting}
              className="p-2 rounded-lg text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
              title="Delete link"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scheduled Badge */}
        {link.scheduled_at && (
          <div className="mb-3 flex items-center gap-2 px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium border border-blue-100">
            <Clock className="w-3 h-3" />
            Scheduled for: {new Date(link.scheduled_at).toLocaleString()}
          </div>
        )}

        {/* Summary */}
      {link.summary && (
        <p className="text-gray-700 text-sm line-clamp-3 mb-3">
          {link.summary}
        </p>
      )}

      {/* Metadata */}
      <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
        {link.reading_time && link.reading_time > 0 && (
          <span className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            {link.reading_time} min read
          </span>
        )}
        
        {link.author && (
          <span className="truncate">by {link.author}</span>
        )}

        <span className="ml-auto">{formatDate(link.created_at)}</span>
      </div>

      {/* Tags */}
      {link.tags && link.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {link.tags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-1 bg-blue-50 text-blue-600 rounded-md text-xs font-medium"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Nested Links */}
      {link.nested_links && link.nested_links.length > 0 && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">
            <Link2 className="w-3 h-3" />
            Links found in this post
          </p>
          <div className="space-y-2">
            {link.nested_links.map((url, idx) => (
              <a
                key={idx}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-sm text-blue-600 hover:underline truncate"
              >
                {url}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
        <button
          onClick={toggleRead}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            link.is_read
              ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              : 'bg-blue-500 text-white hover:bg-blue-600'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          {link.is_read ? 'Mark Unread' : 'Mark as Read'}
        </button>
      </div>
    </div>

      {/* Media Modal */}
      {showMediaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative max-w-5xl w-full aspect-video bg-black rounded-xl overflow-hidden shadow-2xl">
            <button 
              onClick={() => setShowMediaModal(false)}
              className="absolute top-4 right-4 z-10 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
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
          </div>
        </div>
      )}

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Calendar className="w-6 h-6 text-blue-600" />
                </div>
                <button 
                  onClick={() => setShowScheduleModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 mb-2">Schedule Reading</h3>
              <p className="text-gray-600 mb-6">
                Set a date and time to read <span className="font-semibold text-gray-900">"{link.title}"</span>.
              </p>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reading Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setScheduleDate('');
                    handleSchedule();
                  }}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Clear
                </button>
                <button
                  onClick={handleSchedule}
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  Save Schedule
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-red-100 rounded-lg">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <button 
                  onClick={() => setShowDeleteModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Link?</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete <span className="font-semibold text-gray-900">"{link.title}"</span>? This action cannot be undone.
              </p>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isDeleting ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    'Delete'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
