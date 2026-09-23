import React from 'react';
import type { TableStatus, WaitlistStatus } from '../../types';

interface StatusBadgeProps {
  status: WaitlistStatus | TableStatus;
  size?: 'sm' | 'md' | 'lg';
  pulse?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md', pulse = false }) => {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 font-medium',
    md: 'text-xs px-2.5 py-1 font-semibold',
    lg: 'text-sm px-3.5 py-1.5 font-bold',
  }[size];

  switch (status) {
    case 'WAITING':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 ${sizeClasses}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
          Waiting
        </span>
      );
    case 'NOTIFIED':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-sm ${sizeClasses} ${
            pulse ? 'animate-bounce ring-2 ring-emerald-400' : ''
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
          Table Ready!
        </span>
      );
    case 'SEATED':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200 ${sizeClasses}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
          Seated
        </span>
      );
    case 'CANCELLED':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 ${sizeClasses}`}>
          Cancelled
        </span>
      );
    case 'NO_SHOW':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 ${sizeClasses}`}>
          No-Show
        </span>
      );
    case 'AVAILABLE':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 ${sizeClasses}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          Available
        </span>
      );
    case 'OCCUPIED':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 ${sizeClasses}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
          Occupied
        </span>
      );
    case 'RESERVED':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200 ${sizeClasses}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span>
          Reserved
        </span>
      );
    default:
      return <span className={`rounded-md bg-gray-100 text-gray-700 ${sizeClasses}`}>{status}</span>;
  }
};

export const PartySizeBadge: React.FC<{ size: number }> = ({ size }) => {
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200">
      <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
        />
      </svg>
      {size} {size === 1 ? 'Guest' : 'Guests'}
    </span>
  );
};
