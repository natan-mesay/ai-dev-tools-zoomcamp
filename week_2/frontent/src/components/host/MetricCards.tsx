import { Clock, LayoutGrid, UserCheck, Users } from 'lucide-react';
import React from 'react';
import type { DashboardStats } from '../../types';

interface MetricCardsProps {
  stats: DashboardStats;
}

export const MetricCards: React.FC<MetricCardsProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6">
      {/* 1. Total Waiting */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Waiting in Queue</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">{stats.total_waiting}</span>
            {stats.total_notified > 0 && (
              <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                +{stats.total_notified} notified
              </span>
            )}
          </div>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
          <Users className="w-6 h-6" />
        </div>
      </div>

      {/* 2. Estimated Avg Wait */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Avg Wait Time</p>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">{stats.avg_wait_minutes}</span>
            <span className="text-sm font-semibold text-slate-500">mins</span>
          </div>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
          <Clock className="w-6 h-6" />
        </div>
      </div>

      {/* 3. Available Tables */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Available Tables</p>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl sm:text-3xl font-black text-emerald-600">{stats.available_tables}</span>
            <span className="text-sm font-medium text-slate-400">/ {stats.total_tables} total</span>
          </div>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
          <LayoutGrid className="w-6 h-6" />
        </div>
      </div>

      {/* 4. Seated Today */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Seated Today</p>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl sm:text-3xl font-black text-blue-600">{stats.total_seated_today}</span>
            <span className="text-sm font-semibold text-slate-500">parties</span>
          </div>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
          <UserCheck className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
};
