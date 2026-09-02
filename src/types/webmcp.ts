/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * R-WAVE Universal Intelligence Lab - WebMCP Type Definitions
 */

export type ToolCategory = 'diagnostic' | 'research' | 'synthesis' | 'benchmark' | 'system' | 'custom';

export interface WebMCPParameterProperty {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description?: string;
  enum?: string[];
  default?: any;
  items?: {
    type: string;
    description?: string;
  };
}

export interface WebMCPParameterSchema {
  type: 'object';
  properties: Record<string, WebMCPParameterProperty>;
  required?: string[];
}

export interface WebMCPTool {
  name: string;
  description: string;
  parameters: WebMCPParameterSchema;
  category: ToolCategory;
  version?: string;
  author?: string;
  handler: (args: Record<string, any>) => Promise<any> | any;
  readOnly?: boolean;
}

export interface WebMCPToolResult {
  tool: string;
  success: boolean;
  timestamp: number;
  durationMs: number;
  data?: any;
  error?: string;
  args: Record<string, any>;
}

export interface WebMCPContextItem {
  id: string;
  key: string;
  type: 'hypothesis' | 'dataset' | 'diagnostic' | 'note' | 'artifact' | 'config';
  title: string;
  content: any;
  tags: string[];
  timestamp: number;
  source: 'human' | 'agent' | 'system';
}

export interface WebMCPEvent {
  id: string;
  type: 'modelcontext:toolregistered' | 'modelcontext:toolexecuted' | 'modelcontext:contextupdated' | 'modelcontext:agentaction';
  timestamp: number;
  details: Record<string, any>;
}

export interface AgentChatMessage {
  id: string;
  sender: 'human' | 'agent' | 'system';
  text: string;
  timestamp: number;
  toolInvocations?: WebMCPToolResult[];
  thoughts?: string[];
  suggestedTools?: string[];
}

export interface TelemetryMetrics {
  fps: number;
  memoryMB: number;
  registeredToolsCount: number;
  contextNodesCount: number;
  totalToolExecutions: number;
  avgLatencyMs: number;
  activeSandboxState: 'secure' | 'isolated' | 'live';
}

export interface ModelContextProtocolAPI {
  registerTool: (tool: WebMCPTool) => void;
  unregisterTool: (name: string) => boolean;
  getTools: () => WebMCPTool[];
  getTool: (name: string) => WebMCPTool | undefined;
  executeTool: (name: string, args: Record<string, any>) => Promise<WebMCPToolResult>;
  provideContext: (item: Omit<WebMCPContextItem, 'id' | 'timestamp'>) => WebMCPContextItem;
  removeContext: (id: string) => boolean;
  getContext: () => WebMCPContextItem[];
  subscribe: (event: string, callback: (event: CustomEvent) => void) => () => void;
  exportManifest: () => object;
  exportCheckpoint: () => string;
}

declare global {
  interface Document {
    modelContext: ModelContextProtocolAPI;
  }
  interface Window {
    modelContext: ModelContextProtocolAPI;
    __WEBMCP_INITIALIZED__?: boolean;
  }
}
