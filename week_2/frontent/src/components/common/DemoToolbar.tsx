import { ExternalLink, QrCode, RefreshCw, Smartphone, Users, UtensilsCrossed } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import type { WaitlistEntry } from '../../types';
import { useToast } from './Toast';

interface DemoToolbarProps {
  currentView: 'host' | 'guest';
  guestToken: string | null;
  onNavigateToHost: () => void;
  onNavigateToGuest: (token: string) => void;
  onOpenQRModal: (entry?: WaitlistEntry) => void;
}

export const DemoToolbar: React.FC<DemoToolbarProps> = ({
  currentView,
  guestToken,
  onNavigateToHost,
  onNavigateToGuest,
  onOpenQRModal,
}) => {
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [isResetting, setIsResetting] = useState(false);
  const { showToast } = useToast();

  const loadEntries = async () => {
    try {
      const list = await api.waitlist.list();
      setEntries(list);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadEntries();
    const unsub = api.realtime.subscribe('*', () => {
      loadEntries();
    });
    return unsub;
  }, []);

  const handleResetData = async () => {
    if (confirm('Reset demo data back to default sample state?')) {
      setIsResetting(true);
      try {
        await api.realtime.resetDemoData();
        showToast('info', 'Demo Reset', 'Sample tables and waitlist restored to original state.');
        if (currentView === 'guest' && !entries.some((e) => e.public_token === guestToken)) {
          onNavigateToHost();
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsResetting(false);
      }
    }
  };

  const currentParty = entries.find((e) => e.public_token === guestToken);

  return (
    <header className="bg-slate-900 text-slate-100 border-b border-slate-800 sticky top-0 z-40 px-4 py-2.5 shadow-md">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Brand & Mode Switcher */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shadow-inner">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <div>
              <span className="font-black tracking-tight text-white text-base">MaitreQ</span>
              <span className="ml-1.5 text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                MVP Demo
              </span>
            </div>
          </div>

          <div className="h-5 w-px bg-slate-800 hidden sm:block" />

          {/* View Toggle Tabs */}
          <div className="flex items-center bg-slate-800/90 p-1 rounded-xl border border-slate-700/80 text-xs">
            <button
              onClick={onNavigateToHost}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                currentView === 'host'
                  ? 'bg-amber-500 text-slate-950 shadow-sm font-semibold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              Host Dashboard
            </button>
            <button
              onClick={() => {
                const target = currentParty || entries.find((e) => e.status === 'NOTIFIED') || entries.find((e) => e.status === 'WAITING') || entries[0];
                if (target) onNavigateToGuest(target.public_token);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                currentView === 'guest'
                  ? 'bg-amber-500 text-slate-950 shadow-sm font-semibold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              Guest Mobile View
            </button>
          </div>
        </div>

        {/* Guest Selector & Action Simulation */}
        <div className="flex items-center flex-wrap gap-2 text-xs">
          {/* Guest Party Selector Dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700">
            <span className="text-slate-400 hidden sm:inline">Guest:</span>
            <select
              value={guestToken || ''}
              onChange={(e) => {
                if (e.target.value) {
                  onNavigateToGuest(e.target.value);
                }
              }}
              className="bg-transparent text-slate-200 text-xs font-medium focus:outline-none cursor-pointer max-w-[140px] truncate"
            >
              <option value="" disabled className="bg-slate-800 text-slate-400">
                Select guest link...
              </option>
              {entries.map((item) => (
                <option key={item.id} value={item.public_token} className="bg-slate-800 text-slate-100">
                  {item.guest_name} ({item.status})
                </option>
              ))}
            </select>

            {guestToken && (
              <button
                onClick={() => {
                  const url = `${window.location.origin}${window.location.pathname}?view=guest&token=${guestToken}`;
                  window.open(url, '_blank', 'noopener,noreferrer');
                }}
                title="Open guest live tracking in a separate window to test multi-window real-time sync!"
                className="p-1 text-amber-400 hover:text-amber-300 hover:bg-slate-700 rounded transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* QR Code trigger */}
          <button
            onClick={() => onOpenQRModal(currentParty)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700 transition-colors"
            title="Preview QR Code for Guest Check-in & Status"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span className="hidden md:inline">QR Code</span>
          </button>

          {/* Reset Demo State */}
          <button
            onClick={handleResetData}
            disabled={isResetting}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-rose-400 hover:bg-slate-700 border border-slate-700 transition-colors"
            title="Reset to default seed data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
            <span className="hidden lg:inline">Reset Demo</span>
          </button>
        </div>
      </div>
    </header>
  );
};
