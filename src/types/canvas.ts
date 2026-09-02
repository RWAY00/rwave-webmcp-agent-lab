/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * R-WAVE Universal Intelligence Lab - Interactive Research Canvas Types
 */

export type CanvasItemType =
  | 'mindmap_node'
  | 'metric_card'
  | 'decision_alert'
  | 'simulation_pipeline'
  | 'action_checklist'
  | 'insight_card'
  | 'data_table';

export type CanvasItemStatus =
  | 'proposed_by_agent'
  | 'approved'
  | 'rejected'
  | 'modified_by_human'
  | 'executing'
  | 'completed';

export interface PipelineStep {
  id: string;
  name: string;
  description?: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  result?: string;
  durationMs?: number;
}

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
  assignedTo?: 'agent' | 'human';
  priority?: 'low' | 'medium' | 'high' | 'critical';
}

export interface CanvasItem {
  id: string;
  type: CanvasItemType;
  title: string;
  description?: string;
  status: CanvasItemStatus;
  agentReasoning?: string;
  createdBy: 'agent' | 'human';
  createdAt: number;
  updatedAt: number;
  tags: string[];
  position?: { x: number; y: number };
  parentIds?: string[]; // For mind-map linking
  payload: {
    // For metric_card
    metricValue?: string | number;
    metricUnit?: string;
    trend?: 'up' | 'down' | 'neutral';
    trendPct?: number;
    metricSubtitle?: string;

    // For decision_alert
    severity?: 'info' | 'advisory' | 'warning' | 'critical';
    impactScore?: number; // 0-100
    recommendedAction?: string;
    executablePayload?: Record<string, any>;

    // For simulation_pipeline
    pipelineSteps?: PipelineStep[];
    currentStepIndex?: number;
    executionLog?: string[];
    simulatedOutput?: Record<string, any>;

    // For action_checklist
    checklist?: ChecklistItem[];

    // For insight_card
    confidenceScore?: number; // 0.0 - 1.0
    evidenceSources?: string[];
    markdownFindings?: string;

    // For data_table
    columns?: string[];
    rows?: Array<Record<string, any>>;

    // General extra data
    [key: string]: any;
  };
  approvalAuditTrail?: Array<{
    action: string;
    by: string;
    timestamp: number;
    notes?: string;
  }>;
}

export interface CanvasManagerState {
  items: CanvasItem[];
  selectedItemId: string | null;
  filterType: CanvasItemType | 'all';
  filterStatus: CanvasItemStatus | 'all';
  activeViewMode: 'grid' | 'mindmap' | 'timeline';
}
