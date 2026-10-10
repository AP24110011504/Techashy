import React from 'react';
import { AppHeader } from './AppHeader';
import { AppSidebar } from './AppSidebar';
import { AppFooter } from './AppFooter';

export function AppLayout({
  currentPath,
  onNavigate,
  status,
  incident,
  eventsCount = 0,
  activeIncidentsCount = 0,
  pendingContainmentCount = 0,
  connectionMode,
  isMockData,
  onRefresh,
  onToggleMock,
  isRefreshing,
  children
}) {
  return (
    <div className="min-h-screen bg-[#FBF9FA] text-[#172033] flex flex-col font-sans antialiased">
      {/* 4. SHARED APPLICATION HEADER */}
      <AppHeader
        status={status}
        incident={incident}
        eventsCount={eventsCount}
        connectionMode={connectionMode}
        isMockData={isMockData}
        onRefresh={onRefresh}
        onToggleMock={onToggleMock}
        isRefreshing={isRefreshing}
      />

      {/* BODY WITH SHARED SIDEBAR AND MAIN CONTENT */}
      <div className="flex-1 flex flex-row">
        {/* 5. SHARED SIDEBAR */}
        <AppSidebar
          currentPath={currentPath}
          onNavigate={onNavigate}
          activeIncidentsCount={activeIncidentsCount}
          pendingContainmentCount={pendingContainmentCount}
        />

        {/* MAIN ROUTED CONTENT */}
        <main className="flex-1 min-w-0 px-4 sm:px-6 lg:px-9 py-6 max-w-[1686px] overflow-x-hidden">
          {children}
        </main>
      </div>

      {/* FOOTER */}
      <AppFooter isMockData={isMockData} />
    </div>
  );
}
