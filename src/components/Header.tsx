/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * R-WAVE Universal Intelligence Lab - Navigation & Status Header
 */

import React, { useEffect, useState } from 'react';
import {
  Cpu,
  Layers,
  Sparkles,
  Network,
  Activity,
  Download,
  PlusCircle,
  Radio,
  CheckCircle2,
  Code2,
  FileSpreadsheet,
  FileText,
  Home,
  LayoutDashboard,
  Inbox,
} from 'lucide-react';
import { ModelContextProtocolAPI, WebMCPEvent } from '../types/webmcp';
import { exportBatchReports } from '../services/export-service';
import { ReportVault } from '../services/report-vault';

interface HeaderProps {
  mcp: ModelContextProtocolAPI;
  events?: WebMCPEvent[];
  activeTab: 'inspector' | 'agent' | 'canvas' | 'context' | 'events';
  onTabChange: (tab: 'inspector' | 'agent' | 'canvas' | 'context' | 'events') => void;
  onOpenCustomToolModal: () => void;
  onOpenReportInbox?: () => void;
  onOpenAutonomousDemo?: () => void;
  toolsCount: number;
  contextCount: number;
  eventCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  mcp,
  events = [],
  activeTab,
  onTabChange,
  onOpenCustomToolModal,
  onOpenReportInbox,
  onOpenAutonomousDemo,
  toolsCount,
  contextCount,
  eventCount,
}) => {
  const [vaultRecordsCount, setVaultRecordsCount] = useState<number>(() => ReportVault.getRecords().length);

  useEffect(() => {
    const unsub = ReportVault.subscribe((records) => {
      setVaultRecordsCount(records.length);
    });
    return () => unsub();
  }, []);

  const handleExportAllReports = () => {
    exportBatchReports(mcp, events, 'all');
  };

  const handleExportManifest = () => {
    const manifest = mcp.exportManifest();
    const blob = new Blob([JSON.stringify(manifest, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rwave-webmcp-manifest-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportCheckpoint = () => {
    const checkpoint = mcp.exportCheckpoint();
    const blob = new Blob([checkpoint], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rwave-session-checkpoint-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <header className="border-b border-[#1E293B] bg-[#0F172A]/70 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Brand and Protocol Badge */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <div
            onClick={() => onTabChange('inspector')}
            className="flex items-center gap-3 cursor-pointer group select-none"
            title="Return to Home / WebMCP Dashboard"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00CCCC] to-[#0D9488] shadow-[0_0_15px_rgba(0,204,204,0.4)] flex items-center justify-center text-[#0A0C14] font-black group-hover:scale-105 transition-transform">
              <Cpu className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-lg font-bold tracking-tight text-[#A5F3FC] group-hover:text-white transition-colors">
                  R-WAVE <span className="text-[#64748B] font-light text-sm hidden sm:inline">| Universal Intelligence Lab</span>
                </h1>
                <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-[#1E293B] rounded-full border border-[#334155]">
                  <div className="w-2 h-2 rounded-full bg-[#00CCCC] animate-cool-pulse" />
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[#A5F3FC]">WebMCP Active</span>
                </div>
              </div>
              <p className="text-[11px] text-[#94A3B8] font-normal">
                Browser Model Context Protocol • Native DOM Sandbox
              </p>
            </div>
          </div>

          {/* Quick Action buttons on mobile */}
          <div className="flex items-center gap-1.5 md:hidden">
            {onOpenAutonomousDemo && (
              <button
                id="mobile-launch-demo-btn"
                onClick={onOpenAutonomousDemo}
                className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-md bg-gradient-to-r from-[#00CCCC] to-[#0D9488] text-[#0A0C14] font-bold shadow-[0_0_10px_rgba(0,204,204,0.3)]"
                title="1-Click Autonomous Demo"
              >
                <Sparkles className="h-3.5 w-3.5 fill-current" />
                <span>Demo</span>
              </button>
            )}
            {onOpenReportInbox && (
              <button
                id="mobile-inbox-btn"
                onClick={onOpenReportInbox}
                className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-md bg-[#1E293B] text-[#A5F3FC] border border-[#334155] font-semibold"
                title="Report Inbox"
              >
                <Inbox className="h-3.5 w-3.5 text-[#00CCCC]" />
                <span>{vaultRecordsCount}</span>
              </button>
            )}
            <button
              id="mobile-home-btn"
              onClick={() => onTabChange('inspector')}
              className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-md border font-semibold ${
                activeTab === 'inspector'
                  ? 'bg-[#00CCCC] text-[#0A0C14] border-[#00CCCC]'
                  : 'bg-[#1E293B] text-[#A5F3FC] border-[#334155]'
              }`}
              title="Home / Dashboard"
            >
              <Home className="h-3.5 w-3.5" />
              <span>Home</span>
            </button>
            <button
              id="mobile-export-all-btn"
              onClick={handleExportAllReports}
              className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-md bg-[#00CCCC]/20 text-[#A5F3FC] border border-[#00CCCC]/40 font-semibold"
              title="Export All Reports"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export</span>
            </button>
            <button
              id="mobile-register-tool-btn"
              onClick={onOpenCustomToolModal}
              className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-md bg-[#00CCCC] text-[#0A0C14] font-bold shadow-[0_0_10px_rgba(0,204,204,0.3)] transition-all"
            >
              <PlusCircle className="h-3.5 w-3.5" />
              <span>Add</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center p-1 rounded-lg bg-[#0F172A]/80 border border-[#1E293B] text-xs font-medium w-full md:w-auto overflow-x-auto">
          {/* Home / Dashboard Navigation Button */}
          <button
            id="tab-btn-home"
            onClick={() => onTabChange('inspector')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'inspector'
                ? 'bg-[#1E293B] text-[#A5F3FC] border border-[#00CCCC]/40 shadow-[0_0_10px_rgba(0,204,204,0.2)] font-semibold'
                : 'text-[#94A3B8] hover:text-[#E0E7FF] hover:bg-[#1E293B]/50'
            }`}
            title="Return to Main Dashboard / Tool Registry"
          >
            <Home className="h-3.5 w-3.5 text-[#00CCCC]" />
            <span>Home / Dashboard</span>
          </button>

          <button
            id="tab-btn-agent"
            onClick={() => onTabChange('agent')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'agent'
                ? 'bg-[#1E293B] text-[#A5F3FC] border border-[#00CCCC]/40 shadow-[0_0_10px_rgba(0,204,204,0.2)] font-semibold'
                : 'text-[#94A3B8] hover:text-[#E0E7FF] hover:bg-[#1E293B]/50'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5 text-[#0D9488]" />
            <span>Agent Console</span>
          </button>

          <button
            id="tab-btn-canvas"
            onClick={() => onTabChange('canvas')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'canvas'
                ? 'bg-[#1E293B] text-[#00CCCC] border border-[#00CCCC]/60 shadow-[0_0_12px_rgba(0,204,204,0.3)] font-bold'
                : 'text-[#94A3B8] hover:text-[#E0E7FF] hover:bg-[#1E293B]/50'
            }`}
            title="Interactive Research Canvas (Read/Write Agent-Native Workspace)"
          >
            <Layers className="h-3.5 w-3.5 text-[#00CCCC]" />
            <span>Interactive Canvas</span>
            <span className="px-1.5 py-0.2 rounded-full bg-[#00CCCC]/20 text-[#00CCCC] text-[9px] font-mono font-bold">
              Live
            </span>
          </button>

          <button
            id="tab-btn-context"
            onClick={() => onTabChange('context')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'context'
                ? 'bg-[#1E293B] text-[#A5F3FC] border border-[#00CCCC]/40 shadow-[0_0_10px_rgba(0,204,204,0.2)] font-semibold'
                : 'text-[#94A3B8] hover:text-[#E0E7FF] hover:bg-[#1E293B]/50'
            }`}
          >
            <Network className="h-3.5 w-3.5 text-[#38BDF8]" />
            <span>Context Graph ({contextCount})</span>
          </button>

          <button
            id="tab-btn-events"
            onClick={() => onTabChange('events')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'events'
                ? 'bg-[#1E293B] text-[#A5F3FC] border border-[#00CCCC]/40 shadow-[0_0_10px_rgba(0,204,204,0.2)] font-semibold'
                : 'text-[#94A3B8] hover:text-[#E0E7FF] hover:bg-[#1E293B]/50'
            }`}
          >
            <Activity className="h-3.5 w-3.5 text-[#818CF8]" />
            <span>Event Bus ({eventCount})</span>
          </button>
        </div>

        {/* Global WebMCP Protocol Controls & Report Inbox */}
        <div className="hidden md:flex items-center gap-2.5">
          {/* 1-Click Autonomous Demo Showcase Button */}
          {onOpenAutonomousDemo && (
            <button
              id="header-launch-demo-btn"
              onClick={onOpenAutonomousDemo}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-[#00CCCC] to-[#0D9488] hover:opacity-95 text-[#0A0C14] font-bold text-xs uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(0,204,204,0.4)] cursor-pointer"
              title="Launch 1-Click Autonomous Demo Flow (Judge Showcase)"
            >
              <Sparkles className="h-3.5 w-3.5 fill-current" />
              <span>1-Click Demo</span>
            </button>
          )}

          {/* Report Inbox Button */}
          {onOpenReportInbox && (
            <button
              id="header-report-inbox-btn"
              onClick={onOpenReportInbox}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1E293B] hover:bg-[#334155] text-[#A5F3FC] border border-[#334155] hover:border-[#00CCCC]/40 font-semibold text-xs transition-all cursor-pointer"
              title="Open Report Inbox & Intelligence Vault"
            >
              <Inbox className="h-3.5 w-3.5 text-[#00CCCC]" />
              <span>Report Inbox</span>
              <span className="px-1.5 py-0.2 rounded-full bg-[#00CCCC]/20 text-[#00CCCC] text-[10px] font-mono font-bold">
                {vaultRecordsCount}
              </span>
            </button>
          )}

          {/* Prominent Export All Reports Button */}
          <button
            id="header-export-all-reports-btn"
            onClick={handleExportAllReports}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#00CCCC]/20 to-[#0D9488]/30 hover:from-[#00CCCC]/30 hover:to-[#0D9488]/40 border border-[#00CCCC]/60 text-[#A5F3FC] hover:text-white font-bold text-xs transition-all shadow-[0_0_12px_rgba(0,204,204,0.25)] cursor-pointer"
            title="Download comprehensive JSON & Markdown report containing all tool executions, context graph, and telemetry"
          >
            <Download className="h-3.5 w-3.5 text-[#00CCCC]" />
            <span>Export All</span>
          </button>

          <button
            id="header-add-tool-btn"
            onClick={onOpenCustomToolModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#00CCCC] hover:bg-[#00CCCC]/90 text-[#0A0C14] font-bold text-xs transition-all shadow-[0_0_12px_rgba(0,204,204,0.3)] cursor-pointer"
            title="Register a dynamic tool in document.modelContext"
          >
            <PlusCircle className="h-3.5 w-3.5" />
            <span>Register Tool</span>
          </button>

          <div className="flex items-center gap-1 bg-[#0F172A]/80 border border-[#1E293B] rounded-lg p-0.5">
            <button
              id="header-export-manifest-btn"
              onClick={handleExportManifest}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[#CBD5E1] hover:text-[#A5F3FC] hover:bg-[#1E293B] text-xs font-medium transition-colors cursor-pointer"
              title="Download MCP standard JSON manifest for LLMs"
            >
              <Code2 className="h-3.5 w-3.5 text-[#00CCCC]" />
              <span>Manifest</span>
            </button>
            <button
              id="header-export-checkpoint-btn"
              onClick={handleExportCheckpoint}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[#CBD5E1] hover:text-[#A5F3FC] hover:bg-[#1E293B] text-xs font-medium transition-colors cursor-pointer"
              title="Download snapshot of entire active context & execution state"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-[#0D9488]" />
              <span>Checkpoint</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
