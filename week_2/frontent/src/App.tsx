import { useEffect, useState } from 'react';
import { DemoToolbar } from './components/common/DemoToolbar';
import { ToastProvider } from './components/common/Toast';
import { GuestPortal } from './components/guest/GuestPortal';
import { GuestLinkModal } from './components/host/GuestLinkModal';
import { HostDashboard } from './components/host/HostDashboard';
import { api } from './services/api';
import type { WaitlistEntry } from './types';

export function App() {
  const [currentView, setCurrentView] = useState<'host' | 'guest'>('host');
  const [guestToken, setGuestToken] = useState<string | null>(null);
  const [qrModalParty, setQrModalParty] = useState<WaitlistEntry | null>(null);

  // Sync route from URL search params on mount & popstate
  useEffect(() => {
    const syncFromUrl = () => {
      const params = new URLSearchParams(window.location.search);
      const viewParam = params.get('view');
      const tokenParam = params.get('token');

      if (viewParam === 'guest' && tokenParam) {
        setCurrentView('guest');
        setGuestToken(tokenParam);
      } else {
        setCurrentView('host');
        // Default token for quick preview
        if (!guestToken) {
          api.waitlist.list().then((list) => {
            const active = list.find((e) => e.status === 'WAITING' || e.status === 'NOTIFIED') || list[0];
            if (active) setGuestToken(active.public_token);
          });
        }
      }
    };

    syncFromUrl();
    window.addEventListener('popstate', syncFromUrl);
    return () => window.removeEventListener('popstate', syncFromUrl);
  }, []);

  const navigateToHost = () => {
    setCurrentView('host');
    const url = new URL(window.location.href);
    url.searchParams.delete('view');
    url.searchParams.delete('token');
    window.history.pushState({}, '', url.toString());
  };

  const navigateToGuest = (token: string) => {
    setCurrentView('guest');
    setGuestToken(token);
    const url = new URL(window.location.href);
    url.searchParams.set('view', 'guest');
    url.searchParams.set('token', token);
    window.history.pushState({}, '', url.toString());
  };

  const handleOpenQRModal = (party?: WaitlistEntry) => {
    if (party) {
      setQrModalParty(party);
    } else {
      // Find current selected guest party
      api.waitlist.list().then((list) => {
        const found = list.find((e) => e.public_token === guestToken) || list[0];
        if (found) setQrModalParty(found);
      });
    }
  };

  return (
    <ToastProvider>
      <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-amber-500 selection:text-slate-950 font-sans">
        {/* Persistent Demo Toolbar */}
        <DemoToolbar
          currentView={currentView}
          guestToken={guestToken}
          onNavigateToHost={navigateToHost}
          onNavigateToGuest={navigateToGuest}
          onOpenQRModal={handleOpenQRModal}
        />

        {/* View Switcher */}
        <main className="flex-1">
          {currentView === 'host' ? (
            <HostDashboard />
          ) : (
            <GuestPortal
              token={guestToken || 'sarah-j-9821'}
              onBackToHost={navigateToHost}
            />
          )}
        </main>

        {/* Global QR Code Modal */}
        <GuestLinkModal
          isOpen={!!qrModalParty}
          onClose={() => setQrModalParty(null)}
          party={qrModalParty}
        />
      </div>
    </ToastProvider>
  );
}

export default App;
