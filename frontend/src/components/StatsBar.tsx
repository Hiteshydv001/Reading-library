'use client';

import { Stats } from '@/types';
import { BookOpen, Star, CheckCircle, Link as LinkIcon, Calendar } from 'lucide-react';

interface StatsBarProps {
  stats: Stats;
}

export default function StatsBar({ stats }: StatsBarProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 mb-1">Total</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total_links}</p>
          </div>
          <div className="p-3 bg-blue-50 rounded-lg">
            <LinkIcon className="w-6 h-6 text-blue-600" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 mb-1">Unread</p>
            <p className="text-2xl font-bold text-gray-900">{stats.unread}</p>
          </div>
          <div className="p-3 bg-orange-50 rounded-lg">
            <BookOpen className="w-6 h-6 text-orange-600" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 mb-1">Read</p>
            <p className="text-2xl font-bold text-gray-900">{stats.read}</p>
          </div>
          <div className="p-3 bg-green-50 rounded-lg">
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 mb-1">Favorites</p>
            <p className="text-2xl font-bold text-gray-900">{stats.favorites}</p>
          </div>
          <div className="p-3 bg-yellow-50 rounded-lg">
            <Star className="w-6 h-6 text-yellow-600" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 mb-1">Scheduled</p>
            <p className="text-2xl font-bold text-gray-900">{stats.scheduled}</p>
          </div>
          <div className="p-3 bg-indigo-50 rounded-lg">
            <Calendar className="w-6 h-6 text-indigo-600" />
          </div>
        </div>
      </div>
    </div>
  );
}
