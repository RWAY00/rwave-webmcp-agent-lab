/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * R-WAVE Universal Intelligence Lab - WebMCP Challenge Application
 */

import React, { useEffect, useState } from 'react';
import { initWebMCP } from './lib/webmcp-polyfill';
import { registerDefaultRWAVETools, seedInitialRWAVEContext } from './services/rwave-tools';
import { Header } from './components/Header';
import { WebMCPInspector } from './components/WebMCPInspector';
import { AgentCollaborator } from './components/AgentCollaborator';
import { InteractiveCanvasView } from './components/InteractiveCanvasView';
import { ContextGraphView } from './components/ContextGraphView';
import { EventStreamLogger } from './components/EventStreamLogger';
import { CustomToolModal } from './components/CustomToolModal';
import { ReportInboxDrawer } from './components/ReportInboxDrawer';
import { AutonomousDemoModal } from './components/AutonomousDemoModal';
import { TelemetryBar } from './components/TelemetryBar';
import {
  WebMCPTool,
  WebMCPContextItem,
  WebMCPEvent,
  TelemetryMetrics,
} from './types/webmcp';

export default function App() {
  const [mcp] = useState(() => initWebMCP());
  const [activeTab, setActiveTab] = useState<'inspector' | 'agent' | 'canvas' | 'context' | 'events'>('inspector');
  const [tools, setTools] = useState<WebMCPTool[]>([]);
  const [contextItems, setContextItems] = useState<WebMCPContextItem[]>([]);
  const [events, setEvents] = useState<WebMCPEvent[]>([]);
  const [isCustomToolModalOpen, setIsCustomToolModalOpen] = useState(false);
  const [isReportInboxOpen, setIsReportInboxOpen] = useState(false);
  const [isAutonomousDemoOpen, setIsAutonomousDemoOpen] = useState(false);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);

  // Initialize tools and initial context once
  useEffect(() => {
    registerDefaultRWAVETools(mcp);
    seedInitialRWAVEContext(mcp);

    // Refresh local react state
    setTools(mcp.getTools());
    setContextItems(mcp.getContext());

    // Subscribe to WebMCP Event Bus
    const unsubRegistered = mcp.subscribe('modelcontext:toolregistered', (e: any) => {
      setTools(mcp.getTools());
      const eventMeta = e.detail?._eventMeta || {
        id: `evt_${Date.now()}`,
        type: 'modelcontext:toolregistered',
        timestamp: Date.now(),
        details: e.detail,
      };
      setEvents((prev) => [eventMeta, ...prev.slice(0, 150)]);
    });

    const unsubExecuted = mcp.subscribe('modelcontext:toolexecuted', (e: any) => {
      const eventMeta = e.detail?._eventMeta || {
        id: `evt_${Date.now()}`,
        type: 'modelcontext:toolexecuted',
        timestamp: Date.now(),
        details: e.detail,
      };
      setEvents((prev) => [eventMeta, ...prev.slice(0, 150)]);
    });

    const unsubContext = mcp.subscribe('modelcontext:contextupdated', (e: any) => {
      setContextItems(mcp.getContext());
      const eventMeta = e.detail?._eventMeta || {
        id: `evt_${Date.now()}`,
        type: 'modelcontext:contextupdated',
        timestamp: Date.now(),
        details: e.detail,
      };
      setEvents((prev) => [eventMeta, ...prev.slice(0, 150)]);
    });

    return () => {
      unsubRegistered();
      unsubExecuted();
      unsubContext();
    };
  }, [mcp]);

  const handleOpenReportInbox = (reportId?: string) => {
    if (reportId) {
      setSelectedReportId(reportId);
    }
    setIsReportInboxOpen(true);
  };

  // Calculate telemetry metrics
  let memoryMB = 24.5;
  if (typeof performance !== 'undefined' && (performance as any).memory) {
    memoryMB = Math.round(((performance as any).memory.usedJSHeapSize / (1024 * 1024)) * 10) / 10;
  }

  const metrics: TelemetryMetrics = {
    fps: 60,
    memoryMB,
    registeredToolsCount: tools.length,
    contextNodesCount: contextItems.length,
    totalToolExecutions: events.filter((e) => e.type === 'modelcontext:toolexecuted').length,
    avgLatencyMs: 14.2,
    activeSandboxState: 'secure',
  };

  return (
    <div className="min-h-screen bg-[#0A0C14] text-[#E0E7FF] flex flex-col font-sans selection:bg-[#00CCCC]/30 selection:text-[#A5F3FC]">
      {/* Top Header */}
      <Header
        mcp={mcp}
        events={events}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenCustomToolModal={() => setIsCustomToolModalOpen(true)}
        onOpenReportInbox={() => handleOpenReportInbox()}
        onOpenAutonomousDemo={() => setIsAutonomousDemoOpen(true)}
        toolsCount={tools.length}
        contextCount={contextItems.length}
        eventCount={events.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {activeTab === 'inspector' && (
          <WebMCPInspector
            mcp={mcp}
            tools={tools}
            events={events}
            onOpenCustomToolModal={() => setIsCustomToolModalOpen(true)}
            onViewContextGraph={() => setActiveTab('context')}
            onOpenReportInbox={(id) => handleOpenReportInbox(id)}
            onOpenAutonomousDemo={() => setIsAutonomousDemoOpen(true)}
            onNavigateToCanvas={() => setActiveTab('canvas')}
          />
        )}

        {activeTab === 'agent' && <AgentCollaborator mcp={mcp} />}

        {activeTab === 'canvas' && (
          <InteractiveCanvasView
            mcp={mcp}
            onNavigateToAgent={() => setActiveTab('agent')}
          />
        )}

        {activeTab === 'context' && (
          <ContextGraphView mcp={mcp} contextItems={contextItems} />
        )}

        {activeTab === 'events' && (
          <EventStreamLogger events={events} onClearEvents={() => setEvents([])} />
        )}
      </main>

      {/* Persistent Live Telemetry Bar */}
      <TelemetryBar metrics={metrics} />

      {/* 1-Click Autonomous Demo Flow Modal */}
      <AutonomousDemoModal
        mcp={mcp}
        isOpen={isAutonomousDemoOpen}
        onClose={() => setIsAutonomousDemoOpen(false)}
        onNavigateToCanvas={() => {
          setIsAutonomousDemoOpen(false);
          setActiveTab('canvas');
        }}
      />

      {/* Custom Tool Creator Modal */}
      <CustomToolModal
        mcp={mcp}
        isOpen={isCustomToolModalOpen}
        onClose={() => setIsCustomToolModalOpen(false)}
        onToolCreated={() => setTools(mcp.getTools())}
      />

      {/* Report Inbox & Intelligence Vault Drawer */}
      <ReportInboxDrawer
        isOpen={isReportInboxOpen}
        onClose={() => {
          setIsReportInboxOpen(false);
          setSelectedReportId(null);
        }}
        selectedReportId={selectedReportId}
      />
    </div>
  );
}
