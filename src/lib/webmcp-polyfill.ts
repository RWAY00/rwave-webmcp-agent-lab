/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * R-WAVE Universal Intelligence Lab - WebMCP Polyfill & Runtime
 *
 * Implements the browser-native Model Context Protocol (WebMCP) standard:
 * https://w3c-cg.github.io/webmcp (or standard specification draft)
 * Exposes `document.modelContext` and `window.modelContext`
 */

import {
  WebMCPTool,
  WebMCPToolResult,
  WebMCPContextItem,
  ModelContextProtocolAPI,
  WebMCPEvent,
} from '../types/webmcp';

class WebMCPRuntime implements ModelContextProtocolAPI {
  private tools: Map<string, WebMCPTool> = new Map();
  private contextStore: Map<string, WebMCPContextItem> = new Map();
  private executionHistory: WebMCPToolResult[] = [];
  private eventHistory: WebMCPEvent[] = [];

  constructor() {
    // Initial setup
  }

  /**
   * Registers a client-side tool with parameters JSON schema and execution handler.
   */
  public registerTool(tool: WebMCPTool): void {
    if (!tool.name) {
      throw new Error('[WebMCP] Tool name is required');
    }
    if (!tool.handler || typeof tool.handler !== 'function') {
      throw new Error(`[WebMCP] Tool "${tool.name}" must provide an executable handler function`);
    }

    this.tools.set(tool.name, {
      ...tool,
      category: tool.category || 'custom',
      version: tool.version || '1.0.0',
    });

    const eventDetail = {
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
      category: tool.category,
      timestamp: Date.now(),
    };

    this.dispatchEvent('modelcontext:toolregistered', eventDetail);
  }

  /**
   * Unregisters an existing tool.
   */
  public unregisterTool(name: string): boolean {
    const exists = this.tools.has(name);
    if (exists) {
      this.tools.delete(name);
      this.dispatchEvent('modelcontext:toolunregistered', { name, timestamp: Date.now() });
    }
    return exists;
  }

  /**
   * Returns list of all currently registered WebMCP tools.
   */
  public getTools(): WebMCPTool[] {
    return Array.from(this.tools.values());
  }

  /**
   * Returns a specific tool by name.
   */
  public getTool(name: string): WebMCPTool | undefined {
    return this.tools.get(name);
  }

  /**
   * Executes a registered WebMCP tool with arguments validation.
   */
  public async executeTool(name: string, args: Record<string, any> = {}): Promise<WebMCPToolResult> {
    const startTime = performance.now();
    const tool = this.tools.get(name);

    if (!tool) {
      const errorResult: WebMCPToolResult = {
        tool: name,
        success: false,
        timestamp: Date.now(),
        durationMs: performance.now() - startTime,
        error: `Tool "${name}" is not registered in document.modelContext`,
        args,
      };
      this.dispatchEvent('modelcontext:toolexecuted', errorResult);
      return errorResult;
    }

    try {
      // Validate required arguments if defined
      if (tool.parameters && tool.parameters.required) {
        for (const req of tool.parameters.required) {
          if (args[req] === undefined || args[req] === null) {
            throw new Error(`Missing required parameter "${req}" for tool "${name}"`);
          }
        }
      }

      // Execute tool handler (supports async/await)
      const data = await Promise.resolve(tool.handler(args));
      const durationMs = Math.round((performance.now() - startTime) * 100) / 100;

      const result: WebMCPToolResult = {
        tool: name,
        success: true,
        timestamp: Date.now(),
        durationMs,
        data,
        args,
      };

      this.executionHistory.push(result);
      if (this.executionHistory.length > 100) {
        this.executionHistory.shift();
      }

      this.dispatchEvent('modelcontext:toolexecuted', result);
      return result;
    } catch (err: any) {
      const durationMs = Math.round((performance.now() - startTime) * 100) / 100;
      const errorResult: WebMCPToolResult = {
        tool: name,
        success: false,
        timestamp: Date.now(),
        durationMs,
        error: err?.message || String(err),
        args,
      };

      this.executionHistory.push(errorResult);
      this.dispatchEvent('modelcontext:toolexecuted', errorResult);
      return errorResult;
    }
  }

