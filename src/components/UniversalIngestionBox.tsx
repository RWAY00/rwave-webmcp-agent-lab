/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * R-WAVE Universal Intelligence Lab - Universal Ingestion Box & Multi-Modal Parser
 */

import React, { useState } from 'react';
import {
  Globe,
  Video,
  Music,
  FileCode,
  FileText,
  Upload,
  Sparkles,
  Download,
  Copy,
  Check,
  RotateCw,
  Sliders,
  Network,
  AlertCircle,
  ExternalLink,
  Cpu,
  Radio,
  ListTree,
  AlignLeft,
  BookOpen,
  Inbox,
  ShieldCheck,
  FileCheck,
  Layers,
} from 'lucide-react';
import { ModelContextProtocolAPI, WebMCPEvent } from '../types/webmcp';
import {
  ReportVault,
  AnalysisRecord,
  generateIsolatedUrlMarkdownReport,
  generateIsolatedMediaMarkdownReport,
} from '../services/report-vault';

interface UniversalIngestionBoxProps {
  mcp: ModelContextProtocolAPI;
  events?: WebMCPEvent[];
  onViewContextGraph?: () => void;
  onOpenReportInbox?: (reportId?: string) => void;
  onNavigateToCanvas?: () => void;
}

export const UniversalIngestionBox: React.FC<UniversalIngestionBoxProps> = ({
  mcp,
  events = [],
  onViewContextGraph,
  onOpenReportInbox,
  onNavigateToCanvas,
}) => {
  const [ingestMode, setIngestMode] = useState<'url' | 'multimedia'>('url');

  // URL Ingest State
  const [urlInput, setUrlInput] = useState('https://en.wikipedia.org/wiki/Model_Context_Protocol');
  const [fullTextExtraction, setFullTextExtraction] = useState(true);
  const [isUrlExecuting, setIsUrlExecuting] = useState(false);
  const [urlResult, setUrlResult] = useState<any | null>(null);
  const [urlError, setUrlError] = useState<string | null>(null);
  const [resultTab, setResultTab] = useState<'sections' | 'fulltext' | 'transcript' | 'metadata'>('sections');
  const [latestUrlRecord, setLatestUrlRecord] = useState<AnalysisRecord | null>(null);

  // Multimedia Ingest State
  const [mediaFormat, setMediaFormat] = useState<'audio' | 'video' | 'json' | 'pdf'>('audio');
  const [mediaFileName, setMediaFileName] = useState('neural_frequency_spectrum.wav');
  const [mediaPayload, setMediaPayload] = useState('');
  const [isMediaExecuting, setIsMediaExecuting] = useState(false);
  const [mediaResult, setMediaResult] = useState<any | null>(null);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [latestMediaRecord, setLatestMediaRecord] = useState<AnalysisRecord | null>(null);

  const [copiedResult, setCopiedResult] = useState(false);
  const [copiedFullText, setCopiedFullText] = useState(false);

  // URL Ingestion Handler with Independent Task Isolation
  const handleExecuteUrlIngest = async (targetUrl?: string) => {
    const urlToFetch = (targetUrl || urlInput).trim();
    if (!urlToFetch) return;

    setIsUrlExecuting(true);
    setUrlError(null);
    setUrlResult(null);
    setLatestUrlRecord(null);

    const startTime = Date.now();

    try {
      const result = await mcp.executeTool('rwave_url_fetcher', {
        url: urlToFetch,
        fullTextExtraction: fullTextExtraction,
        extractMainContent: true,
        includeHeadingsAndLinks: true,
        autoIngestIntoContext: true,
      });

      const latencyMs = Date.now() - startTime;

      if (result.success) {
        const data = result.data;
        setUrlResult(data);
        if (data.isVideoResource || data.transcriptSegments) {
          setResultTab('transcript');
        } else {
          setResultTab('sections');
        }

        // Generate isolated Markdown report specifically for this URL task
        const isolatedMarkdown = generateIsolatedUrlMarkdownReport({
          url: urlToFetch,
          title: data.title || urlToFetch,
          domain: data.url ? new URL(data.url).hostname : undefined,
          isVideoResource: data.isVideoResource,
          author: data.author,
          authorUrl: data.authorUrl,
          videoId: data.videoId,
          thumbnailUrl: data.thumbnailUrl,
          chapters: data.chapters,
          transcriptSegments: data.transcriptSegments,
          spokenSummary: data.spokenSummary,
          keyTakeaways: data.keyTakeaways,
          latencyMs: data.latencyMs || latencyMs,
          wordCount: data.wordCount || (data.fullContent ? data.fullContent.split(/\s+/).length : 0),
          estimatedTokens: data.estimatedTokens,
          metaSummary: data.metaSummary,
          sections: data.sections,
          links: data.links || data.linksSample,
          headings: data.headings,
          fullContent: data.fullContent || data.mainContentPreview,
          rawHtmlSizeKB: data.rawHtmlSizeKB,
          contextNodeId: data.contextNodeId,
          timestamp: Date.now(),
        });

        // Save into isolated Report Vault
        const newRecord: AnalysisRecord = {
          id: `rep_url_${Date.now()}`,
          taskId: `task_url_${Date.now()}`,
          title: data.title || `Web Ingestion: ${urlToFetch}`,
          type: 'url',
          target: urlToFetch,
          timestamp: Date.now(),
          dateFormatted: new Date().toLocaleString('en-US', {
            dateStyle: 'medium',
            timeStyle: 'short',
          }),
          latencyMs: data.latencyMs || latencyMs,
          wordCount: data.wordCount || (data.fullContent ? data.fullContent.split(/\s+/).length : 0),
          estimatedTokens: data.estimatedTokens,
          summaryText: data.spokenSummary || data.metaSummary?.description || `Clean DOM extraction from ${urlToFetch}`,
          markdownContent: isolatedMarkdown,
          structuredData: data,
          tags: ['url-ingest', data.isVideoResource ? 'video-transcript' : 'web-context', 'webmcp-task', 'isolated-report'],
        };

        const saved = ReportVault.saveRecord(newRecord);
        setLatestUrlRecord(saved);
      } else {
        setUrlError(result.error || 'Failed to fetch and parse URL context');
      }
    } catch (err: any) {
      setUrlError(err?.message || 'Execution exception during URL ingestion');
    } finally {
      setIsUrlExecuting(false);
    }
  };

  // Multimedia Ingestion Handler with Independent Task Isolation
  const handleExecuteMediaIngest = async (
    customParams?: { format: 'audio' | 'video' | 'json' | 'pdf'; fileName: string; payload?: string }
  ) => {
    const format = customParams?.format || mediaFormat;
    const fileName = customParams?.fileName || mediaFileName;
    const payload = customParams?.payload !== undefined ? customParams.payload : mediaPayload;

    setIsMediaExecuting(true);
    setMediaError(null);
    setMediaResult(null);
    setLatestMediaRecord(null);

    const startTime = Date.now();

    try {
      const result = await mcp.executeTool('rwave_multimedia_synthesizer', {
        format,
        fileName,
        contentPayload: payload,
        autoIngestContext: true,
        extractSemanticSummary: true,
      });

      const latencyMs = Date.now() - startTime;

      if (result.success) {
        const data = result.data;
        setMediaResult(data);

        // Generate isolated Markdown report specifically for this Media task
        const isolatedMarkdown = generateIsolatedMediaMarkdownReport({
          format,
          fileName,
          latencyMs: data.latencyMs || latencyMs,
          wordCount: data.wordCount || 120,
          estimatedTokens: data.estimatedTokens || 450,
          summaryText: data.summaryText || data.synthesisSummary,
          parsedDetails: data.parsedDetails,
          contextNodeId: data.contextNodeId,
          timestamp: Date.now(),
        });

        // Save into isolated Report Vault
        const newRecord: AnalysisRecord = {
          id: `rep_media_${Date.now()}`,
          taskId: `task_media_${Date.now()}`,
          title: `Media Synthesis: ${fileName} (${format.toUpperCase()})`,
          type: format,
          target: fileName,
          timestamp: Date.now(),
          dateFormatted: new Date().toLocaleString('en-US', {
            dateStyle: 'medium',
            timeStyle: 'short',
          }),
          latencyMs: data.latencyMs || latencyMs,
          wordCount: data.wordCount || 120,
          estimatedTokens: data.estimatedTokens || 450,
          summaryText: data.summaryText || data.synthesisSummary || `Synthesis of ${fileName}`,
          markdownContent: isolatedMarkdown,
          structuredData: data,
          tags: ['multimedia', format, 'isolated-report'],
        };

        const saved = ReportVault.saveRecord(newRecord);
        setLatestMediaRecord(saved);
      } else {
        setMediaError(result.error || 'Failed to synthesize multimedia content');
      }
    } catch (err: any) {
      setMediaError(err?.message || 'Execution exception during media synthesis');
    } finally {
      setIsMediaExecuting(false);
    }
  };

  // Handle File Upload / Drop
  const processUploadedFile = (file: File) => {
    const lower = file.name.toLowerCase();
    let format: 'audio' | 'video' | 'json' | 'pdf' = 'json';

    if (lower.endsWith('.wav') || lower.endsWith('.mp3') || lower.endsWith('.flac') || lower.endsWith('.ogg') || lower.endsWith('.aac')) {
      format = 'audio';
    } else if (lower.endsWith('.mp4') || lower.endsWith('.webm') || lower.endsWith('.mov') || lower.endsWith('.mkv')) {
      format = 'video';
    } else if (lower.endsWith('.pdf')) {
      format = 'pdf';
    }

    setMediaFormat(format);
    setMediaFileName(file.name);

    if (file.type.includes('json') || file.name.endsWith('.json') || file.type.includes('text')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        setMediaPayload(text);
        handleExecuteMediaIngest({ format, fileName: file.name, payload: text });
      };
      reader.readAsText(file);
    } else {
      const payloadInfo = `[Binary File Buffer: ${file.name} (${Math.round(file.size / 1024)} KB, ${file.type || 'octet-stream'})]`;
      setMediaPayload(payloadInfo);
      handleExecuteMediaIngest({ format, fileName: file.name, payload: payloadInfo });
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processUploadedFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processUploadedFile(file);
    }
  };

  // Export isolated report specifically for this URL task
  const handleExportIsolatedUrlReport = () => {
    if (latestUrlRecord) {
      ReportVault.exportSingleRecord(latestUrlRecord, 'markdown');
    }
  };

  // Export isolated report specifically for this Media task
  const handleExportIsolatedMediaReport = () => {
    if (latestMediaRecord) {
      ReportVault.exportSingleRecord(latestMediaRecord, 'markdown');
    }
  };

  const handleCopyJson = (data: any) => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopiedResult(true);
    setTimeout(() => setCopiedResult(false), 2000);
  };

  const urlPresets = [
    {
      label: 'YouTube Video',
      tag: 'Video Stream',
      url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      icon: <Video className="h-3 w-3 text-[#2DD4BF]" />,
    },
    {
      label: 'Wikipedia WebMCP',
      tag: 'DOM Hierarchy',
      url: 'https://en.wikipedia.org/wiki/Model_Context_Protocol',
      icon: <Globe className="h-3 w-3 text-[#00CCCC]" />,
    },
    {
      label: 'W3C Web Standards',
      tag: 'Spec Outline',
      url: 'https://www.w3.org/standards/',
      icon: <Globe className="h-3 w-3 text-[#38BDF8]" />,
    },
    {
      label: 'ArXiv AI Research',
      tag: 'Research Paper',
      url: 'https://arxiv.org/abs/2310.06825',
      icon: <FileText className="h-3 w-3 text-[#818CF8]" />,
    },
  ];

  const mediaPresets = [
    {
      format: 'audio' as const,
      label: 'Acoustic Audio Spectrum',
      desc: 'WAV / MP3 Frequency analysis',
      fileName: 'neural_audio_spectrum.wav',
      icon: <Music className="h-4 w-4 text-[#00CCCC]" />,
    },
    {
      format: 'video' as const,
      label: 'Video Keyframe Stream',
      desc: 'MP4 / WebM Frame breakdown',
      fileName: 'agent_interaction_feed.mp4',
      icon: <Video className="h-4 w-4 text-[#2DD4BF]" />,
    },
    {
      format: 'pdf' as const,
      label: 'PDF Context Document',
      desc: 'Structured text & chapter layout',
      fileName: 'webmcp_spec_draft_v1.4.pdf',
      icon: <FileText className="h-4 w-4 text-[#818CF8]" />,
    },
    {
      format: 'json' as const,
      label: 'JSON Knowledge Tree',
      desc: 'Hierarchical schema properties',
      fileName: 'autonomous_agent_graph.json',
      icon: <FileCode className="h-4 w-4 text-[#A5F3FC]" />,
    },
  ];

  return (
    <section className="rounded-2xl bg-[#0F172A]/70 border border-[#1E293B] p-5 sm:p-6 space-y-5 shadow-xl backdrop-blur-md relative overflow-hidden">
      {/* Top Banner: Ingestion Mode Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1E293B] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-[#00CCCC]/10 border border-[#00CCCC]/30 flex items-center justify-center text-[#00CCCC]">
              <Sparkles className="h-4 w-4" />
            </div>
            <h3 className="text-base font-bold text-[#A5F3FC] tracking-tight">
              Universal Multi-Modal &amp; URL Ingestion Engine
            </h3>
          </div>
          <p className="text-xs text-[#94A3B8] mt-0.5">
            Ingest live Webpages, YouTube videos, Audio spectra, PDFs, and JSON directly into browser WebMCP context.
          </p>
        </div>

        {/* Mode Switcher Tabs & Inbox Shortcut */}
        <div className="flex items-center gap-2">
          <div className="flex items-center p-1 rounded-xl bg-[#0A0C14] border border-[#1E293B] text-xs">
            <button
              id="tab-ingest-url"
              type="button"
              onClick={() => setIngestMode('url')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                ingestMode === 'url'
                  ? 'bg-gradient-to-r from-[#00CCCC] to-[#0D9488] text-[#0A0C14] shadow-[0_0_10px_rgba(0,204,204,0.3)]'
                  : 'text-[#94A3B8] hover:text-[#E0E7FF]'
              }`}
            >
              <Globe className="h-3.5 w-3.5" />
              <span>Web &amp; Video URLs</span>
            </button>
            <button
              id="tab-ingest-media"
              type="button"
              onClick={() => setIngestMode('multimedia')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                ingestMode === 'multimedia'
                  ? 'bg-gradient-to-r from-[#00CCCC] to-[#0D9488] text-[#0A0C14] shadow-[0_0_10px_rgba(0,204,204,0.3)]'
                  : 'text-[#94A3B8] hover:text-[#E0E7FF]'
              }`}
            >
              <Sliders className="h-3.5 w-3.5" />
              <span>Media &amp; Files</span>
            </button>
          </div>

          {onOpenReportInbox && (
            <button
              onClick={() => onOpenReportInbox()}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#1E293B] hover:bg-[#334155] text-[#A5F3FC] text-xs font-semibold border border-[#334155] transition-colors cursor-pointer"
              title="Open Stored Reports Inbox"
            >
              <Inbox className="h-3.5 w-3.5 text-[#00CCCC]" />
              <span className="hidden sm:inline">Report Inbox</span>
            </button>
          )}
        </div>
      </div>

      {/* Mode 1: URL DOM Ingestion */}
      {ingestMode === 'url' && (
        <div className="space-y-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleExecuteUrlIngest();
            }}
            className="flex flex-col gap-2.5"
          >
            <div className="flex flex-col sm:flex-row items-stretch gap-2.5">
              <div className="relative flex-1">
                <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#00CCCC]" />
                <input
                  id="url-ingest-input"
                  type="text"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="Enter any Webpage or YouTube Video URL (e.g. https://en.wikipedia.org/... or https://youtube.com/...)"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0A0C14] border border-[#1E293B] text-xs text-[#E0E7FF] placeholder-[#64748B] focus:outline-none focus:border-[#00CCCC] focus:ring-1 focus:ring-[#00CCCC]/40 transition-all font-mono"
                />
              </div>

              <button
                id="btn-run-url-ingest"
                type="submit"
                disabled={isUrlExecuting || !urlInput.trim()}
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#00CCCC] to-[#0D9488] hover:opacity-95 text-[#0A0C14] font-bold text-xs uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(0,204,204,0.35)] disabled:opacity-50 cursor-pointer whitespace-nowrap"
              >
                {isUrlExecuting ? (
                  <>
                    <RotateCw className="h-4 w-4 animate-spin text-[#0A0C14]" />
                    <span>Ingesting DOM...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 text-[#0A0C14]" />
                    <span>Ingest &amp; Extract</span>
                  </>
                )}
              </button>
            </div>

            {/* Toggle Controls: Full Text Extraction */}
            <div className="flex items-center justify-between px-1 flex-wrap gap-2 text-xs">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  id="chk-fulltext-extraction"
                  type="checkbox"
                  checked={fullTextExtraction}
                  onChange={(e) => setFullTextExtraction(e.target.checked)}
                  className="rounded border-[#334155] bg-[#0A0C14] text-[#00CCCC] focus:ring-0 focus:ring-offset-0 h-3.5 w-3.5"
                />
                <span className="text-[11px] text-[#A5F3FC] font-medium">
                  Full Text Extraction <span className="text-[#64748B] font-light">(no character truncation limit)</span>
                </span>
              </label>
              <div className="flex items-center gap-2 text-[10px] text-[#64748B]">
                <span>✓ HTML/Wikitext Sanitized</span>
                <span>•</span>
                <span>✓ Section Hierarchy Parser</span>
                <span>•</span>
                <span>✓ Single-Task Isolated Report</span>
              </div>
            </div>
          </form>

          {/* Quick Presets */}
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <span className="text-[10px] text-[#64748B] uppercase tracking-wider font-semibold">1-Click Presets:</span>
            {urlPresets.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => {
                  setUrlInput(preset.url);
                  handleExecuteUrlIngest(preset.url);
                }}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#0F172A] hover:bg-[#1E293B] border border-[#1E293B] hover:border-[#00CCCC]/40 text-[11px] text-[#A5F3FC] transition-all cursor-pointer"
              >
                {preset.icon}
                <span>{preset.label}</span>
                <span className="text-[9px] px-1 py-0.2 rounded bg-[#0A0C14] text-[#64748B] border border-[#1E293B]">
                  {preset.tag}
                </span>
              </button>
            ))}
          </div>

          {/* Error Banner */}
          {urlError && (
            <div className="p-3.5 rounded-xl bg-[#00CCCC]/10 border border-[#00CCCC]/40 text-[#A5F3FC] text-xs flex items-center gap-2.5">
              <AlertCircle className="h-4 w-4 text-[#00CCCC] flex-shrink-0" />
              <span>{urlError}</span>
            </div>
          )}

          {/* Execution Result Card */}
          {urlResult && (
            <div className="rounded-xl bg-[#0A0C14] border border-[#00CCCC]/40 p-4 space-y-3.5 shadow-lg">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#1E293B] pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-[#00CCCC]/10 border border-[#00CCCC]/30 flex items-center justify-center text-[#00CCCC]">
                    {urlResult.isVideoResource ? <Video className="h-4 w-4 text-[#2DD4BF]" /> : <Globe className="h-4 w-4 text-[#00CCCC]" />}
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-[#A5F3FC] flex items-center gap-2">
                      {urlResult.title || urlResult.url}
                      {urlResult.contextNodeRegistered && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#0D9488]/30 text-[#2DD4BF] border border-[#0D9488]/50 font-mono">
                          ✓ Registered in WebMCP Context
                        </span>
                      )}
                    </h4>
                    <p className="text-[10px] text-[#64748B] font-mono flex items-center gap-2 mt-0.5">
                      <span>{urlResult.url}</span>
                      <span>•</span>
                      <span>{urlResult.latencyMs}ms</span>
                      <span>•</span>
                      <span className="text-[#2DD4BF] font-semibold">{urlResult.wordCount || 0} words (~{urlResult.estimatedTokens || 0} tokens)</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  {onNavigateToCanvas && (
                    <button
                      onClick={onNavigateToCanvas}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#0D9488]/20 text-[#2DD4BF] border border-[#0D9488]/40 hover:bg-[#0D9488]/30 text-[11px] font-semibold transition-colors cursor-pointer"
                      title="View dynamic research card on Interactive Canvas"
                    >
                      <Layers className="h-3 w-3 text-[#2DD4BF]" />
                      <span>Canvas Card</span>
                    </button>
                  )}
                  {latestUrlRecord && onOpenReportInbox && (
                    <button
                      onClick={() => onOpenReportInbox(latestUrlRecord.id)}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#00CCCC]/15 text-[#00CCCC] border border-[#00CCCC]/40 hover:bg-[#00CCCC]/25 text-[11px] font-semibold transition-colors cursor-pointer"
                      title="Open this isolated report in Report Inbox"
                    >
                      <Inbox className="h-3 w-3" />
                      <span>View in Inbox</span>
                    </button>
                  )}
                  {onViewContextGraph && (
                    <button
                      onClick={onViewContextGraph}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#1E293B] text-[#A5F3FC] border border-[#334155] hover:bg-[#334155] text-[11px] font-semibold transition-colors cursor-pointer"
                    >
                      <Network className="h-3 w-3 text-[#00CCCC]" />
                      <span>Graph</span>
                    </button>
                  )}
                  <button
                    id="btn-export-isolated-url-report"
                    onClick={handleExportIsolatedUrlReport}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#00CCCC] text-[#0A0C14] hover:bg-[#00CCCC]/90 font-bold text-[11px] transition-all shadow-[0_0_10px_rgba(0,204,204,0.25)] cursor-pointer"
                    title="Export isolated Markdown report with zero data blending"
                  >
                    <Download className="h-3 w-3" />
                    <span>Export Report</span>
                  </button>
                  <button
                    onClick={() => handleCopyJson(urlResult)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#1E293B] text-[#94A3B8] hover:text-[#A5F3FC] border border-[#334155] text-[11px] transition-colors cursor-pointer"
                  >
                    {copiedResult ? <Check className="h-3 w-3 text-[#0D9488]" /> : <Copy className="h-3 w-3" />}
                    <span>{copiedResult ? 'Copied' : 'JSON'}</span>
                  </button>
                </div>
              </div>

              {/* Task Isolation Badge */}
              <div className="flex items-center justify-between text-[11px] px-3 py-1.5 rounded-lg bg-[#0F172A] border border-[#1E293B] text-[#94A3B8]">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-3.5 w-3.5 text-[#00CCCC]" />
                  <span className="text-[#A5F3FC] font-semibold">Independent Task Isolation:</span>
                  <span>This analysis record is cleanly separated in memory and stored in the Report Inbox.</span>
                </div>
                {latestUrlRecord && (
                  <span className="text-[10px] font-mono text-[#2DD4BF]">
                    ✓ Stored in Inbox ({latestUrlRecord.id.slice(0, 16)})
                  </span>
                )}
              </div>

              {/* Result View Tab Selector */}
              <div className="flex items-center justify-between border-b border-[#1E293B] pb-2">
                <div className="flex items-center gap-1.5 text-xs flex-wrap">
                  {(urlResult.isVideoResource || urlResult.transcriptSegments || urlResult.chapters) && (
                    <button
                      onClick={() => setResultTab('transcript')}
                      className={`flex items-center gap-1.5 px-3 py-1.2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        resultTab === 'transcript'
                          ? 'bg-[#00CCCC]/15 text-[#00CCCC] border border-[#00CCCC]/40 shadow-[0_0_8px_rgba(0,204,204,0.15)]'
                          : 'text-[#94A3B8] hover:text-[#A5F3FC]'
                      }`}
                    >
                      <Video className="h-3.5 w-3.5 text-[#2DD4BF]" />
                      <span>Chapters &amp; Transcript ({urlResult.transcriptSegments?.length || urlResult.chapters?.length || 0})</span>
                    </button>
                  )}

                  <button
                    onClick={() => setResultTab('sections')}
                    className={`flex items-center gap-1.5 px-3 py-1.2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      resultTab === 'sections'
                        ? 'bg-[#00CCCC]/10 text-[#00CCCC] border border-[#00CCCC]/30 shadow-[0_0_8px_rgba(0,204,204,0.15)]'
                        : 'text-[#94A3B8] hover:text-[#A5F3FC]'
                    }`}
                  >
                    <ListTree className="h-3.5 w-3.5" />
                    <span>Section-Wise Breakdown ({urlResult.sections?.length || urlResult.headings?.length || 0})</span>
                  </button>

                  <button
                    onClick={() => setResultTab('fulltext')}
                    className={`flex items-center gap-1.5 px-3 py-1.2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      resultTab === 'fulltext'
                        ? 'bg-[#00CCCC]/10 text-[#00CCCC] border border-[#00CCCC]/30 shadow-[0_0_8px_rgba(0,204,204,0.15)]'
                        : 'text-[#94A3B8] hover:text-[#A5F3FC]'
                    }`}
                  >
                    <AlignLeft className="h-3.5 w-3.5" />
                    <span>Full Extracted Text ({urlResult.wordCount || 0} words)</span>
                  </button>

                  <button
                    onClick={() => setResultTab('metadata')}
                    className={`flex items-center gap-1.5 px-3 py-1.2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      resultTab === 'metadata'
                        ? 'bg-[#00CCCC]/10 text-[#00CCCC] border border-[#00CCCC]/30 shadow-[0_0_8px_rgba(0,204,204,0.15)]'
                        : 'text-[#94A3B8] hover:text-[#A5F3FC]'
                    }`}
                  >
                    <BookOpen className="h-3.5 w-3.5" />
                    <span>DOM Telemetry &amp; Links</span>
                  </button>
                </div>

                {resultTab === 'fulltext' && (
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(urlResult.fullContent || urlResult.mainContentPreview || '');
                      setCopiedFullText(true);
                      setTimeout(() => setCopiedFullText(false), 2000);
                    }}
                    className="flex items-center gap-1 text-[11px] text-[#00CCCC] hover:text-[#A5F3FC] cursor-pointer"
                  >
                    {copiedFullText ? <Check className="h-3 w-3 text-[#0D9488]" /> : <Copy className="h-3 w-3" />}
                    <span>{copiedFullText ? 'Copied' : 'Copy All Text'}</span>
                  </button>
                )}
              </div>

              {/* TAB 0: YouTube Transcript & Chapter Breakdown */}
              {resultTab === 'transcript' && (
                <div className="space-y-3.5 max-h-80 overflow-y-auto pr-1">
                  {/* Spoken Summary */}
                  {(urlResult.spokenSummary || urlResult.metaSummary?.description) && (
                    <div className="p-3 rounded-lg bg-[#0F172A] border border-[#1E293B] space-y-1">
                      <div className="text-[10px] text-[#00CCCC] font-mono uppercase tracking-wider font-bold">
                        Executive Spoken Summary:
                      </div>
                      <p className="text-xs text-[#E0E7FF] leading-relaxed">
                        {urlResult.spokenSummary || urlResult.metaSummary?.description}
                      </p>
                    </div>
                  )}

                  {/* Chapters Table */}
                  {urlResult.chapters && urlResult.chapters.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="text-[10px] text-[#64748B] uppercase tracking-wider font-semibold">
                        Structured Chapter Breakdown ({urlResult.chapters.length} chapters):
                      </div>
                      <div className="space-y-1.5">
                        {urlResult.chapters.map((ch: any, idx: number) => (
                          <div
                            key={idx}
                            className="p-2.5 rounded-lg bg-[#0F172A] border border-[#1E293B] flex items-start gap-2.5 text-xs"
                          >
                            <span className="px-2 py-0.5 rounded bg-[#00CCCC]/10 text-[#00CCCC] border border-[#00CCCC]/30 text-[10px] font-mono font-bold whitespace-nowrap">
                              {ch.timestamp}
                            </span>
                            <div className="flex-1 min-w-0">
                              <h6 className="font-bold text-[#A5F3FC] text-xs">{ch.title}</h6>
                              <p className="text-[11px] text-[#94A3B8] leading-normal mt-0.5">{ch.summary}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Transcript Dialogue Table */}
                  {urlResult.transcriptSegments && urlResult.transcriptSegments.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="text-[10px] text-[#64748B] uppercase tracking-wider font-semibold">
                        Synchronized Spoken Dialogue Segments ({urlResult.transcriptSegments.length} entries):
                      </div>
                      <div className="space-y-1.5">
                        {urlResult.transcriptSegments.map((seg: any, idx: number) => (
                          <div
                            key={idx}
                            className="p-2.5 rounded-lg bg-[#0F172A]/80 border border-[#1E293B] space-y-1 text-xs"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-[11px] text-[#2DD4BF]">{seg.speaker}</span>
                              <span className="px-1.5 py-0.2 rounded bg-[#0A0C14] text-[#64748B] border border-[#1E293B] text-[10px] font-mono">
                                {seg.timeRange}
                              </span>
                            </div>
                            <p className="text-xs text-[#CBD5E1] font-serif italic pl-1 border-l border-[#00CCCC]/40">
                              "{seg.text}"
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 1: Section-Wise Breakdown View */}
              {resultTab === 'sections' && (
                <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                  {urlResult.sections && urlResult.sections.length > 0 ? (
                    urlResult.sections.map((sec: any, sIdx: number) => (
                      <div
                        key={sIdx}
                        className="p-3 rounded-lg bg-[#0F172A]/80 border border-[#1E293B] hover:border-[#00CCCC]/40 transition-all space-y-1.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="px-1.5 py-0.5 rounded bg-[#00CCCC]/10 text-[#00CCCC] border border-[#00CCCC]/30 text-[10px] font-mono font-bold uppercase">
                              &lt;{sec.tag || 'h2'}&gt;
                            </span>
                            <h5 className="font-bold text-xs text-[#A5F3FC]">
                              {sec.heading}
                            </h5>
                          </div>
                          <span className="text-[10px] text-[#64748B] font-mono">
                            {sec.wordCount || 0} words
                          </span>
                        </div>
                        <p className="text-xs text-[#CBD5E1] whitespace-pre-line leading-relaxed font-sans pl-1">
                          {sec.content || '(No body text)'}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 rounded-lg bg-[#0F172A] border border-[#1E293B] text-xs text-[#94A3B8]">
                      {urlResult.mainContentPreview || 'No sections extracted.'}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: Complete Readable Body Text View */}
              {resultTab === 'fulltext' && (
                <div className="space-y-2">
                  <div className="p-3.5 rounded-lg bg-black/50 border border-[#1E293B] max-h-72 overflow-y-auto font-sans text-xs text-[#E0E7FF] leading-relaxed whitespace-pre-wrap select-text">
                    {urlResult.fullContent || urlResult.mainContentPreview || 'No content extracted.'}
                  </div>
                </div>
              )}

              {/* TAB 3: Metadata & Telemetry View */}
              {resultTab === 'metadata' && (
                <div className="space-y-3 text-xs">
                  {urlResult.metaSummary && (
                    <div className="p-3 rounded-lg bg-[#0F172A] border border-[#1E293B] space-y-1 text-xs">
                      <div className="text-[11px] text-[#64748B] font-mono">Meta Summary &amp; OpenGraph:</div>
                      <div className="text-[#A5F3FC]"><strong>Description:</strong> {urlResult.metaSummary.description || 'N/A'}</div>
                      <div className="text-[#94A3B8]"><strong>Author:</strong> {urlResult.metaSummary.author || 'N/A'}</div>
                      {urlResult.metaSummary.keywords && (
                        <div className="text-[#64748B]"><strong>Keywords:</strong> {urlResult.metaSummary.keywords}</div>
                      )}
                    </div>
                  )}

                  {urlResult.links && urlResult.links.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="text-[10px] text-[#64748B] uppercase tracking-wider font-semibold">
                        Extracted Anchor Links Directory ({urlResult.links.length} sample):
                      </div>
                      <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
                        {urlResult.links.map((link: any, idx: number) => (
                          <a
                            key={idx}
                            href={link.href}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1 px-2 py-0.8 rounded bg-[#1E293B] text-[10px] text-[#00CCCC] hover:underline border border-[#334155]"
                          >
                            <span>{link.text}</span>
                            <ExternalLink className="h-2.5 w-2.5" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Mode 2: Multi-Format Media Ingestion */}
      {ingestMode === 'multimedia' && (
        <div className="space-y-3.5">
          {/* Format Quick Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            {mediaPresets.map((preset) => (
              <button
                key={preset.format}
                type="button"
                onClick={() => {
                  setMediaFormat(preset.format);
                  setMediaFileName(preset.fileName);
                  handleExecuteMediaIngest({ format: preset.format, fileName: preset.fileName });
                }}
                className={`p-2.5 rounded-xl border flex flex-col items-start gap-1 transition-all cursor-pointer text-left ${
                  mediaFormat === preset.format
                    ? 'bg-[#1E293B] border-[#00CCCC] shadow-[0_0_12px_rgba(0,204,204,0.2)] text-[#A5F3FC]'
                    : 'bg-[#0F172A] border-[#1E293B] text-[#94A3B8] hover:border-[#334155]'
                }`}
              >
                <div className="flex items-center gap-1.5 font-semibold text-xs text-[#E0E7FF]">
                  {preset.icon}
                  <span>{preset.label}</span>
                </div>
                <span className="text-[10px] text-[#64748B]">{preset.desc}</span>
              </button>
            ))}
          </div>

          {/* Drag & Drop File Upload Area */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-5 text-center transition-all flex flex-col items-center justify-center gap-2 ${
              dragOver
                ? 'border-[#00CCCC] bg-[#00CCCC]/10'
                : 'border-[#1E293B] hover:border-[#00CCCC]/50 bg-[#0A0C14]'
            }`}
          >
            <Upload className="h-6 w-6 text-[#00CCCC]" />
            <div>
              <p className="text-xs text-[#E0E7FF] font-semibold">
                Drag and drop Audio (.wav/.mp3), Video (.mp4), JSON, or PDF file
              </p>
              <p className="text-[10px] text-[#64748B]">
                Files are analyzed locally inside the client browser sandbox with zero external leaks
              </p>
            </div>
            <label className="px-3.5 py-1.5 rounded-lg bg-[#1E293B] hover:bg-[#334155] border border-[#334155] text-xs text-[#A5F3FC] font-semibold cursor-pointer transition-colors mt-1">
              Select Local File
              <input type="file" onChange={handleFileInputChange} className="hidden" />
            </label>
          </div>

          {/* Manual Run Action */}
          <div className="flex items-center justify-between text-xs pt-1">
            <span className="text-[11px] text-[#94A3B8]">
              Current Target: <code className="text-[#00CCCC]">{mediaFileName}</code> ({mediaFormat.toUpperCase()})
            </span>

            <button
              id="btn-run-media-ingest"
              type="button"
              onClick={() => handleExecuteMediaIngest()}
              disabled={isMediaExecuting}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#00CCCC] hover:bg-[#00CCCC]/90 text-[#0A0C14] font-bold text-xs uppercase tracking-wider transition-all shadow-[0_0_12px_rgba(0,204,204,0.3)] disabled:opacity-50 cursor-pointer"
            >
              {isMediaExecuting ? (
                <>
                  <RotateCw className="h-3.5 w-3.5 animate-spin" />
                  <span>Synthesizing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Synthesize {mediaFormat.toUpperCase()}</span>
                </>
              )}
            </button>
          </div>

          {/* Error Banner */}
          {mediaError && (
            <div className="p-3.5 rounded-xl bg-[#00CCCC]/10 border border-[#00CCCC]/40 text-[#A5F3FC] text-xs flex items-center gap-2.5">
              <AlertCircle className="h-4 w-4 text-[#00CCCC] flex-shrink-0" />
              <span>{mediaError}</span>
            </div>
          )}

          {/* Media Synthesis Result */}
          {mediaResult && (
            <div className="rounded-xl bg-[#0A0C14] border border-[#38BDF8]/40 p-4 space-y-3.5 shadow-lg">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#1E293B] pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-[#38BDF8]/10 border border-[#38BDF8]/30 flex items-center justify-center text-[#38BDF8]">
                    {mediaResult.format === 'audio' ? <Music className="h-4 w-4" /> : mediaResult.format === 'video' ? <Video className="h-4 w-4" /> : <FileCode className="h-4 w-4" />}
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-[#A5F3FC] flex items-center gap-2">
                      {mediaResult.fileName} ({mediaResult.format?.toUpperCase()})
                      {mediaResult.contextNodeRegistered && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#0D9488]/30 text-[#2DD4BF] border border-[#0D9488]/50 font-mono">
                          ✓ Added to Graph
                        </span>
                      )}
                    </h4>
                    <p className="text-[10px] text-[#64748B] font-mono">
                      Estimated {mediaResult.estimatedTokens} Semantic Tokens • Extracted via WebMCP Synthesizer
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  {onNavigateToCanvas && (
                    <button
                      onClick={onNavigateToCanvas}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#0D9488]/20 text-[#2DD4BF] border border-[#0D9488]/40 hover:bg-[#0D9488]/30 text-[11px] font-semibold transition-colors cursor-pointer"
                      title="View dynamic research card on Interactive Canvas"
                    >
                      <Layers className="h-3 w-3 text-[#2DD4BF]" />
                      <span>Canvas Card</span>
                    </button>
                  )}
                  {latestMediaRecord && onOpenReportInbox && (
                    <button
                      onClick={() => onOpenReportInbox(latestMediaRecord.id)}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#00CCCC]/15 text-[#00CCCC] border border-[#00CCCC]/40 hover:bg-[#00CCCC]/25 text-[11px] font-semibold transition-colors cursor-pointer"
                      title="Open this isolated report in Report Inbox"
                    >
                      <Inbox className="h-3 w-3" />
                      <span>View in Inbox</span>
                    </button>
                  )}
                  {onViewContextGraph && (
                    <button
                      onClick={onViewContextGraph}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#1E293B] text-[#A5F3FC] border border-[#334155] hover:bg-[#334155] text-[11px] font-semibold transition-colors cursor-pointer"
                    >
                      <Network className="h-3 w-3 text-[#00CCCC]" />
                      <span>Graph</span>
                    </button>
                  )}
                  <button
                    id="btn-export-isolated-media-report"
                    onClick={handleExportIsolatedMediaReport}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#00CCCC] text-[#0A0C14] hover:bg-[#00CCCC]/90 font-bold text-[11px] transition-all shadow-[0_0_10px_rgba(0,204,204,0.25)] cursor-pointer"
                    title="Export isolated Markdown report for this media file"
                  >
                    <Download className="h-3 w-3" />
                    <span>Export Report</span>
                  </button>
                  <button
                    onClick={() => handleCopyJson(mediaResult)}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#1E293B] text-[#94A3B8] hover:text-[#A5F3FC] border border-[#334155] text-[11px] transition-colors cursor-pointer"
                  >
                    {copiedResult ? <Check className="h-3 w-3 text-[#0D9488]" /> : <Copy className="h-3 w-3" />}
                    <span>{copiedResult ? 'Copied' : 'JSON'}</span>
                  </button>
                </div>
              </div>

              {/* Task Isolation Indicator */}
              <div className="flex items-center justify-between text-[11px] px-3 py-1.5 rounded-lg bg-[#0F172A] border border-[#1E293B] text-[#94A3B8]">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-3.5 w-3.5 text-[#00CCCC]" />
                  <span className="text-[#A5F3FC] font-semibold">Independent Task Isolation:</span>
                  <span>Stored separately in the Report Inbox without merging old files.</span>
                </div>
                {latestMediaRecord && (
                  <span className="text-[10px] font-mono text-[#2DD4BF]">
                    ✓ Stored in Inbox
                  </span>
                )}
              </div>

              {/* Media Summary Text */}
              {mediaResult.summaryText && (
                <div className="p-3 rounded-lg bg-[#0F172A] border border-[#1E293B] text-xs text-[#CBD5E1] leading-relaxed">
                  <span className="font-bold text-[#A5F3FC] block mb-1">Acoustic / Visual Findings:</span>
                  {mediaResult.summaryText}
                </div>
              )}

              {/* Audio Waveform Profile (if applicable) */}
              {mediaResult.parsedDetails?.waveformPeakProfile && (
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-[10px] text-[#64748B] font-mono font-semibold">
                    <span>16-Point Acoustic Amplitude Envelope (0.0 - 1.0):</span>
                    <span>Sample Rate: {mediaResult.parsedDetails.sampleRateHz || 44100} Hz</span>
                  </div>
                  <div className="flex items-end gap-1.5 h-12 p-2 rounded bg-black/40 border border-[#1E293B]">
                    {mediaResult.parsedDetails.waveformPeakProfile.map((val: number, idx: number) => (
                      <div
                        key={idx}
                        className="flex-1 bg-gradient-to-t from-[#0D9488] to-[#00CCCC] rounded-t transition-all hover:brightness-125"
                        style={{ height: `${Math.max(val * 100, 10)}%` }}
                        title={`Band ${idx + 1}: ${val.toFixed(2)}`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
};
