/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * R-WAVE Universal Intelligence Lab - Interactive Research Canvas (Read/Write Agent-Native Workspace)
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutGrid,
  GitFork,
  Clock,
  Sparkles,
  PlusCircle,
  CheckCircle2,
  XCircle,
  Edit3,
  Play,
  Trash2,
  AlertTriangle,
  Layers,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  Zap,
  Info,
  ExternalLink,
  RefreshCw,
  Eye,
  CheckSquare,
  Square,
  Activity,
  Maximize2,
  Minimize2,
  Download,
  Terminal,
  Cpu,
  Hash,
  Database,
  SlidersHorizontal,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  CanvasItem,
  CanvasItemType,
  CanvasItemStatus,
  PipelineStep,
  ChecklistItem,
} from '../types/canvas';
import { CanvasStore } from '../services/canvas-store';
import { ModelContextProtocolAPI } from '../types/webmcp';

interface InteractiveCanvasViewProps {
  mcp: ModelContextProtocolAPI;
  onNavigateToAgent?: () => void;
}

export const InteractiveCanvasView: React.FC<InteractiveCanvasViewProps> = ({
  mcp,
  onNavigateToAgent,
}) => {
  const [items, setItems] = useState<CanvasItem[]>(() => CanvasStore.getItems());
  const [selectedItem, setSelectedItem] = useState<CanvasItem | null>(null);
  const [filterType, setFilterType] = useState<CanvasItemType | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<CanvasItemStatus | 'all'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'mindmap' | 'timeline'>('grid');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CanvasItem | null>(null);
  const [isExecutingSim, setIsExecutingSim] = useState<Record<string, boolean>>({});
  const [execMessage, setExecMessage] = useState<string | null>(null);

  // Subscribe to CanvasStore
  useEffect(() => {
    const unsub = CanvasStore.subscribe((newItems) => {
      setItems(newItems);
      // Keep selected item updated
      if (selectedItem) {
        const found = newItems.find((i) => i.id === selectedItem.id);
        setSelectedItem(found || null);
      }
    });
    return () => unsub();
  }, [selectedItem]);

  // Filter items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (filterType !== 'all' && item.type !== filterType) return false;
      if (filterStatus !== 'all' && item.status !== filterStatus) return false;
      return true;
    });
  }, [items, filterType, filterStatus]);

  // Statistics
  const stats = useMemo(() => {
    const total = items.length;
    const proposed = items.filter((i) => i.status === 'proposed_by_agent').length;
    const approved = items.filter((i) => i.status === 'approved' || i.status === 'completed').length;
    const byAgent = items.filter((i) => i.createdBy === 'agent').length;
    return { total, proposed, approved, byAgent };
  }, [items]);

  // Action: Approve
  const handleApprove = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    CanvasStore.approveItem(id, 'Approved via Human-in-the-Loop Co-Creation');
    setExecMessage('Widget successfully approved by Human User.');
    setTimeout(() => setExecMessage(null), 3000);
  };

  // Action: Reject
  const handleReject = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    CanvasStore.rejectItem(id, 'Rejected by Human User');
    setExecMessage('Widget proposal rejected.');
    setTimeout(() => setExecMessage(null), 3000);
  };

  // Action: Delete
  const handleDelete = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    CanvasStore.deleteItem(id);
    if (selectedItem?.id === id) setSelectedItem(null);
  };

  // Action: Edit
  const handleOpenEdit = (item: CanvasItem, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditingItem(item);
    setIsEditModalOpen(true);
  };

  // Action: Toggle Checklist Item
  const handleToggleChecklist = (itemId: string, checkId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const target = CanvasStore.getItem(itemId);
    if (!target || !target.payload.checklist) return;

    const updatedChecklist = target.payload.checklist.map((chk: ChecklistItem) =>
      chk.id === checkId ? { ...chk, completed: !chk.completed } : chk
    );

    CanvasStore.updateItem(
      itemId,
      {
        payload: {
          ...target.payload,
          checklist: updatedChecklist,
        },
      },
      'Human User (Checklist Toggle)'
    );
  };

  // Action: Execute Autonomous Routine on Widget
  const handleExecuteAutonomousRoutine = async (item: CanvasItem, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setIsExecutingSim((prev) => ({ ...prev, [item.id]: true }));

    try {
      if (item.type === 'simulation_pipeline') {
        const result = await mcp.executeTool('rwave_autonomous_executor', {
          action: 'run_pipeline',
          targetCanvasItemId: item.id,
          parameters: { pipelineSpeed: 'fast' },
          autoUpdateCanvas: true,
        });

        setExecMessage(`Pipeline executed successfully! Proof: ${result.data?.deterministicProof?.slice(0, 18)}...`);
      } else if (item.type === 'decision_alert') {
        const result = await mcp.executeTool('rwave_autonomous_executor', {
          action: 'trigger_mock_transaction',
          targetCanvasItemId: item.id,
          parameters: {
            transferAmount: '250.00',
            symbol: 'RWAVE-GOV',
            recipientAddress: '0x71C...4e8B9 (Research Grant Vault)',
            purpose: item.title,
          },
          autoUpdateCanvas: true,
        });

        CanvasStore.updateItem(item.id, { status: 'completed' }, 'Autonomous Executor');
        setExecMessage(`Authorized settlement confirmed! TxHash: ${result.data?.transactionHash?.slice(0, 16)}...`);
      } else {
        const result = await mcp.executeTool('rwave_autonomous_executor', {
          action: 'verify_hypothesis_benchmark',
          parameters: { hypothesisText: item.title, rounds: 5 },
          autoUpdateCanvas: true,
        });
        setExecMessage(`Hypothesis empirically verified! Measured: ${result.data?.measuredAverageLatencyMs}ms`);
      }
    } catch (err: any) {
      setExecMessage(`Execution error: ${err?.message || String(err)}`);
    } finally {
      setIsExecutingSim((prev) => ({ ...prev, [item.id]: false }));
      setTimeout(() => setExecMessage(null), 4000);
    }
  };

  // Agent Quick Synthesis Triggers
  const handleTriggerAgentSynthesis = async (type: 'mindmap' | 'pipeline' | 'alert' | 'metric') => {
    setIsExecutingSim((prev) => ({ ...prev, agent_synthesis: true }));
    try {
      let promptTitle = 'Agent Synthesized Node';
      let promptReasoning = 'Synthesized from active browser runtime telemetry.';
      let itemType: CanvasItemType = 'mindmap_node';
      let payload: Record<string, any> = {};

      if (type === 'mindmap') {
        promptTitle = `Concept: Microtask Concurrency Vector #${Math.floor(Math.random() * 900 + 100)}`;
        itemType = 'mindmap_node';
        payload = {
          confidenceScore: 0.94,
          markdownFindings: '**Key Hypothesis:** Dedicated WebMCP microtasks reduce browser memory churn by 65% when batching tensor embeddings.',
        };
      } else if (type === 'pipeline') {
        promptTitle = `Autonomous Memory Reclamation Pipeline #${Math.floor(Math.random() * 80 + 10)}`;
        itemType = 'simulation_pipeline';
        payload = {
          currentStepIndex: 0,
          pipelineSteps: [
            { id: 's1', name: '1. Scan Garbage Collection Pressure', status: 'completed', durationMs: 14, result: 'Memory stable at 24.5MB' },
            { id: 's2', name: '2. Flush Ephemeral DOM Fragments', status: 'running', durationMs: 8, result: 'Released 12 virtual nodes' },
            { id: 's3', name: '3. Persist State Checkpoint Node', status: 'pending', result: 'Awaiting execution' },
          ],
        };
      } else if (type === 'alert') {
        promptTitle = `Decision Required: Throttle DOM Mutation Frequency`;
        itemType = 'decision_alert';
        payload = {
          severity: 'advisory',
          impactScore: 82,
          recommendedAction: 'Apply 16ms requestAnimationFrame debounce on canvas mutation observer.',
        };
      } else if (type === 'metric') {
        promptTitle = `Real-time JS Heap Footprint`;
        itemType = 'metric_card';
        payload = {
          metricValue: '18.4',
          metricUnit: 'MB',
          trend: 'up',
          trendPct: 12,
          metricSubtitle: 'Optimized through zero-copy buffer sharing',
        };
      }

      await mcp.executeTool('rwave_canvas_manager', {
        action: 'create',
        itemType,
        title: promptTitle,
        description: `Autonomous finding dispatched by R-WAVE Agent to the Interactive Research Canvas.`,
        agentReasoning: promptReasoning,
        status: 'proposed_by_agent',
        tags: ['agent-native', type, 'co-creation'],
        payload,
      });

      setExecMessage(`Agent dynamically rendered new ${itemType.replace('_', ' ')} widget on canvas!`);
    } catch (err: any) {
      setExecMessage(`Agent synthesis error: ${err?.message || String(err)}`);
    } finally {
      setIsExecutingSim((prev) => ({ ...prev, agent_synthesis: false }));
      setTimeout(() => setExecMessage(null), 3500);
    }
  };

  // Status Badge Colors (Strict Cool Palette)
  const getStatusBadge = (status: CanvasItemStatus) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#00CCCC]/15 text-[#00CCCC] border border-[#00CCCC]/40 text-[10px] font-mono font-bold">
            <CheckCircle2 className="h-3 w-3" />
            Approved
          </span>
        );
      case 'proposed_by_agent':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#38BDF8]/15 text-[#38BDF8] border border-[#38BDF8]/40 text-[10px] font-mono font-bold animate-pulse">
            <Sparkles className="h-3 w-3" />
            Agent Proposal (Needs Review)
          </span>
        );
      case 'executing':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#2DD4BF]/20 text-[#2DD4BF] border border-[#2DD4BF]/40 text-[10px] font-mono font-bold">
            <RefreshCw className="h-3 w-3 animate-spin" />
            Executing
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#0D9488]/20 text-[#2DD4BF] border border-[#0D9488]/50 text-[10px] font-mono font-bold">
            <ShieldCheck className="h-3 w-3" />
            Completed &amp; Verified
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#334155] text-[#94A3B8] border border-[#475569] text-[10px] font-mono font-bold">
            <XCircle className="h-3 w-3" />
            Rejected
          </span>
        );
      case 'modified_by_human':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#818CF8]/15 text-[#818CF8] border border-[#818CF8]/40 text-[10px] font-mono font-bold">
            <Edit3 className="h-3 w-3" />
            Human Modified
          </span>
        );
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Banner / Hero Bar */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#0F172A] via-[#0A0C14] to-[#0F172A] border border-[#1E293B] shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-full bg-gradient-to-l from-[#00CCCC]/10 to-transparent pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#00CCCC]/20 border border-[#00CCCC]/40 flex items-center justify-center text-[#00CCCC] shadow-[0_0_12px_rgba(0,204,204,0.3)]">
                <Layers className="h-4 w-4" />
              </div>
              <h2 className="text-xl font-bold tracking-tight text-[#A5F3FC]">
                Interactive Research Canvas
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-[#00CCCC]/15 text-[#00CCCC] border border-[#00CCCC]/30 text-[10px] font-mono font-bold">
                Read/Write Agent-Native
              </span>
            </div>
            <p className="text-xs text-[#94A3B8] mt-1 max-w-2xl">
              Central dynamic workspace where AI agents directly compose, render, and update widgets, mindmaps, and decision cards via <code className="text-[#00CCCC] font-mono">rwave_canvas_manager</code> and execute simulated logic with <code className="text-[#2DD4BF] font-mono">rwave_autonomous_executor</code>.
            </p>
          </div>

          {/* Quick Stats Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="px-3 py-1.5 rounded-xl bg-[#0F172A] border border-[#1E293B] text-xs">
              <span className="text-[#64748B] text-[10px] uppercase font-semibold block">Total Widgets</span>
              <span className="text-[#A5F3FC] font-bold font-mono text-sm">{stats.total}</span>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-[#38BDF8]/10 border border-[#38BDF8]/30 text-xs">
              <span className="text-[#38BDF8] text-[10px] uppercase font-semibold block">Pending Review</span>
              <span className="text-[#38BDF8] font-bold font-mono text-sm">{stats.proposed}</span>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-[#00CCCC]/10 border border-[#00CCCC]/30 text-xs">
              <span className="text-[#00CCCC] text-[10px] uppercase font-semibold block">Human Approved</span>
              <span className="text-[#00CCCC] font-bold font-mono text-sm">{stats.approved}</span>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-[#0D9488]/10 border border-[#0D9488]/30 text-xs">
              <span className="text-[#2DD4BF] text-[10px] uppercase font-semibold block">Agent Created</span>
              <span className="text-[#2DD4BF] font-bold font-mono text-sm">{stats.byAgent}</span>
            </div>
          </div>
        </div>

        {/* Live Execution / Status Toast */}
        <AnimatePresence>
          {execMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-3 p-2.5 rounded-lg bg-[#00CCCC]/15 border border-[#00CCCC]/40 text-xs text-[#A5F3FC] flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-[#00CCCC] shrink-0" />
                <span className="font-medium">{execMessage}</span>
              </div>
              <button
                onClick={() => setExecMessage(null)}
                className="text-[#64748B] hover:text-[#A5F3FC] text-xs cursor-pointer"
              >
                Dismiss
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Control & Filter Toolbar */}
      <div className="p-3.5 rounded-xl bg-[#0F172A]/80 border border-[#1E293B] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 bg-[#0A0C14] p-1 rounded-lg border border-[#1E293B]">
          <button
            onClick={() => setViewMode('grid')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer ${
              viewMode === 'grid'
                ? 'bg-[#1E293B] text-[#00CCCC] border border-[#00CCCC]/40 shadow-[0_0_8px_rgba(0,204,204,0.2)]'
                : 'text-[#94A3B8] hover:text-[#E0E7FF]'
            }`}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            <span>Grid Cards</span>
          </button>
          <button
            onClick={() => setViewMode('mindmap')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer ${
              viewMode === 'mindmap'
                ? 'bg-[#1E293B] text-[#00CCCC] border border-[#00CCCC]/40 shadow-[0_0_8px_rgba(0,204,204,0.2)]'
                : 'text-[#94A3B8] hover:text-[#E0E7FF]'
            }`}
          >
            <GitFork className="h-3.5 w-3.5" />
            <span>Mindmap Graph</span>
          </button>
          <button
            onClick={() => setViewMode('timeline')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer ${
              viewMode === 'timeline'
                ? 'bg-[#1E293B] text-[#00CCCC] border border-[#00CCCC]/40 shadow-[0_0_8px_rgba(0,204,204,0.2)]'
                : 'text-[#94A3B8] hover:text-[#E0E7FF]'
            }`}
          >
            <Clock className="h-3.5 w-3.5" />
            <span>Audit Timeline</span>
          </button>
        </div>

        {/* Filter Dropdowns */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 bg-[#0A0C14] px-2.5 py-1 rounded-lg border border-[#1E293B]">
            <span className="text-[#64748B] text-[11px]">Type:</span>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="bg-transparent text-[#A5F3FC] text-xs font-semibold focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-[#0F172A] text-[#E0E7FF]">All Types ({items.length})</option>
              <option value="simulation_pipeline" className="bg-[#0F172A] text-[#E0E7FF]">Simulation Pipelines</option>
              <option value="decision_alert" className="bg-[#0F172A] text-[#E0E7FF]">Decision Alerts</option>
              <option value="mindmap_node" className="bg-[#0F172A] text-[#E0E7FF]">Mindmap Nodes</option>
              <option value="metric_card" className="bg-[#0F172A] text-[#E0E7FF]">Metric Cards</option>
              <option value="action_checklist" className="bg-[#0F172A] text-[#E0E7FF]">Action Checklists</option>
              <option value="insight_card" className="bg-[#0F172A] text-[#E0E7FF]">Insight Cards</option>
            </select>
          </div>

          <div className="flex items-center gap-1 bg-[#0A0C14] px-2.5 py-1 rounded-lg border border-[#1E293B]">
            <span className="text-[#64748B] text-[11px]">Status:</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="bg-transparent text-[#A5F3FC] text-xs font-semibold focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-[#0F172A] text-[#E0E7FF]">All Statuses</option>
              <option value="proposed_by_agent" className="bg-[#0F172A] text-[#38BDF8]">Needs Approval ({stats.proposed})</option>
              <option value="approved" className="bg-[#0F172A] text-[#00CCCC]">Approved</option>
              <option value="completed" className="bg-[#0F172A] text-[#2DD4BF]">Completed</option>
              <option value="rejected" className="bg-[#0F172A] text-[#94A3B8]">Rejected</option>
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Agent Trigger Dropdown / Quick Buttons */}
          <div className="relative group">
            <button
              disabled={isExecutingSim['agent_synthesis']}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#00CCCC]/20 hover:bg-[#00CCCC]/30 border border-[#00CCCC]/50 text-[#A5F3FC] hover:text-white font-bold transition-all shadow-[0_0_10px_rgba(0,204,204,0.2)] cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="h-3.5 w-3.5 text-[#00CCCC]" />
              <span>Agent Draw</span>
            </button>
            {/* Dropdown Menu */}
            <div className="absolute right-0 top-full mt-1.5 w-56 rounded-xl bg-[#0F172A] border border-[#1E293B] shadow-2xl py-1 z-30 hidden group-hover:block">
              <button
                onClick={() => handleTriggerAgentSynthesis('pipeline')}
                className="w-full text-left px-3.5 py-2 hover:bg-[#1E293B] text-xs text-[#E0E7FF] hover:text-[#00CCCC] flex items-center gap-2 cursor-pointer"
              >
                <Play className="h-3.5 w-3.5 text-[#2DD4BF]" />
                <span>Synthesize Pipeline</span>
              </button>
              <button
                onClick={() => handleTriggerAgentSynthesis('alert')}
                className="w-full text-left px-3.5 py-2 hover:bg-[#1E293B] text-xs text-[#E0E7FF] hover:text-[#00CCCC] flex items-center gap-2 cursor-pointer"
              >
                <AlertTriangle className="h-3.5 w-3.5 text-[#38BDF8]" />
                <span>Synthesize Decision Alert</span>
              </button>
              <button
                onClick={() => handleTriggerAgentSynthesis('mindmap')}
                className="w-full text-left px-3.5 py-2 hover:bg-[#1E293B] text-xs text-[#E0E7FF] hover:text-[#00CCCC] flex items-center gap-2 cursor-pointer"
              >
                <GitFork className="h-3.5 w-3.5 text-[#00CCCC]" />
                <span>Synthesize Mindmap Node</span>
              </button>
              <button
                onClick={() => handleTriggerAgentSynthesis('metric')}
                className="w-full text-left px-3.5 py-2 hover:bg-[#1E293B] text-xs text-[#E0E7FF] hover:text-[#00CCCC] flex items-center gap-2 cursor-pointer"
              >
                <TrendingUp className="h-3.5 w-3.5 text-[#38BDF8]" />
                <span>Synthesize Metric Gauge</span>
              </button>
            </div>
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#00CCCC] hover:bg-[#00CCCC]/90 text-[#0A0C14] font-bold transition-all shadow-[0_0_12px_rgba(0,204,204,0.3)] cursor-pointer"
          >
            <PlusCircle className="h-3.5 w-3.5" />
            <span>Add Widget</span>
          </button>
        </div>
      </div>

      {/* Main Visual View Area */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredItems.map((item) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className={`rounded-xl border bg-[#0F172A]/90 p-4 flex flex-col justify-between transition-all relative overflow-hidden shadow-lg ${
                item.status === 'proposed_by_agent'
                  ? 'border-[#38BDF8]/40 shadow-[0_0_15px_rgba(56,189,248,0.1)]'
                  : item.status === 'completed'
                  ? 'border-[#0D9488]/40'
                  : 'border-[#1E293B] hover:border-[#00CCCC]/40'
              }`}
            >
              {/* Header / Type & Status */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-[#0A0C14] text-[#64748B] border border-[#1E293B]">
                    {item.type.replace('_', ' ')}
                  </span>
                  {getStatusBadge(item.status)}
                </div>

                {/* Title */}
                <h3 className="text-sm font-bold text-[#A5F3FC] leading-snug line-clamp-2 mb-1.5">
                  {item.title}
                </h3>

                {/* Description */}
                {item.description && (
                  <p className="text-xs text-[#94A3B8] leading-relaxed mb-3">
                    {item.description}
                  </p>
                )}

                {/* Agent Reasoning Box (Why AI created this) */}
                {item.agentReasoning && (
                  <div className="p-2.5 rounded-lg bg-[#0A0C14] border border-[#1E293B] mb-3.5 text-xs">
                    <div className="text-[10px] text-[#00CCCC] font-mono font-bold flex items-center gap-1 mb-1">
                      <Sparkles className="h-3 w-3" />
                      <span>Agent Reasoning:</span>
                    </div>
                    <p className="text-[11px] text-[#CBD5E1] font-serif italic">
                      "{item.agentReasoning}"
                    </p>
                  </div>
                )}

                {/* DYNAMIC WIDGET CONTENT RENDERING */}

                {/* 1. Simulation Pipeline Widget */}
                {item.type === 'simulation_pipeline' && item.payload.pipelineSteps && (
                  <div className="space-y-2 mb-3.5">
                    <div className="flex items-center justify-between text-[11px] text-[#64748B] font-mono">
                      <span>Pipeline Progression:</span>
                      <span className="text-[#2DD4BF]">
                        {item.payload.pipelineSteps.filter((s) => s.status === 'completed').length}/
                        {item.payload.pipelineSteps.length} stages
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      {item.payload.pipelineSteps.map((step, idx) => (
                        <div
                          key={step.id || idx}
                          className={`p-2 rounded-lg border text-xs flex items-center justify-between gap-2 ${
                            step.status === 'completed'
                              ? 'bg-[#0A0C14] border-[#0D9488]/40 text-[#A5F3FC]'
                              : step.status === 'running'
                              ? 'bg-[#00CCCC]/10 border-[#00CCCC]/40 text-[#00CCCC]'
                              : 'bg-[#0A0C14]/50 border-[#1E293B] text-[#64748B]'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            {step.status === 'completed' ? (
                              <CheckCircle2 className="h-3.5 w-3.5 text-[#2DD4BF] shrink-0" />
                            ) : step.status === 'running' ? (
                              <RefreshCw className="h-3.5 w-3.5 text-[#00CCCC] animate-spin shrink-0" />
                            ) : (
                              <div className="w-3.5 h-3.5 rounded-full border border-[#475569] shrink-0" />
                            )}
                            <span className="truncate font-medium">{step.name}</span>
                          </div>

                          {step.durationMs && (
                            <span className="text-[10px] font-mono text-[#64748B] shrink-0">
                              {step.durationMs}ms
                            </span>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Execute Autonomous Logic Button */}
                    <button
                      disabled={isExecutingSim[item.id]}
                      onClick={(e) => handleExecuteAutonomousRoutine(item, e)}
                      className="w-full mt-2 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-gradient-to-r from-[#00CCCC]/20 to-[#0D9488]/30 hover:from-[#00CCCC]/30 hover:to-[#0D9488]/40 border border-[#00CCCC]/60 text-[#A5F3FC] hover:text-white font-bold text-xs transition-all shadow-[0_0_10px_rgba(0,204,204,0.2)] cursor-pointer disabled:opacity-50"
                    >
                      {isExecutingSim[item.id] ? (
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Play className="h-3.5 w-3.5 text-[#00CCCC]" />
                      )}
                      <span>Execute Full Pipeline via rwave_autonomous_executor</span>
                    </button>
                  </div>
                )}

                {/* 2. Decision Alert Widget */}
                {item.type === 'decision_alert' && (
                  <div className="p-3 rounded-lg bg-[#0A0C14] border border-[#38BDF8]/30 space-y-2 mb-3.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-[#38BDF8] uppercase font-bold flex items-center gap-1">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        Impact Score: {item.payload.impactScore || 85}/100
                      </span>
                      <span className="text-[10px] text-[#64748B] font-mono uppercase">
                        Severity: {item.payload.severity || 'Advisory'}
                      </span>
                    </div>

                    {item.payload.recommendedAction && (
                      <p className="text-[#E0E7FF] font-medium leading-relaxed">
                        <strong className="text-[#00CCCC]">Recommended:</strong> {item.payload.recommendedAction}
                      </p>
                    )}

                    {/* Action button */}
                    <button
                      disabled={isExecutingSim[item.id] || item.status === 'completed'}
                      onClick={(e) => handleExecuteAutonomousRoutine(item, e)}
                      className="w-full mt-1.5 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-[#38BDF8]/20 hover:bg-[#38BDF8]/30 border border-[#38BDF8]/50 text-[#A5F3FC] font-bold text-xs transition-all cursor-pointer disabled:opacity-50"
                    >
                      <Zap className="h-3.5 w-3.5 text-[#38BDF8]" />
                      <span>{item.status === 'completed' ? 'Action Confirmed' : 'Authorize & Execute Routine'}</span>
                    </button>
                  </div>
                )}

                {/* 3. Metric Card Widget */}
                {item.type === 'metric_card' && (
                  <div className="p-3.5 rounded-lg bg-[#0A0C14] border border-[#1E293B] space-y-1 mb-3.5">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-2xl font-bold font-mono text-[#A5F3FC]">
                        {item.payload.metricValue || '0.00'}
                      </span>
                      <span className="text-xs font-mono text-[#00CCCC]">
                        {item.payload.metricUnit || ''}
                      </span>
                      {item.payload.trend && (
                        <span className="ml-auto inline-flex items-center gap-0.5 text-[10px] font-mono text-[#2DD4BF] bg-[#2DD4BF]/10 px-1.5 py-0.5 rounded">
                          <TrendingUp className="h-3 w-3" />
                          +{item.payload.trendPct || 100}%
                        </span>
                      )}
                    </div>
                    {item.payload.metricSubtitle && (
                      <p className="text-[11px] text-[#64748B] leading-tight">
                        {item.payload.metricSubtitle}
                      </p>
                    )}
                  </div>
                )}

                {/* 4. Action Checklist Widget */}
                {item.type === 'action_checklist' && item.payload.checklist && (
                  <div className="space-y-1.5 mb-3.5">
                    {item.payload.checklist.map((chk: ChecklistItem) => (
                      <div
                        key={chk.id}
                        onClick={(e) => handleToggleChecklist(item.id, chk.id, e)}
                        className={`p-2 rounded-lg border text-xs flex items-center gap-2 cursor-pointer transition-all ${
                          chk.completed
                            ? 'bg-[#0A0C14] border-[#0D9488]/30 text-[#64748B] line-through'
                            : 'bg-[#0A0C14] border-[#1E293B] text-[#E0E7FF] hover:border-[#00CCCC]/40'
                        }`}
                      >
                        {chk.completed ? (
                          <CheckSquare className="h-3.5 w-3.5 text-[#00CCCC] shrink-0" />
                        ) : (
                          <Square className="h-3.5 w-3.5 text-[#64748B] shrink-0" />
                        )}
                        <span className="flex-1 min-w-0 text-[11px] leading-tight">{chk.text}</span>
                        {chk.assignedTo && (
                          <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 rounded bg-[#1E293B] text-[#A5F3FC]">
                            {chk.assignedTo}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* 5. Mindmap Node / Insight Markdown */}
                {(item.type === 'mindmap_node' || item.type === 'insight_card') && item.payload.markdownFindings && (
                  <div className="p-3 rounded-lg bg-[#0A0C14] border border-[#1E293B] mb-3.5 text-xs text-[#CBD5E1] max-h-32 overflow-y-auto leading-relaxed">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {item.payload.markdownFindings}
                    </ReactMarkdown>
                  </div>
                )}

                {/* Tags */}
                {item.tags && item.tags.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap mb-3">
                    {item.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] font-mono text-[#94A3B8] bg-[#1E293B]/70 px-2 py-0.5 rounded"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* HUMAN-AI COLLABORATION ACTIONS BAR */}
              <div className="pt-3 border-t border-[#1E293B] flex items-center justify-between gap-2 text-xs">
                {/* Approve / Reject buttons for proposed items */}
                {item.status === 'proposed_by_agent' ? (
                  <div className="flex items-center gap-1.5 w-full">
                    <button
                      onClick={(e) => handleApprove(item.id, e)}
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-[#00CCCC] hover:bg-[#00CCCC]/90 text-[#0A0C14] font-bold transition-all shadow-[0_0_10px_rgba(0,204,204,0.3)] cursor-pointer"
                      title="Human Approval (Co-Creation Validation)"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Approve</span>
                    </button>
                    <button
                      onClick={(e) => handleReject(item.id, e)}
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-[#1E293B] hover:bg-[#334155] text-[#94A3B8] hover:text-[#E0E7FF] font-semibold border border-[#334155] transition-all cursor-pointer"
                      title="Reject Agent Proposal"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      <span>Reject</span>
                    </button>
                    <button
                      onClick={(e) => handleOpenEdit(item, e)}
                      className="p-1.5 rounded-lg bg-[#1E293B] hover:bg-[#334155] text-[#A5F3FC] border border-[#334155] cursor-pointer"
                      title="Edit / Refine Widget"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-1 text-[10px] text-[#64748B] font-mono">
                      <span>Created by {item.createdBy}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={(e) => handleOpenEdit(item, e)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#1E293B] hover:bg-[#334155] text-[#A5F3FC] text-xs font-semibold border border-[#334155] transition-colors cursor-pointer"
                      >
                        <Edit3 className="h-3 w-3 text-[#00CCCC]" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={(e) => handleDelete(item.id, e)}
                        className="p-1 rounded-md bg-[#1E293B] hover:bg-[#334155] text-[#64748B] hover:text-[#A5F3FC] transition-colors cursor-pointer"
                        title="Delete Widget"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Mindmap Graph Cluster Mode */}
      {viewMode === 'mindmap' && (
        <div className="p-6 rounded-2xl bg-[#0F172A]/70 border border-[#1E293B] min-h-[520px] flex flex-col justify-between relative overflow-hidden">
          <div className="mb-4">
            <h4 className="text-sm font-bold text-[#A5F3FC] flex items-center gap-2">
              <GitFork className="h-4 w-4 text-[#00CCCC]" />
              <span>Hierarchical Concept &amp; Decision Mindmap</span>
            </h4>
            <p className="text-xs text-[#94A3B8] mt-0.5">
              Visualizes connected research concept nodes, agent-generated hypotheses, and automated downstream triggers.
            </p>
          </div>

          {/* Node Visual Cluster */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className={`p-4 rounded-xl bg-[#0A0C14] border transition-all ${
                  item.parentIds && item.parentIds.length > 0
                    ? 'border-[#00CCCC]/40 shadow-[0_0_12px_rgba(0,204,204,0.15)]'
                    : 'border-[#38BDF8]/40'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono text-[#00CCCC] uppercase font-bold">
                    {item.parentIds && item.parentIds.length > 0 ? '↳ Connected Node' : '★ Root Architecture'}
                  </span>
                  {getStatusBadge(item.status)}
                </div>
                <h5 className="text-xs font-bold text-[#A5F3FC] mb-1">{item.title}</h5>
                <p className="text-[11px] text-[#94A3B8] line-clamp-3 mb-3">{item.description}</p>

                <div className="flex items-center justify-between text-xs pt-2 border-t border-[#1E293B]">
                  <button
                    onClick={() => handleOpenEdit(item)}
                    className="text-[#00CCCC] hover:underline text-[11px] font-semibold cursor-pointer"
                  >
                    Edit Node
                  </button>
                  {item.status === 'proposed_by_agent' && (
                    <button
                      onClick={() => handleApprove(item.id)}
                      className="px-2 py-0.5 rounded bg-[#00CCCC] text-[#0A0C14] font-bold text-[10px] cursor-pointer"
                    >
                      Approve
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-3 rounded-lg bg-[#0A0C14] border border-[#1E293B] text-xs text-[#64748B] flex items-center justify-between">
            <span>Graph Nodes: {filteredItems.length} active items</span>
            <span className="text-[#00CCCC] font-mono">WebMCP Visual Hierarchy Ready</span>
          </div>
        </div>
      )}

      {/* Audit Timeline Mode */}
      {viewMode === 'timeline' && (
        <div className="p-5 rounded-2xl bg-[#0F172A]/70 border border-[#1E293B] space-y-4">
          <h4 className="text-sm font-bold text-[#A5F3FC] flex items-center gap-2">
            <Clock className="h-4 w-4 text-[#00CCCC]" />
            <span>Human-AI Co-Creation Audit Trail</span>
          </h4>

          <div className="space-y-3">
            {items.flatMap((item) =>
              (item.approvalAuditTrail || []).map((log, idx) => (
                <div
                  key={`${item.id}_${idx}`}
                  className="p-3 rounded-lg bg-[#0A0C14] border border-[#1E293B] flex items-start justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#A5F3FC]">{item.title}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#1E293B] text-[#00CCCC]">
                        {log.action}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#94A3B8]">
                      Auditor / Actor: <strong className="text-[#E0E7FF]">{log.by}</strong>
                      {log.notes && ` • Notes: "${log.notes}"`}
                    </p>
                  </div>
                  <span className="text-[10px] font-mono text-[#64748B] whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Human-in-the-loop Edit Modal */}
      {isEditModalOpen && editingItem && (
        <div className="fixed inset-0 bg-[#0A0C14]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-[#0F172A] border border-[#00CCCC]/40 p-5 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-[#1E293B]">
              <div className="flex items-center gap-2">
                <Edit3 className="h-4 w-4 text-[#00CCCC]" />
                <h4 className="text-sm font-bold text-[#A5F3FC]">Human Co-Creation: Edit Widget</h4>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-[#64748B] hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-[#64748B] mb-1">Title</label>
                <input
                  type="text"
                  value={editingItem.title}
                  onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-[#0A0C14] border border-[#1E293B] text-[#E0E7FF] font-medium focus:border-[#00CCCC] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#64748B] mb-1">Description</label>
                <textarea
                  rows={3}
                  value={editingItem.description || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-[#0A0C14] border border-[#1E293B] text-[#E0E7FF] focus:border-[#00CCCC] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#64748B] mb-1">Status Override</label>
                <select
                  value={editingItem.status}
                  onChange={(e) => setEditingItem({ ...editingItem, status: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-lg bg-[#0A0C14] border border-[#1E293B] text-[#A5F3FC] font-semibold focus:border-[#00CCCC] focus:outline-none"
                >
                  <option value="approved">Approved (Validated)</option>
                  <option value="proposed_by_agent">Proposed by Agent</option>
                  <option value="modified_by_human">Modified by Human</option>
                  <option value="completed">Completed</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#1E293B]">
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="px-3 py-1.5 rounded-lg bg-[#1E293B] text-[#94A3B8] font-semibold hover:bg-[#334155] cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  CanvasStore.updateItem(
                    editingItem.id,
                    {
                      title: editingItem.title,
                      description: editingItem.description,
                      status: editingItem.status,
                    },
                    'Human User (Editor Save)'
                  );
                  setIsEditModalOpen(false);
                  setExecMessage('Widget successfully modified and saved to Canvas.');
                }}
                className="px-4 py-1.5 rounded-lg bg-[#00CCCC] text-[#0A0C14] font-bold shadow-[0_0_10px_rgba(0,204,204,0.3)] cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Human Add Widget Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-[#0A0C14]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-[#0F172A] border border-[#00CCCC]/40 p-5 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-[#1E293B]">
              <div className="flex items-center gap-2">
                <PlusCircle className="h-4 w-4 text-[#00CCCC]" />
                <h4 className="text-sm font-bold text-[#A5F3FC]">Add New Canvas Widget</h4>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-[#64748B] hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                const title = String(fd.get('title') || 'Custom Research Widget');
                const description = String(fd.get('description') || '');
                const type = String(fd.get('type') || 'mindmap_node') as CanvasItemType;

                CanvasStore.addItem({
                  type,
                  title,
                  description,
                  status: 'approved',
                  createdBy: 'human',
                  tags: ['human-created', type],
                  payload: {
                    markdownFindings: description,
                  },
                });

                setIsAddModalOpen(false);
                setExecMessage('New widget created on canvas.');
              }}
              className="space-y-3"
            >
              <div>
                <label className="block text-[11px] font-semibold text-[#64748B] mb-1">Widget Type</label>
                <select
                  name="type"
                  defaultValue="mindmap_node"
                  className="w-full px-3 py-2 rounded-lg bg-[#0A0C14] border border-[#1E293B] text-[#A5F3FC] font-semibold focus:border-[#00CCCC] focus:outline-none"
                >
                  <option value="mindmap_node">Mindmap Concept Node</option>
                  <option value="simulation_pipeline">Simulation Pipeline</option>
                  <option value="decision_alert">Decision Alert</option>
                  <option value="metric_card">Metric Card</option>
                  <option value="action_checklist">Action Checklist</option>
                  <option value="insight_card">Insight Card</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#64748B] mb-1">Widget Title</label>
                <input
                  name="title"
                  required
                  placeholder="e.g. Memory Optimization Milestone"
                  className="w-full px-3 py-2 rounded-lg bg-[#0A0C14] border border-[#1E293B] text-[#E0E7FF] focus:border-[#00CCCC] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#64748B] mb-1">Description &amp; Findings</label>
                <textarea
                  name="description"
                  rows={3}
                  placeholder="Details for this widget or research milestone..."
                  className="w-full px-3 py-2 rounded-lg bg-[#0A0C14] border border-[#1E293B] text-[#E0E7FF] focus:border-[#00CCCC] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#1E293B]">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg bg-[#1E293B] text-[#94A3B8] font-semibold hover:bg-[#334155] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-[#00CCCC] text-[#0A0C14] font-bold shadow-[0_0_10px_rgba(0,204,204,0.3)] cursor-pointer"
                >
                  Add Widget
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