  /**
   * Provides structured context into the shared human-agent context graph.
   */
  public provideContext(item: Omit<WebMCPContextItem, 'id' | 'timestamp'>): WebMCPContextItem {
    const id = `ctx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const fullItem: WebMCPContextItem = {
      ...item,
      id,
      timestamp: Date.now(),
    };

    this.contextStore.set(id, fullItem);
    this.dispatchEvent('modelcontext:contextupdated', { action: 'added', item: fullItem });
    return fullItem;
  }

  /**
   * Removes a context node from the store.
   */
  public removeContext(id: string): boolean {
    const item = this.contextStore.get(id);
    if (item) {
      this.contextStore.delete(id);
      this.dispatchEvent('modelcontext:contextupdated', { action: 'removed', id, item });
      return true;
    }
    return false;
  }

  /**
   * Gets all active context items.
   */
  public getContext(): WebMCPContextItem[] {
    return Array.from(this.contextStore.values());
  }

  /**
   * Subscribes to custom WebMCP protocol events.
   */
  public subscribe(eventName: string, callback: (event: CustomEvent) => void): () => void {
    const handler = (e: Event) => callback(e as CustomEvent);
    window.addEventListener(eventName, handler);
    return () => {
      window.removeEventListener(eventName, handler);
    };
  }

  /**
   * Generates a standard MCP Manifest object compatible with OpenAI Function Calling,
   * Anthropic Claude MCP, and Gemini Function Declarations.
   */
  public exportManifest(): object {
    return {
      schemaVersion: '2024-11-05',
      name: 'R-WAVE WebMCP Agent Lab',
      description: 'Browser-native model context protocol tools and active session graph',
      tools: this.getTools().map((t) => ({
        name: t.name,
        description: t.description,
        inputSchema: t.parameters,
        category: t.category,
        author: t.author || 'R-WAVE Lab',
        version: t.version || '1.0.0',
      })),
      contextSize: this.contextStore.size,
      environment: {
        runtime: 'WebMCP Browser Native',
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Node/SSR',
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Exports full session state as checkpoint JSON string.
   */
  public exportCheckpoint(): string {
    return JSON.stringify(
      {
        timestamp: Date.now(),
        isoDate: new Date().toISOString(),
        manifest: this.exportManifest(),
        context: this.getContext(),
        recentExecutions: this.executionHistory.slice(-20),
      },
      null,
      2
    );
  }

  private dispatchEvent(type: string, detail: any) {
    const eventObj: WebMCPEvent = {
      id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      type: type as any,
      timestamp: Date.now(),
      details: detail,
    };
    this.eventHistory.push(eventObj);
    if (this.eventHistory.length > 200) {
      this.eventHistory.shift();
    }

    if (typeof window !== 'undefined') {
      const customEvent = new CustomEvent(type, { detail: { ...detail, _eventMeta: eventObj } });
      window.dispatchEvent(customEvent);
      if (document) {
        document.dispatchEvent(customEvent);
      }
    }
  }
}

// Singleton runtime instance
let globalRuntime: WebMCPRuntime | null = null;

export function initWebMCP(): ModelContextProtocolAPI {
  if (typeof window === 'undefined') {
    return new WebMCPRuntime();
  }

  if (!globalRuntime) {
    globalRuntime = new WebMCPRuntime();
  }

  // Bind to document.modelContext and window.modelContext
  if (typeof document !== 'undefined' && !document.modelContext) {
    document.modelContext = globalRuntime;
  }
  if (typeof window !== 'undefined' && !window.modelContext) {
    window.modelContext = globalRuntime;
    window.__WEBMCP_INITIALIZED__ = true;
  }

  return globalRuntime;
}
