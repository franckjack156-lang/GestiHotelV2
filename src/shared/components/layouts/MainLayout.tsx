/**
 * MainLayout Component
 *
 * Layout principal de l'application avec Header, Sidebar et Footer
 */

import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { Footer } from './Footer';
import { useApplyPreferences } from '@/features/users/hooks/useApplyPreferences';
import { useUserPreferences } from '@/features/users/hooks/useUserPreferences';
import { OfflineBanner } from '@/shared/components/indicators/NetworkIndicator';
import { GlobalSearch } from '@/shared/components/search';

export const MainLayout = () => {
  const { displayPreferences, updateDisplayPreferences } = useUserPreferences();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Appliquer l'état initial du sidebar depuis les préférences
  useEffect(() => {
    if (displayPreferences?.sidebarCollapsed !== undefined) {
      setSidebarOpen(!displayPreferences.sidebarCollapsed);
    }
  }, [displayPreferences?.sidebarCollapsed]);

  // Appliquer les préférences utilisateur
  useApplyPreferences();

  // Handler pour toggle sidebar avec sauvegarde
  const handleToggleSidebar = () => {
    const newState = !sidebarOpen;
    setSidebarOpen(newState);
    updateDisplayPreferences({ sidebarCollapsed: !newState });
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
      {/* Offline Banner - affiché en haut de tout */}
      <OfflineBanner />

      {/* Global Search - Cmd+K */}
      <GlobalSearch />

      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        isCollapsed={displayPreferences?.sidebarCollapsed || false}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Contenu principal */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <Header onMenuClick={handleToggleSidebar} />

        {/* Contenu de la page */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>

        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
};
