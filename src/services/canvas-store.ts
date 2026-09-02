/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * R-WAVE Universal Intelligence Lab - Interactive Canvas Store & State Manager
 */

import { CanvasItem, CanvasItemType, CanvasItemStatus, PipelineStep } from '../types/canvas';

const CANVAS_STORAGE_KEY = 'rwave_interactive_canvas_v1';

type CanvasListener = (items: CanvasItem[]) => void;

class CanvasStoreManager {
  private items: CanvasItem[] = [];
  private listeners: Set<CanvasListener> = new Set();
  private initialized = false;

  constructor() {
    this.init();
  }

  private init() {
    if (this.initialized) return;
    this.initialized = true;

    try {
      const stored = localStorage.getItem(CANVAS_STORAGE_KEY);
      if (stored) {
        this.items = JSON.parse(stored);
      }
    } catch {
      // Fallback
    }

    if (!this.items || this.items.length === 0) {
      this.seedInitialCanvasItems();
    }
  }

  private save() {
    try {
      localStorage.setItem(CANVAS_STORAGE_KEY, JSON.stringify(this.items));
    } catch {
      // Storage quota or SSR safe
    }
    this.notify();
  }

  private notify() {
    const copy = [...this.items];
    this.listeners.forEach((listener) => {
      try {
        listener(copy);
      } catch (err) {
        console.error('Error in canvas listener:', err);
      }
    });

    // Also dispatch custom DOM event for WebMCP integration
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('rwave:canvasupdated', {
          detail: { itemsCount: this.items.length, timestamp: Date.now() },
        })
      );
    }
  }

  public subscribe(listener: CanvasListener): () => void {
    this.listeners.add(listener);
    listener([...this.items]);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public getItems(): CanvasItem[] {
    return [...this.items];
  }

  public getItem(id: string): CanvasItem | undefined {
    return this.items.find((item) => item.id === id);
  }

  public addItem(item: Omit<CanvasItem, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): CanvasItem {
    const newItem: CanvasItem = {
      ...item,
      id: item.id || `canvas_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      status: item.status || 'proposed_by_agent',
      createdBy: item.createdBy || 'agent',
      tags: item.tags || ['agent-native'],
      payload: item.payload || {},
      approvalAuditTrail: [
        {
          action: 'Created on Canvas',
          by: item.createdBy === 'human' ? 'Human Researcher' : 'R-WAVE Agent',
          timestamp: Date.now(),
          notes: item.agentReasoning || 'Initial widget generation',
        },
      ],
    };

    this.items = [newItem, ...this.items];
    this.save();
    return newItem;
  }

  public updateItem(id: string, updates: Partial<CanvasItem>, auditor?: string): CanvasItem | null {
    const idx = this.items.findIndex((item) => item.id === id);
    if (idx === -1) return null;

    const current = this.items[idx];
    const auditLogs = [...(current.approvalAuditTrail || [])];

    if (updates.status && updates.status !== current.status) {
      auditLogs.push({
        action: `Status changed to: ${updates.status}`,
        by: auditor || 'Human User',
        timestamp: Date.now(),
        notes: updates.agentReasoning || 'User interaction in workspace',
      });
    }

    const updatedItem: CanvasItem = {
      ...current,
      ...updates,
      updatedAt: Date.now(),
      payload: {
        ...current.payload,
        ...(updates.payload || {}),
      },
      approvalAuditTrail: auditLogs,
    };

    this.items[idx] = updatedItem;
    this.save();
    return updatedItem;
  }

  public approveItem(id: string, notes?: string): CanvasItem | null {
    return this.updateItem(
      id,
      {
        status: 'approved',
      },
      'Human Approver (Co-Creation Loop)'
    );
  }

  public rejectItem(id: string, notes?: string): CanvasItem | null {
    return this.updateItem(
      id,
      {
        status: 'rejected',
      },
      'Human Reviewer (Rejected)'
    );
  }

  public deleteItem(id: string): boolean {
    const initialLen = this.items.length;
    this.items = this.items.filter((item) => item.id !== id);
    if (this.items.length !== initialLen) {
      this.save();
      return true;
    }
    return false;
  }

  public clearAll(): void {
    this.items = [];
    this.save();
  }

  public resetToSeed(): void {
    this.seedInitialCanvasItems(true);
  }

  private seedInitialCanvasItems(force = false) {
    if (!force && this.items.length > 0) return;

    const now = Date.now();
    const seedItems: CanvasItem[] = [
      // 1. Simulation Pipeline Widget (Executable Autonomous Workflow)
      {
        id: 'canvas_sim_pipeline_01',
        type: 'simulation_pipeline',
        title: 'Autonomous Multi-Modal Consensus Pipeline',
        description: 'Multi-stage agent workflow testing live WebMCP DOM serialization, acoustic frequency decomposition, and simulated cryptographic validation.',
        status: 'proposed_by_agent',
        agentReasoning: 'Agent observed high-throughput DOM mutations and synthesized a 4-stage execution sequence for human review and automated dispatch.',
        createdBy: 'agent',
        createdAt: now - 3600000 * 2,
        updatedAt: now - 3600000 * 2,
        tags: ['simulation', 'autonomous-executor', 'pipeline', 'consensus'],
        position: { x: 30, y: 30 },
        payload: {
          currentStepIndex: 1,
          pipelineSteps: [
            {
              id: 'step_1',
              name: '1. Ingest DOM & Audio Telemetry',
              description: 'Extract semantic nodes from active document and acoustic waveform tokens.',
              status: 'completed',
              result: 'Captured 156 nodes • 48kHz stereo spectrum verified',
              durationMs: 42,
            },
            {
              id: 'step_2',
              name: '2. Deterministic SHA-256 Checksum Validation',
              description: 'Compute cryptographic hash chain over ingested context nodes to ensure tamper-proof memory.',
              status: 'running',
              result: 'Computing hash chain over 5 context items...',
              durationMs: 18,
            },
            {
              id: 'step_3',
              name: '3. Execute rwave_autonomous_executor Dispatch',
              description: 'Execute state-mutating mock transaction & automated research approval sequence.',
              status: 'pending',
              result: 'Awaiting human authorization / step trigger',
            },
            {
              id: 'step_4',
              name: '4. Register Verified Checkpoint into Graph',
              description: 'Persist state-mutation artifact into document.modelContext for cross-session handover.',
              status: 'pending',
              result: 'Ready to write artifact node',
            },
          ],
          executionLog: [
            'Initialized pipeline sequence [TASK_PIPE_921]',
            'Ingested 156 DOM elements via rwave_dom_streamer (0.42ms)',
            'Audio spectrum normalized to 320kbps lossless format',
          ],
        },
        approvalAuditTrail: [
          {
            action: 'Proposed by AI Agent',
            by: 'R-WAVE Autonomous Agent',
            timestamp: now - 3600000 * 2,
            notes: 'Generated from live telemetry observations',
          },
        ],
      },

      // 2. High-Priority Decision Alert Widget (Actionable)
      {
        id: 'canvas_alert_01',
        type: 'decision_alert',
        title: 'Action Required: Authorize Micro-Benchmark Allocation',
        description: 'R-WAVE Agent detected available 8-core hardware concurrency and recommends launching a 500-iteration matrix compute benchmark.',
        status: 'proposed_by_agent',
        agentReasoning: 'Device profile reports high GPU acceleration headroom; running this benchmark will verify real-time throughput limits without throttling the UI.',
        createdBy: 'agent',
        createdAt: now - 3600000,
        updatedAt: now - 3600000,
        tags: ['decision', 'alert', 'actionable', 'governance'],
        position: { x: 420, y: 30 },
        payload: {
          severity: 'advisory',
          impactScore: 88,
          recommendedAction: 'Execute rwave_active_experiment_runner with 250 matrix iterations.',
          executablePayload: {
            tool: 'rwave_active_experiment_runner',
            args: { experimentType: 'matrix_compute', iterations: 250 },
          },
        },
        approvalAuditTrail: [
          {
            action: 'Proposed by AI Agent',
            by: 'R-WAVE Autonomous Agent',
            timestamp: now - 3600000,
            notes: 'Awaiting human co-creation authorization',
          },
        ],
      },

      // 3. Mind-Map Root Concept Node
      {
        id: 'canvas_node_root',
        type: 'mindmap_node',
        title: 'WebMCP Standard Architecture',
        description: 'Core browser-native protocol standard establishing deterministic client-side tool execution, shared context graph, and event bus.',
        status: 'approved',
        agentReasoning: 'Central architectural root connecting all sub-systems.',
        createdBy: 'human',
        createdAt: now - 3600000 * 5,
        updatedAt: now - 3600000 * 5,
        tags: ['mindmap', 'core-architecture', 'w3c-spec'],
        position: { x: 50, y: 280 },
        parentIds: [],
        payload: {
          confidenceScore: 0.98,
          markdownFindings: '**Key Pillar:** Direct exposure of `document.modelContext` gives browser-resident agents microsecond dispatch speed.',
        },
        approvalAuditTrail: [
          {
            action: 'Created & Approved by Human Lead',
            by: 'Human Architect',
            timestamp: now - 3600000 * 5,
            notes: 'Established foundational research node',
          },
        ],
      },

      // 4. Mind-Map Child Node A (Connected to Root)
      {
        id: 'canvas_node_child_a',
        type: 'mindmap_node',
        title: 'State-Mutating Canvas Manager',
        description: 'Interactive Read/Write workspace where agents dynamically generate, update, and manage visual UI components.',
        status: 'approved',
        agentReasoning: 'Derived from root architecture to fulfill Read/Write agent-native interaction.',
        createdBy: 'agent',
        createdAt: now - 3600000 * 4,
        updatedAt: now - 3600000 * 4,
        tags: ['mindmap', 'canvas-manager', 'agent-native'],
        position: { x: 380, y: 280 },
        parentIds: ['canvas_node_root'],
        payload: {
          confidenceScore: 0.95,
          markdownFindings: 'Allows AI agents to not merely inspect, but visually compose interactive research cards, decision alerts, and live charts.',
        },
        approvalAuditTrail: [
          {
            action: 'Proposed by AI Agent',
            by: 'R-WAVE Agent',
            timestamp: now - 3600000 * 4,
          },
          {
            action: 'Approved by Human Reviewer',
            by: 'Human User',
            timestamp: now - 3600000 * 3,
            notes: 'Validated for production canvas integration',
          },
        ],
      },

      // 5. Mind-Map Child Node B (Autonomous Executor)
      {
        id: 'canvas_node_child_b',
        type: 'mindmap_node',
        title: 'Autonomous Executor Runtime',
        description: 'Executes simulated transactions, hypothesis validation pipelines, and automated multi-step verification routines.',
        status: 'approved',
        agentReasoning: 'Provides transactional and workflow execution capabilities directly inside the browser sandbox.',
        createdBy: 'agent',
        createdAt: now - 3600000 * 3,
        updatedAt: now - 3600000 * 3,
        tags: ['mindmap', 'autonomous-executor', 'simulated-logic'],
        position: { x: 720, y: 280 },
        parentIds: ['canvas_node_child_a'],
        payload: {
          confidenceScore: 0.92,
          markdownFindings: 'Enables simulated financial settlements, threshold governance approvals, and automated emergency alert dispatches.',
        },
        approvalAuditTrail: [
          {
            action: 'Approved by Human Reviewer',
            by: 'Human User',
            timestamp: now - 3600000 * 2,
          },
        ],
      },

      // 6. Metric Card Widget
      {
        id: 'canvas_metric_01',
        type: 'metric_card',
        title: 'WebMCP Tool Dispatch Latency',
        description: 'Real-time measured microsecond execution speed of client-resident tool handlers.',
        status: 'approved',
        agentReasoning: 'Quantifies efficiency gains of avoiding server-side serialization hops.',
        createdBy: 'agent',
        createdAt: now - 3600000 * 2,
        updatedAt: now - 3600000 * 2,
        tags: ['metric', 'telemetry', 'benchmark'],
        position: { x: 50, y: 520 },
        payload: {
          metricValue: '0.34',
          metricUnit: 'ms',
          trend: 'up',
          trendPct: 340,
          metricSubtitle: '340% faster than REST serialization (12.4ms baseline)',
        },
        approvalAuditTrail: [
          {
            action: 'Approved by Human',
            by: 'Human User',
            timestamp: now - 3600000 * 2,
          },
        ],
      },

      // 7. Interactive Action Checklist Widget
      {
        id: 'canvas_checklist_01',
        type: 'action_checklist',
        title: 'Autonomous Verification & Research Protocol',
        description: 'Co-created actionable milestones for WebMCP compliance testing and agent capability verification.',
        status: 'approved',
        agentReasoning: 'Synthesized to track human-agent joint progress across verification tasks.',
        createdBy: 'agent',
        createdAt: now - 3600000,
        updatedAt: now - 3600000,
        tags: ['checklist', 'co-creation', 'workflow'],
        position: { x: 420, y: 520 },
        payload: {
          checklist: [
            {
              id: 'chk_1',
              text: 'Register rwave_canvas_manager in document.modelContext',
              completed: true,
              assignedTo: 'agent',
              priority: 'critical',
            },
            {
              id: 'chk_2',
              text: 'Register rwave_autonomous_executor for simulated transaction logic',
              completed: true,
              assignedTo: 'agent',
              priority: 'critical',
            },
            {
              id: 'chk_3',
              text: 'Test Human-in-the-loop Approve/Reject and Edit buttons',
              completed: true,
              assignedTo: 'human',
              priority: 'high',
            },
            {
              id: 'chk_4',
              text: 'Execute multi-step consensus pipeline through autonomous executor',
              completed: false,
              assignedTo: 'agent',
              priority: 'medium',
            },
          ],
        },
        approvalAuditTrail: [
          {
            action: 'Created by Agent & Approved by Human',
            by: 'Co-Creation Loop',
            timestamp: now - 3600000,
          },
        ],
      },
    ];

    this.items = seedItems;
    this.save();
  }
}

export const CanvasStore = new CanvasStoreManager();
