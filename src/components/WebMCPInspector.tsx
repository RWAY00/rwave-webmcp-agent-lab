/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * R-WAVE Universal Intelligence Lab - WebMCP Tool Registry & Execution Playground
 */

import React, { useState } from 'react';
import {
  Search,
  Play,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Code2,
  Terminal,
  Clock,
  Sparkles,
  Sliders,
  FolderTree,
  Cpu,
  Layers,
  FlaskConical,
  Database,
  ExternalLink,
  Activity,
  Globe,
  Music,
  Video,
  FileCode,
  FileText,
  Download,
  Upload,
  Radio,
  Inbox,
} from 'lucide-react';
import {
  WebMCPTool,
  WebMCPToolResult,
  ModelContextProtocolAPI,
  ToolCategory,
  WebMCPParameterProperty,
  WebMCPEvent,
} from '../types/webmcp';
import { exportBatchReports } from '../services/export-service';
import { UniversalIngestionBox } from './UniversalIngestionBox';

interface WebMCPInspectorProps {
  mcp: ModelContextProtocolAPI;
  tools: WebMCPTool[];
  events?: WebMCPEvent[];
  onOpenCustomToolModal: () => void;
  onViewContextGraph?: () => void;
  onOpenReportInbox?: (reportId?: string) => void;
}

