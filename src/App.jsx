import React from 'react';
import { useRouter } from './hooks/useRouter';
import { useSentinel } from './hooks/useSentinel';
import { AppLayout } from './components/layout/AppLayout';
import { OverviewPage } from './pages/OverviewPage';
import { IncidentsPage } from './pages/IncidentsPage';
import { ThreatGraphPage } from './pages/ThreatGraphPage';
import { ContainmentPage } from './pages/ContainmentPage';
import { ForensicsPage } from './pages/ForensicsPage';
import { AuditLedgerPage } from './pages/AuditLedgerPage';

export function App() {
  const { currentPath, navigate } = useRouter();
  const {
    status,
    sources,
    incident,
    events,
    evidence,
    chainValid,
    investigations,
    containmentAction,
    auditLog,
    containmentHosts,
    incidentsList,
    forensicArtifacts,
    voiceHistory,
    loading,
    isSimulating,
    simulationResult,
    isApproving,
    isLockingDown,
    isQueryingVoice,
    connectionMode,
    isMockData,
    error,
    refreshAll,
    runSimulation,
    approveAction,
    triggerEmergencyLockdown,
    askAegis,
    resetSimulation,
    toggleMockMode
  } = useSentinel();

  // Active counts for sidebar badges
  const isCritical = incident?.severity === 'CRITICAL' || (incident?.threatScore && incident.threatScore > 50);
  const activeIncidentsCount = isCritical ? 1 : 0;
  const pendingContainmentCount = containmentAction?.status === 'PENDING' ? 1 : 0;

  // Render current routed page
  const renderCurrentPage = () => {
    switch (currentPath) {
      case '/incidents':
        return (
          <IncidentsPage
            incidents={incidentsList}
            events={events}
            onNavigate={navigate}
          />
        );

      case '/threat-graph':
        return (
          <ThreatGraphPage
            incident={incident}
            events={events}
            onRunSimulation={runSimulation}
            isSimulating={isSimulating}
            onNavigate={navigate}
          />
        );

      case '/containment':
        return (
          <ContainmentPage
            containmentAction={containmentAction}
            containmentHosts={containmentHosts}
            onApproveAction={approveAction}
            isApproving={isApproving}
            onTriggerEmergencyLockdown={triggerEmergencyLockdown}
            isLockingDown={isLockingDown}
          />
        );

      case '/forensics':
        return (
          <ForensicsPage
            forensicArtifacts={forensicArtifacts}
            incident={incident}
          />
        );

      case '/audit-ledger':
        return (
          <AuditLedgerPage
            auditLog={auditLog}
          />
        );

      case '/':
      default:
        return (
          <OverviewPage
            incident={incident}
            sources={sources}
            events={events}
            evidence={evidence}
            investigations={investigations}
            voiceHistory={voiceHistory}
            auditLog={auditLog}
            onRunSimulation={runSimulation}
            onResetSimulation={resetSimulation}
            isSimulating={isSimulating}
            simulationResult={simulationResult}
            onAskCopilot={askAegis}
            isQueryingVoice={isQueryingVoice}
            onNavigate={navigate}
          />
        );
    }
  };

  return (
    <AppLayout
      currentPath={currentPath}
      onNavigate={navigate}
      status={status}
      incident={incident}
      eventsCount={events.length}
      activeIncidentsCount={activeIncidentsCount}
      pendingContainmentCount={pendingContainmentCount}
      connectionMode={connectionMode}
      isMockData={isMockData}
      onRefresh={refreshAll}
      onToggleMock={toggleMockMode}
      isRefreshing={loading}
    >
      {renderCurrentPage()}
    </AppLayout>
  );
}

export default App;