export const WebMCPInspector: React.FC<WebMCPInspectorProps> = ({
  mcp,
  tools,
  events = [],
  onOpenCustomToolModal,
  onViewContextGraph,
  onOpenReportInbox,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedToolName, setSelectedToolName] = useState<string>(tools[0]?.name || '');
  const [toolArgs, setToolArgs] = useState<Record<string, any>>({});
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<WebMCPToolResult | null>(null);
  const [copiedResult, setCopiedResult] = useState(false);
  const [viewMode, setViewMode] = useState<'playground' | 'schema'>('playground');

  const selectedTool = tools.find((t) => t.name === selectedToolName) || tools[0];

  // Set initial arguments when selected tool changes
  React.useEffect(() => {
    if (selectedTool) {
      const initialArgs: Record<string, any> = {};
      const props = (selectedTool.parameters?.properties || {}) as Record<string, WebMCPParameterProperty>;
      for (const [key, prop] of Object.entries(props)) {
        if (prop.default !== undefined) {
          initialArgs[key] = prop.default;
        } else if (prop.type === 'string') {
          initialArgs[key] = '';
        } else if (prop.type === 'number') {
          initialArgs[key] = 0;
        } else if (prop.type === 'boolean') {
          initialArgs[key] = false;
        } else if (prop.type === 'array') {
          initialArgs[key] = [];
        }
      }
      setToolArgs(initialArgs);
      setExecutionResult(null);
    }
  }, [selectedToolName]);

  const filteredTools = tools.filter((tool) => {
    const matchesSearch =
      tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || tool.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleExecute = async () => {
    if (!selectedTool) return;
    setIsExecuting(true);
    try {
      const result = await mcp.executeTool(selectedTool.name, toolArgs);
      setExecutionResult(result);
    } catch (err: any) {
      setExecutionResult({
        tool: selectedTool.name,
        success: false,
        timestamp: Date.now(),
        durationMs: 0,
        error: err?.message || String(err),
        args: toolArgs,
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const handleCopyResult = () => {
    if (!executionResult) return;
    navigator.clipboard.writeText(JSON.stringify(executionResult, null, 2));
    setCopiedResult(true);
    setTimeout(() => setCopiedResult(false), 2000);
  };

  const handleExportAll = () => {
    exportBatchReports(mcp, events, 'all');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const lower = file.name.toLowerCase();
    let format = 'json';
    if (lower.endsWith('.wav') || lower.endsWith('.mp3') || lower.endsWith('.flac') || lower.endsWith('.ogg')) {
      format = 'audio';
    } else if (lower.endsWith('.mp4') || lower.endsWith('.webm') || lower.endsWith('.mov')) {
      format = 'video';
    } else if (lower.endsWith('.pdf')) {
      format = 'pdf';
    }

    if (file.type.includes('json') || file.name.endsWith('.json') || file.type.includes('text')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        setToolArgs((prev) => ({
          ...prev,
          fileName: file.name,
          format,
          contentPayload: text,
        }));
      };
      reader.readAsText(file);
    } else {
      setToolArgs((prev) => ({
        ...prev,
        fileName: file.name,
        format,
        contentPayload: `[Binary File Buffer: ${file.name} (${Math.round(file.size / 1024)} KB, ${file.type})]`,
      }));
    }
  };

  const getCategoryBadgeClass = (category: ToolCategory) => {
    switch (category) {
      case 'diagnostic':
        return 'bg-[#00CCCC]/10 text-[#00CCCC] border-[#00CCCC]/30';
      case 'synthesis':
        return 'bg-[#0D9488]/20 text-[#2DD4BF] border-[#0D9488]/40';
      case 'research':
        return 'bg-[#38BDF8]/10 text-[#38BDF8] border-[#38BDF8]/30';
      case 'benchmark':
        return 'bg-[#818CF8]/10 text-[#A5B4FC] border-[#818CF8]/30';
      case 'system':
        return 'bg-[#1E293B] text-[#94A3B8] border-[#334155]';
      default:
        return 'bg-[#00CCCC]/10 text-[#A5F3FC] border-[#00CCCC]/20';
    }
  };

  const getCategoryIcon = (category: ToolCategory, name?: string) => {
    if (name === 'rwave_url_fetcher') return <Globe className="h-3.5 w-3.5 text-[#00CCCC]" />;
    if (name === 'rwave_multimedia_synthesizer') return <Music className="h-3.5 w-3.5 text-[#38BDF8]" />;
    switch (category) {
      case 'diagnostic':
        return <Activity className="h-3.5 w-3.5" />;
      case 'synthesis':
        return <FolderTree className="h-3.5 w-3.5" />;
      case 'research':
        return <Database className="h-3.5 w-3.5" />;
      case 'benchmark':
        return <FlaskConical className="h-3.5 w-3.5" />;
      default:
        return <Cpu className="h-3.5 w-3.5" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Protocol Callout */}
      <div className="rounded-xl bg-gradient-to-r from-[#0F172A]/80 via-[#0D9488]/10 to-[#0F172A]/80 border border-[#1E293B] p-5 shadow-lg">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="h-2 w-2 rounded-full bg-[#00CCCC] animate-cool-pulse" />
              <h2 className="text-lg font-bold text-[#A5F3FC] tracking-tight">
                Client-Side WebMCP Tool Registry
              </h2>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#1E293B] text-[#00CCCC] border border-[#334155]">
                document.modelContext
              </span>
            </div>
            <p className="text-sm text-[#94A3B8] max-w-2xl">
              WebMCP bridges browser-native DOM capabilities directly to AI agents via standard JSON schemas.
              Universal URL ingestion, multi-format multimedia parsing (Audio/Video/JSON/PDF), and client-side benchmarks.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {onOpenReportInbox && (
              <button
                id="inspector-open-inbox-btn"
                onClick={() => onOpenReportInbox()}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#1E293B] hover:bg-[#334155] border border-[#334155] text-[#A5F3FC] font-semibold text-xs transition-all cursor-pointer"
                title="Open Stored Test Reports Vault"
              >
                <Inbox className="h-4 w-4 text-[#00CCCC]" />
                <span>Report Inbox</span>
              </button>
            )}

            <button
              id="inspector-export-all-btn"
              onClick={handleExportAll}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#0F172A] border border-[#00CCCC]/40 hover:border-[#00CCCC] text-[#A5F3FC] font-semibold text-xs transition-all shadow-[0_0_10px_rgba(0,204,204,0.15)] cursor-pointer"
              title="Download all reports, tool outputs, and context graph"
            >
              <Download className="h-4 w-4 text-[#00CCCC]" />
              <span>Export All Reports</span>
            </button>

            <button
              id="btn-register-custom-tool"
              onClick={onOpenCustomToolModal}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#00CCCC] hover:bg-[#00CCCC]/90 text-[#0A0C14] font-bold text-xs tracking-wider uppercase transition-all shadow-[0_0_15px_rgba(0,204,204,0.35)] cursor-pointer"
            >
              <Sparkles className="h-4 w-4" />
              <span>Register Custom Tool</span>
            </button>
          </div>
        </div>
      </div>

      {/* Dedicated Universal URL & Multi-Format Ingestion Box */}
      <UniversalIngestionBox
        mcp={mcp}
        events={events}
        onViewContextGraph={onViewContextGraph}
        onOpenReportInbox={onOpenReportInbox}
      />

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#64748B]" />
          <input
            id="tool-search-input"
            type="text"
            placeholder="Search tools by name, category, or capability (e.g. url, audio, video, pdf, benchmark)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-[#0F172A]/70 border border-[#1E293B] text-[#E0E7FF] placeholder-[#64748B] focus:outline-none focus:border-[#00CCCC]/60 focus:ring-1 focus:ring-[#00CCCC]/40 transition-all font-mono text-xs"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs font-medium">
          {['all', 'synthesis', 'diagnostic', 'research', 'benchmark', 'system', 'custom'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-md capitalize whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-[#1E293B] text-[#A5F3FC] border border-[#00CCCC]/40 shadow-[0_0_10px_rgba(0,204,204,0.2)] font-semibold'
                  : 'text-[#94A3B8] hover:text-[#E0E7FF] bg-[#0F172A]/40 border border-[#1E293B]/60'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Two-Column Tool Matrix & Execution Playground */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Tools List (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between text-[10px] text-[#64748B] uppercase tracking-[0.2em] font-bold px-1">
            <span>AVAILABLE TOOLS ({filteredTools.length})</span>
            <span className="text-[#00CCCC]">STATUS: ACTIVE</span>
          </div>

          <div className="space-y-2.5 max-h-[660px] overflow-y-auto pr-1">
            {filteredTools.length === 0 ? (
              <div className="p-8 text-center rounded-xl bg-[#0F172A]/30 border border-[#1E293B] text-[#94A3B8] text-sm font-mono">
                No WebMCP tools found matching "{searchQuery}".
              </div>
            ) : (
              filteredTools.map((tool) => {
                const isSelected = selectedTool?.name === tool.name;
                const paramCount = Object.keys(tool.parameters?.properties || {}).length;

                return (
                  <div
                    key={tool.name}
                    id={`tool-card-${tool.name}`}
                    onClick={() => setSelectedToolName(tool.name)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#1E293B]/60 border-[#00CCCC]/50 shadow-[0_0_15px_rgba(0,204,204,0.2)]'
                        : 'bg-[#0F172A]/40 border-[#1E293B] hover:bg-[#1E293B]/30 hover:border-[#334155]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2.5">
                        <div className="h-7 w-7 rounded-md bg-[#0A0C14] border border-[#1E293B] flex items-center justify-center text-[#00CCCC]">
                          {getCategoryIcon(tool.category, tool.name)}
                        </div>
                        <div>
                          <h3 className="font-mono text-sm font-semibold text-[#E0E7FF] flex items-center gap-1.5">
                            {tool.name}
                          </h3>
                          <span className="text-[10px] text-[#64748B] font-mono">v{tool.version || '1.0.0'}</span>
                        </div>
                      </div>

                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded-full border capitalize ${getCategoryBadgeClass(
                          tool.category
                        )}`}
                      >
                        {tool.category}
                      </span>
                    </div>

                    <p className="text-xs text-[#CBD5E1] line-clamp-2 mb-3 leading-relaxed">
                      {tool.description}
                    </p>

                    <div className="flex items-center justify-between text-[11px] text-[#94A3B8] font-mono border-t border-[#1E293B] pt-2">
                      <span>{paramCount} parameter{paramCount !== 1 ? 's' : ''}</span>
                      <span className="text-[#00CCCC] font-semibold flex items-center gap-1">
                        Run & Test <Play className="h-3 w-3 fill-current" />
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Execution Playground & Schema Inspector (7 cols) */}
        <div className="lg:col-span-7">
          {selectedTool ? (
            <div className="rounded-xl bg-[#0F172A]/70 border border-[#1E293B] p-5 space-y-5 sticky top-20 shadow-xl">
              {/* Tool Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1E293B] pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-[#A5F3FC] font-mono tracking-tight">
                      {selectedTool.name}
                    </h3>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full border capitalize ${getCategoryBadgeClass(
                        selectedTool.category
                      )}`}
                    >
                      {selectedTool.category}
                    </span>
                  </div>
                  <p className="text-xs text-[#94A3B8] mt-1">{selectedTool.description}</p>
                </div>

                <div className="flex items-center gap-1 bg-[#0A0C14] p-1 rounded-lg border border-[#1E293B] text-xs font-mono">
                  <button
                    onClick={() => setViewMode('playground')}
                    className={`px-2.5 py-1 rounded transition-colors ${
                      viewMode === 'playground'
                        ? 'bg-[#1E293B] text-[#A5F3FC] font-semibold'
                        : 'text-[#94A3B8] hover:text-[#E0E7FF]'
                    }`}
                  >
                    Playground
                  </button>
                  <button
                    onClick={() => setViewMode('schema')}
                    className={`px-2.5 py-1 rounded transition-colors ${
                      viewMode === 'schema'
                        ? 'bg-[#1E293B] text-[#A5F3FC] font-semibold'
                        : 'text-[#94A3B8] hover:text-[#E0E7FF]'
                    }`}
                  >
                    JSON Schema
                  </button>
                </div>
              </div>

              {viewMode === 'schema' ? (
                /* JSON Schema View */
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-[#94A3B8] font-mono">
                    <span className="text-[10px] uppercase tracking-[0.2em] text-[#64748B] font-bold">INPUT SCHEMA DEFINITION</span>
                    <span className="text-[#00CCCC]">OpenAI / Gemini / WebMCP standard</span>
                  </div>
                  <pre className="p-4 rounded-lg bg-black/40 border border-[#1E293B] text-xs font-mono text-[#A5F3FC] overflow-x-auto max-h-[380px]">
                    {JSON.stringify(selectedTool.parameters, null, 2)}
                  </pre>
                </div>
              ) : (
                /* Playground Form View */
                <div className="space-y-4">
                  {/* Tool-Specific Quick Preset Helpers */}
                  {selectedTool.name === 'rwave_url_fetcher' && (
                    <div className="p-3.5 rounded-lg bg-[#0A0C14]/90 border border-[#00CCCC]/30 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-mono font-semibold text-[#A5F3FC] flex items-center gap-1.5">
                          <Globe className="h-3.5 w-3.5 text-[#00CCCC]" /> Quick Test URLs:
                        </span>
                        <span className="text-[10px] text-[#64748B] font-mono">1-Click Context Ingest</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          { label: 'Wikipedia MCP Spec', url: 'https://en.wikipedia.org/wiki/Model_Context_Protocol' },
                          { label: 'W3C Web Standards', url: 'https://www.w3.org/standards/' },
                          { label: 'ArXiv AI Research', url: 'https://arxiv.org/abs/2310.06825' },
                          { label: 'GitHub Docs', url: 'https://docs.github.com' },
                        ].map((preset) => (
                          <button
                            key={preset.label}
                            type="button"
                            onClick={() => setToolArgs((prev) => ({ ...prev, url: preset.url }))}
                            className="px-2.5 py-1 rounded bg-[#1E293B]/70 hover:bg-[#1E293B] border border-[#334155] text-[11px] text-[#A5F3FC] font-mono transition-colors"
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedTool.name === 'rwave_multimedia_synthesizer' && (
                    <div className="p-3.5 rounded-lg bg-[#0A0C14]/90 border border-[#38BDF8]/30 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-mono font-semibold text-[#A5F3FC] flex items-center gap-1.5">
                          <Music className="h-3.5 w-3.5 text-[#38BDF8]" /> Multi-Format Presets & Upload:
                        </span>
                        <label className="text-[10px] text-[#00CCCC] font-mono hover:underline flex items-center gap-1 cursor-pointer">
                          <Upload className="h-3 w-3" /> Select Local File
                          <input type="file" onChange={handleFileUpload} className="hidden" />
                        </label>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            setToolArgs({
                              format: 'audio',
                              fileName: 'neural_frequency_spectrum.wav',
                              autoIngestContext: true,
                              extractSemanticSummary: true,
                              contentPayload: '',
                            })
                          }
                          className="flex items-center justify-center gap-1 px-2 py-1.5 rounded bg-[#1E293B]/70 hover:bg-[#1E293B] border border-[#334155] text-[11px] text-[#38BDF8] font-mono transition-colors"
                        >
                          <Music className="h-3 w-3" /> Audio (.wav)
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setToolArgs({
                              format: 'video',
                              fileName: 'agent_telemetry_stream.mp4',
                              autoIngestContext: true,
                              extractSemanticSummary: true,
                              contentPayload: '',
                            })
                          }
                          className="flex items-center justify-center gap-1 px-2 py-1.5 rounded bg-[#1E293B]/70 hover:bg-[#1E293B] border border-[#334155] text-[11px] text-[#2DD4BF] font-mono transition-colors"
                        >
                          <Video className="h-3 w-3" /> Video (.mp4)
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setToolArgs({
                              format: 'json',
                              fileName: 'quantum_context_schema.json',
                              autoIngestContext: true,
                              extractSemanticSummary: true,
                              contentPayload: JSON.stringify({ dataset: 'WebMCP', version: '1.4.0', status: 'verified', metrics: [12, 18, 9] }, null, 2),
                            })
                          }
                          className="flex items-center justify-center gap-1 px-2 py-1.5 rounded bg-[#1E293B]/70 hover:bg-[#1E293B] border border-[#334155] text-[11px] text-[#A5B4FC] font-mono transition-colors"
                        >
                          <FileCode className="h-3 w-3" /> JSON Dataset
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setToolArgs({
                              format: 'pdf',
                              fileName: 'webmcp_architecture_whitepaper.pdf',
                              autoIngestContext: true,
                              extractSemanticSummary: true,
                              contentPayload: '',
                            })
                          }
                          className="flex items-center justify-center gap-1 px-2 py-1.5 rounded bg-[#1E293B]/70 hover:bg-[#1E293B] border border-[#334155] text-[11px] text-[#E0E7FF] font-mono transition-colors"
                        >
                          <FileText className="h-3 w-3" /> PDF Paper
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs text-[#94A3B8] font-mono">
                      <span className="text-[10px] uppercase tracking-[0.2em] text-[#64748B] font-bold">PARAMETER ARGUMENTS</span>
                      <span className="text-[#0D9488]">JSON Validated</span>
                    </div>

                    {Object.keys(selectedTool.parameters?.properties || {}).length === 0 ? (
                      <div className="p-4 rounded-lg bg-black/20 border border-[#1E293B] text-xs text-[#94A3B8] font-mono">
                        This tool accepts no arguments. Click execute to run.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {Object.entries((selectedTool.parameters.properties || {}) as Record<string, WebMCPParameterProperty>).map(([propName, propDef]) => {
                          const isRequired = (selectedTool.parameters.required || []).includes(propName);
                          return (
                            <div key={propName} className="space-y-1.5">
                              <div className="flex items-center justify-between text-xs">
                                <label className="font-mono text-[#CBD5E1] flex items-center gap-1.5">
                                  <span>{propName}</span>
                                  {isRequired && (
                                    <span className="text-[10px] text-[#00CCCC] font-mono">(required)</span>
                                  )}
                                </label>
                                <span className="text-[10px] font-mono text-[#64748B]">
                                  type: {propDef.type}
                                </span>
                              </div>

                              {propDef.type === 'boolean' ? (
                                <div className="flex items-center gap-3 pt-1">
                                  <label className="flex items-center gap-2 text-xs text-[#CBD5E1] font-mono cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={!!toolArgs[propName]}
                                      onChange={(e) =>
                                        setToolArgs({ ...toolArgs, [propName]: e.target.checked })
                                      }
                                      className="rounded bg-[#0A0C14] border-[#334155] text-[#00CCCC] focus:ring-[#00CCCC]/30"
                                    />
                                    <span>Enabled ({toolArgs[propName] ? 'true' : 'false'})</span>
                                  </label>
                                </div>
                              ) : propDef.enum ? (
                                <select
                                  value={toolArgs[propName] || propDef.enum[0]}
                                  onChange={(e) =>
                                    setToolArgs({ ...toolArgs, [propName]: e.target.value })
                                  }
                                  className="w-full px-3 py-1.5 rounded-lg bg-[#0A0C14] border border-[#1E293B] text-xs text-[#E0E7FF] font-mono focus:outline-none focus:border-[#00CCCC]/60"
                                >
                                  {propDef.enum.map((opt) => (
                                    <option key={opt} value={opt}>
                                      {opt}
                                    </option>
                                  ))}
                                </select>
                              ) : propDef.type === 'number' ? (
                                <input
                                  type="number"
                                  value={toolArgs[propName] ?? 0}
                                  onChange={(e) =>
                                    setToolArgs({
                                      ...toolArgs,
                                      [propName]: parseFloat(e.target.value) || 0,
                                    })
                                  }
                                  className="w-full px-3 py-1.5 rounded-lg bg-[#0A0C14] border border-[#1E293B] text-xs text-[#E0E7FF] font-mono focus:outline-none focus:border-[#00CCCC]/60"
                                />
                              ) : (
                                <input
                                  type="text"
                                  placeholder={propDef.description || `Enter ${propName}...`}
                                  value={toolArgs[propName] ?? ''}
                                  onChange={(e) =>
                                    setToolArgs({ ...toolArgs, [propName]: e.target.value })
                                  }
                                  className="w-full px-3 py-1.5 rounded-lg bg-[#0A0C14] border border-[#1E293B] text-xs text-[#E0E7FF] font-mono focus:outline-none focus:border-[#00CCCC]/60"
                                />
                              )}
                              {propDef.description && (
                                <p className="text-[11px] text-[#64748B]">{propDef.description}</p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Execute Button */}
                  <button
                    id="btn-execute-webmcp-tool"
                    onClick={handleExecute}
                    disabled={isExecuting}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-[#00CCCC] hover:bg-[#00CCCC]/90 text-[#0A0C14] font-bold text-xs uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(0,204,204,0.35)] disabled:opacity-50 cursor-pointer"
                  >
                    {isExecuting ? (
                      <>
                        <span className="h-3.5 w-3.5 rounded-full border-2 border-[#0A0C14] border-t-transparent animate-spin" />
                        <span>Executing in Browser Sandbox...</span>
                      </>
                    ) : (
                      <>
                        <Play className="h-3.5 w-3.5 fill-current" />
                        <span>Execute via document.modelContext.executeTool</span>
                      </>
                    )}
                  </button>

                  {/* Live Execution Output Result */}
                  {executionResult && (
                    <div className="space-y-3 border-t border-[#1E293B] pt-4">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 font-mono">
                          {executionResult.success ? (
                            <span className="flex items-center gap-1 text-[#00CCCC] bg-[#00CCCC]/10 px-2 py-0.5 rounded border border-[#00CCCC]/30 font-semibold">
                              <CheckCircle2 className="h-3.5 w-3.5" /> Success
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-[#F43F5E] bg-[#F43F5E]/10 px-2 py-0.5 rounded border border-[#F43F5E]/30 font-semibold">
                              <AlertCircle className="h-3.5 w-3.5" /> Error
                            </span>
                          )}
                          <span className="text-[#94A3B8] flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {executionResult.durationMs}ms
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={handleExportAll}
                            className="flex items-center gap-1 text-xs text-[#0D9488] hover:text-[#A5F3FC] font-mono transition-colors cursor-pointer"
                            title="Export all reports and outputs"
                          >
                            <Download className="h-3 w-3" /> Export All
                          </button>
                          <button
                            onClick={handleCopyResult}
                            className="flex items-center gap-1 text-xs text-[#94A3B8] hover:text-[#00CCCC] font-mono transition-colors cursor-pointer"
                          >
                            {copiedResult ? (
                              <>
                                <Check className="h-3 w-3 text-[#0D9488]" /> Copied
                              </>
                            ) : (
                              <>
                                <Copy className="h-3 w-3" /> Copy Payload
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Visual Result Enhancements for URL Fetcher and Multimedia Synthesizer */}
                      {executionResult.success && executionResult.data && (
                        <>
                          {/* URL Fetcher Visual Card */}
                          {executionResult.tool === 'rwave_url_fetcher' && executionResult.data.url && (
                            <div className="p-3.5 rounded-lg bg-[#0A0C14] border border-[#00CCCC]/30 space-y-2 font-mono text-xs">
                              <div className="flex items-center justify-between text-[#A5F3FC]">
                                <span className="font-bold flex items-center gap-1.5">
                                  <Globe className="h-3.5 w-3.5 text-[#00CCCC]" />
                                  {executionResult.data.title || executionResult.data.url}
                                </span>
                                <span className="text-[10px] text-[#00CCCC] bg-[#00CCCC]/10 px-2 py-0.5 rounded">
                                  {executionResult.data.estimatedTokens} tokens (~{executionResult.data.wordCount} words)
                                </span>
                              </div>
                              {executionResult.data.headings && executionResult.data.headings.length > 0 && (
                                <div className="space-y-1 pt-1 border-t border-[#1E293B]">
                                  <span className="text-[10px] text-[#64748B] uppercase">Headings Outline:</span>
                                  <div className="flex flex-wrap gap-1">
                                    {executionResult.data.headings.slice(0, 5).map((h: any, i: number) => (
                                      <span key={i} className="text-[10px] px-1.5 py-0.5 bg-[#1E293B] rounded text-[#CBD5E1]">
                                        &lt;{h.tag}&gt; {h.text.slice(0, 30)}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {executionResult.data.mainContentPreview && (
                                <div className="pt-1 border-t border-[#1E293B] text-[11px] text-[#94A3B8] line-clamp-2">
                                  {executionResult.data.mainContentPreview}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Multimedia Visual Card */}
                          {executionResult.tool === 'rwave_multimedia_synthesizer' && executionResult.data.parsedDetails && (
                            <div className="p-3.5 rounded-lg bg-[#0A0C14] border border-[#38BDF8]/30 space-y-2 font-mono text-xs">
                              <div className="flex items-center justify-between text-[#A5F3FC]">
                                <span className="font-bold flex items-center gap-1.5">
                                  {executionResult.data.format === 'audio' ? <Music className="h-3.5 w-3.5 text-[#38BDF8]" /> : executionResult.data.format === 'video' ? <Video className="h-3.5 w-3.5 text-[#2DD4BF]" /> : <FileCode className="h-3.5 w-3.5 text-[#818CF8]" />}
                                  {executionResult.data.fileName} ({executionResult.data.format?.toUpperCase()})
                                </span>
                                <span className="text-[10px] text-[#38BDF8] bg-[#38BDF8]/10 px-2 py-0.5 rounded">
                                  Est. {executionResult.data.estimatedTokens} Tokens
                                </span>
                              </div>

                              {/* Audio Waveform Peak Visualizer */}
                              {executionResult.data.parsedDetails.waveformPeakProfile && (
                                <div className="space-y-1 pt-1 border-t border-[#1E293B]">
                                  <div className="flex items-center justify-between text-[10px] text-[#64748B]">
                                    <span>Waveform Spectral Peaks:</span>
                                    <span>{executionResult.data.parsedDetails.durationFormatted} • {executionResult.data.parsedDetails.bitrateKbps} kbps</span>
                                  </div>
                                  <div className="flex items-end gap-1 h-8 bg-black/40 p-1 rounded border border-[#1E293B]">
                                    {executionResult.data.parsedDetails.waveformPeakProfile.map((peak: number, idx: number) => (
                                      <div
                                        key={idx}
                                        className="flex-1 bg-gradient-to-t from-[#0D9488] to-[#00CCCC] rounded-t-sm"
                                        style={{ height: `${Math.max(10, peak * 100)}%` }}
                                      />
                                    ))}
                                  </div>
                                </div>
                              )}

                              {executionResult.data.summaryText && (
                                <div className="text-[11px] text-[#94A3B8]">
                                  {executionResult.data.summaryText}
                                </div>
                              )}
                            </div>
                          )}
                        </>
                      )}

                      <pre className="p-3.5 rounded-lg bg-black/40 border border-[#1E293B] text-xs font-mono text-[#A5F3FC] overflow-x-auto max-h-[260px]">
                        {JSON.stringify(
                          executionResult.success ? executionResult.data : executionResult.error,
                          null,
                          2
                        )}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="p-12 text-center rounded-xl bg-[#0F172A]/30 border border-[#1E293B] text-[#94A3B8] font-mono">
              Select a WebMCP tool on the left to inspect parameters and test live execution.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
