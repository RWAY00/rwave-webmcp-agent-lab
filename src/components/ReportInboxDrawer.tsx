/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * R-WAVE Universal Intelligence Lab - Report Inbox & Intelligence Vault
 */

import React, { useState, useEffect } from 'react';
import {
  Inbox,
  FileText,
  Globe,
  Video,
  Music,
  FileCode,
  Download,
  Copy,
  Check,
  Trash2,
  X,
  Search,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  RefreshCw,
  Eye,
  Layers,
  ArrowDownToLine,
  Filter,
  Maximize2,
  FileSpreadsheet,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ReportVault, AnalysisRecord } from '../services/report-vault';

interface ReportInboxDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedReportId?: string | null;
}

export const ReportInboxDrawer: React.FC<ReportInboxDrawerProps> = ({
  isOpen,
  onClose,
  selectedReportId,
}) => {
  const [records, setRecords] = useState<AnalysisRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'url' | 'multimedia' | 'comprehensive'>('all');
  const [activeRecord, setActiveRecord] = useState<AnalysisRecord | null>(null);
  const [viewMode, setViewMode] = useState<'rendered' | 'source'>('rendered');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedViewer, setCopiedViewer] = useState(false);

  useEffect(() => {
    const unsub = ReportVault.subscribe((updated) => {
      setRecords(updated);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (selectedReportId) {
      const rec = ReportVault.getRecordById(selectedReportId);
      if (rec) {
        setActiveRecord(rec);
      }
    }
  }, [selectedReportId, isOpen]);

  if (!isOpen) return null;

  const filteredRecords = records.filter((rec) => {
    const matchesSearch =
      rec.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.target.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (rec.tags || []).some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (filterType === 'url') return rec.type === 'url';
    if (filterType === 'multimedia') return ['audio', 'video', 'pdf', 'json'].includes(rec.type);
    if (filterType === 'comprehensive') return rec.type === 'comprehensive' || rec.type === 'tool_execution';

    return true;
  });

  const handleCopyMarkdown = (record: AnalysisRecord, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(record.markdownContent);
    setCopiedId(record.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyActiveViewer = () => {
    if (!activeRecord) return;
    navigator.clipboard.writeText(activeRecord.markdownContent);
    setCopiedViewer(true);
    setTimeout(() => setCopiedViewer(false), 2000);
  };

  const handleDeleteRecord = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    ReportVault.deleteRecord(id);
    if (activeRecord?.id === id) {
      setActiveRecord(null);
    }
  };

  const handleExportSingle = (record: AnalysisRecord, format: 'markdown' | 'json' | 'text', e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    ReportVault.exportSingleRecord(record, format);
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear all stored test reports from your inbox?')) {
      ReportVault.clearAll();
      setActiveRecord(null);
    }
  };

  const getRecordIcon = (type: string) => {
    switch (type) {
      case 'url':
        return <Globe className="h-4 w-4 text-[#00CCCC]" />;
      case 'video':
        return <Video className="h-4 w-4 text-[#2DD4BF]" />;
      case 'audio':
        return <Music className="h-4 w-4 text-[#38BDF8]" />;
      case 'pdf':
        return <FileText className="h-4 w-4 text-[#818CF8]" />;
      case 'json':
        return <FileCode className="h-4 w-4 text-[#A5F3FC]" />;
      default:
        return <FileSpreadsheet className="h-4 w-4 text-[#0D9488]" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-end bg-black/75 backdrop-blur-sm animate-fade-in">
      {/* Backdrop click to close */}
      <div className="flex-1 hidden md:block" onClick={onClose} />

      {/* Main Drawer Container */}
      <div className="w-full max-w-5xl bg-[#0A0C14] border-l border-[#1E293B] shadow-2xl flex flex-col h-full overflow-hidden">
        {/* Drawer Header */}
        <div className="px-5 py-4 border-b border-[#1E293B] bg-[#0F172A]/90 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[#00CCCC]/20 to-[#0D9488]/30 border border-[#00CCCC]/40 flex items-center justify-center text-[#00CCCC] shadow-[0_0_12px_rgba(0,204,204,0.25)]">
              <Inbox className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[#A5F3FC] tracking-tight">
                  Report Inbox &amp; Intelligence Vault
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-[#00CCCC]/15 text-[#00CCCC] border border-[#00CCCC]/30 text-[10px] font-mono font-bold">
                  {records.length} {records.length === 1 ? 'Record' : 'Records'}
                </span>
              </div>
              <p className="text-xs text-[#94A3B8]">
                Isolated analysis reports for tested URLs, multimedia streams, and runtime audits
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {records.length > 0 && (
              <>
                <button
                  id="vault-export-all-btn"
                  onClick={() => ReportVault.exportAllAsBundle(records)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1E293B] hover:bg-[#334155] text-[#A5F3FC] text-xs font-semibold border border-[#334155] transition-colors cursor-pointer"
                  title="Export all vault reports as JSON bundle"
                >
                  <ArrowDownToLine className="h-3.5 w-3.5 text-[#00CCCC]" />
                  <span className="hidden sm:inline">Export Vault</span>
                </button>
                <button
                  id="vault-clear-all-btn"
                  onClick={handleClearAll}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-950/30 hover:bg-red-900/40 text-red-400 text-xs border border-red-800/40 transition-colors cursor-pointer"
                  title="Clear all saved reports"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Clear</span>
                </button>
              </>
            )}

            <button
              id="vault-close-btn"
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#94A3B8] hover:text-[#E0E7FF] hover:bg-[#1E293B] transition-colors cursor-pointer ml-1"
              title="Close Inbox"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Drawer Body: Two-Column Split (List on Left / Preview on Right) */}
        <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
          {/* LEFT: Search, Filters, and Records List */}
          <div className={`w-full md:w-80 lg:w-96 flex flex-col border-r border-[#1E293B] bg-[#0A0C14] ${activeRecord ? 'hidden md:flex' : 'flex'}`}>
            {/* Search and Filters Bar */}
            <div className="p-3 border-b border-[#1E293B] space-y-2.5 bg-[#0F172A]/40">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#64748B]" />
                <input
                  id="vault-search-input"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by URL, title, or tag..."
                  className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-[#0A0C14] border border-[#1E293B] text-xs text-[#E0E7FF] placeholder-[#64748B] focus:outline-none focus:border-[#00CCCC]"
                />
              </div>

              {/* Filter Pills */}
              <div className="flex items-center gap-1 overflow-x-auto text-[11px]">
                <button
                  onClick={() => setFilterType('all')}
                  className={`px-2.5 py-1 rounded-md transition-colors whitespace-nowrap font-medium cursor-pointer ${
                    filterType === 'all'
                      ? 'bg-[#00CCCC]/20 text-[#A5F3FC] border border-[#00CCCC]/40'
                      : 'text-[#94A3B8] hover:text-[#E0E7FF] hover:bg-[#1E293B]'
                  }`}
                >
                  All ({records.length})
                </button>
                <button
                  onClick={() => setFilterType('url')}
                  className={`px-2.5 py-1 rounded-md transition-colors whitespace-nowrap font-medium cursor-pointer ${
                    filterType === 'url'
                      ? 'bg-[#00CCCC]/20 text-[#A5F3FC] border border-[#00CCCC]/40'
                      : 'text-[#94A3B8] hover:text-[#E0E7FF] hover:bg-[#1E293B]'
                  }`}
                >
                  Web URLs
                </button>
                <button
                  onClick={() => setFilterType('multimedia')}
                  className={`px-2.5 py-1 rounded-md transition-colors whitespace-nowrap font-medium cursor-pointer ${
                    filterType === 'multimedia'
                      ? 'bg-[#00CCCC]/20 text-[#A5F3FC] border border-[#00CCCC]/40'
                      : 'text-[#94A3B8] hover:text-[#E0E7FF] hover:bg-[#1E293B]'
                  }`}
                >
                  Multimedia
                </button>
                <button
                  onClick={() => setFilterType('comprehensive')}
                  className={`px-2.5 py-1 rounded-md transition-colors whitespace-nowrap font-medium cursor-pointer ${
                    filterType === 'comprehensive'
                      ? 'bg-[#00CCCC]/20 text-[#A5F3FC] border border-[#00CCCC]/40'
                      : 'text-[#94A3B8] hover:text-[#E0E7FF] hover:bg-[#1E293B]'
                  }`}
                >
                  Audits
                </button>
              </div>
            </div>

            {/* List of Report Cards */}
            <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
              {filteredRecords.length === 0 ? (
                <div className="text-center py-12 px-4 space-y-3">
                  <div className="w-10 h-10 rounded-full bg-[#1E293B] flex items-center justify-center mx-auto text-[#64748B]">
                    <Inbox className="h-5 w-5" />
                  </div>
                  <p className="text-xs text-[#94A3B8]">
                    {searchQuery ? 'No reports matched your query.' : 'No reports in inbox yet.'}
                  </p>
                  <p className="text-[11px] text-[#64748B]">
                    Test any URL or media file to generate an isolated report.
                  </p>
                </div>
              ) : (
                filteredRecords.map((record) => {
                  const isSelected = activeRecord?.id === record.id;
                  return (
                    <div
                      key={record.id}
                      onClick={() => setActiveRecord(record)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer space-y-2 group ${
                        isSelected
                          ? 'bg-[#0F172A] border-[#00CCCC] shadow-[0_0_15px_rgba(0,204,204,0.15)]'
                          : 'bg-[#0F172A]/50 border-[#1E293B] hover:border-[#00CCCC]/40 hover:bg-[#0F172A]/80'
                      }`}
                    >
                      {/* Top Bar: Icon + Title + Type */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2.5">
                          <div className="p-1.5 rounded-lg bg-[#0A0C14] border border-[#1E293B] group-hover:border-[#00CCCC]/30">
                            {getRecordIcon(record.type)}
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-[#E0E7FF] group-hover:text-[#A5F3FC] transition-colors line-clamp-1">
                              {record.title}
                            </h4>
                            <p className="text-[10px] text-[#64748B] font-mono line-clamp-1 mt-0.5">
                              {record.target}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Metrics & Date */}
                      <div className="flex items-center justify-between text-[10px] text-[#94A3B8] pt-1 border-t border-[#1E293B]/60">
                        <span className="font-mono text-[#64748B]">{record.dateFormatted}</span>
                        <div className="flex items-center gap-2">
                          {record.wordCount !== undefined && (
                            <span className="text-[#2DD4BF] font-mono font-semibold">
                              {record.wordCount} words
                            </span>
                          )}
                          {record.latencyMs !== undefined && (
                            <span className="text-[#64748B] font-mono">
                              {record.latencyMs}ms
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Quick Item Actions */}
                      <div className="flex items-center justify-between pt-1 text-xs">
                        <div className="flex items-center gap-1">
                          <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-[#00CCCC]/10 text-[#00CCCC] border border-[#00CCCC]/20 font-bold font-mono">
                            {record.type}
                          </span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#0D9488]/10 text-[#2DD4BF] border border-[#0D9488]/20 font-mono">
                            Isolated
                          </span>
                        </div>

                        <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => handleCopyMarkdown(record, e)}
                            className="p-1 rounded hover:bg-[#1E293B] text-[#94A3B8] hover:text-[#A5F3FC] transition-colors"
                            title="Copy Markdown"
                          >
                            {copiedId === record.id ? <Check className="h-3 w-3 text-[#0D9488]" /> : <Copy className="h-3 w-3" />}
                          </button>
                          <button
                            onClick={(e) => handleExportSingle(record, 'markdown', e)}
                            className="p-1 rounded hover:bg-[#1E293B] text-[#94A3B8] hover:text-[#00CCCC] transition-colors"
                            title="Download Markdown"
                          >
                            <Download className="h-3 w-3" />
                          </button>
                          <button
                            onClick={(e) => handleDeleteRecord(record.id, e)}
                            className="p-1 rounded hover:bg-red-950/50 text-[#64748B] hover:text-red-400 transition-colors"
                            title="Delete Report"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* RIGHT: Selected Report Viewer Panel */}
          <div className={`flex-1 flex flex-col bg-[#0A0C14] ${!activeRecord ? 'hidden md:flex' : 'flex'}`}>
            {activeRecord ? (
              <>
                {/* Active Report Header Bar */}
                <div className="px-5 py-3.5 border-b border-[#1E293B] bg-[#0F172A]/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <button
                      onClick={() => setActiveRecord(null)}
                      className="md:hidden p-1 rounded-lg text-[#94A3B8] hover:text-[#E0E7FF] hover:bg-[#1E293B]"
                    >
                      ← Back
                    </button>
                    <div className="p-1.5 rounded-lg bg-[#0A0C14] border border-[#1E293B]">
                      {getRecordIcon(activeRecord.type)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-xs sm:text-sm font-bold text-[#A5F3FC] line-clamp-1">
                          {activeRecord.title}
                        </h3>
                        <span className="px-2 py-0.5 rounded bg-[#00CCCC]/15 text-[#00CCCC] border border-[#00CCCC]/30 text-[10px] font-mono font-bold uppercase">
                          Isolated Task
                        </span>
                      </div>
                      <p className="text-[11px] text-[#64748B] font-mono">
                        {activeRecord.target} • {activeRecord.dateFormatted}
                      </p>
                    </div>
                  </div>

                  {/* View Modes & Export Actions */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center p-0.5 rounded-lg bg-[#0A0C14] border border-[#1E293B] text-xs">
                      <button
                        onClick={() => setViewMode('rendered')}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                          viewMode === 'rendered'
                            ? 'bg-[#1E293B] text-[#00CCCC] border border-[#00CCCC]/30'
                            : 'text-[#94A3B8] hover:text-[#E0E7FF]'
                        }`}
                      >
                        <Eye className="h-3 w-3" />
                        <span>Formatted</span>
                      </button>
                      <button
                        onClick={() => setViewMode('source')}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                          viewMode === 'source'
                            ? 'bg-[#1E293B] text-[#00CCCC] border border-[#00CCCC]/30'
                            : 'text-[#94A3B8] hover:text-[#E0E7FF]'
                        }`}
                      >
                        <FileCode className="h-3 w-3" />
                        <span>Markdown</span>
                      </button>
                    </div>

                    <button
                      onClick={handleCopyActiveViewer}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#1E293B] hover:bg-[#334155] text-[#A5F3FC] text-xs font-semibold border border-[#334155] transition-colors cursor-pointer"
                      title="Copy Markdown to Clipboard"
                    >
                      {copiedViewer ? <Check className="h-3.5 w-3.5 text-[#0D9488]" /> : <Copy className="h-3.5 w-3.5" />}
                      <span className="hidden sm:inline">{copiedViewer ? 'Copied' : 'Copy'}</span>
                    </button>

                    <button
                      onClick={() => handleExportSingle(activeRecord, 'markdown')}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#00CCCC] to-[#0D9488] hover:opacity-95 text-[#0A0C14] text-xs font-bold transition-all shadow-[0_0_12px_rgba(0,204,204,0.25)] cursor-pointer"
                      title="Download Markdown Report"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Export (.md)</span>
                    </button>
                  </div>
                </div>

                {/* Document Body Area */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {viewMode === 'rendered' ? (
                    <div className="max-w-3xl mx-auto space-y-6 text-[#E0E7FF]">
                      {/* Security & Task Isolation Banner */}
                      <div className="p-3.5 rounded-xl bg-[#0F172A] border border-[#00CCCC]/30 flex items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2.5">
                          <ShieldCheck className="h-4 w-4 text-[#00CCCC]" />
                          <div>
                            <span className="font-bold text-[#A5F3FC]">Single-Task Isolated Analysis</span>
                            <span className="text-[#94A3B8] ml-2 font-normal hidden sm:inline">
                              • Zero data blending from other test sessions.
                            </span>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono text-[#2DD4BF] bg-[#0D9488]/20 px-2 py-0.5 rounded border border-[#0D9488]/40">
                          TASK_{activeRecord.timestamp}
                        </span>
                      </div>

                      {/* Rendered Markdown Output with Executive Theme */}
                      <div className="prose prose-invert max-w-none prose-headings:text-[#A5F3FC] prose-headings:font-bold prose-h1:text-xl prose-h2:text-lg prose-h2:border-b prose-h2:border-[#1E293B] prose-h2:pb-2 prose-h3:text-sm prose-p:text-xs prose-p:leading-relaxed prose-p:text-[#CBD5E1] prose-a:text-[#00CCCC] prose-a:no-underline hover:prose-a:underline prose-table:text-xs prose-table:border-collapse prose-th:bg-[#0F172A] prose-th:text-[#A5F3FC] prose-th:p-2.5 prose-th:border prose-th:border-[#1E293B] prose-td:p-2.5 prose-td:border prose-td:border-[#1E293B] prose-code:text-[#00CCCC] prose-code:bg-[#0F172A] prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-blockquote:border-l-[#00CCCC] prose-blockquote:bg-[#0F172A]/50 prose-blockquote:py-1 prose-blockquote:px-3 prose-blockquote:text-xs prose-blockquote:text-[#94A3B8]">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{activeRecord.markdownContent}</ReactMarkdown>
                      </div>
                    </div>
                  ) : (
                    /* Monospace Markdown Source View */
                    <div className="max-w-3xl mx-auto">
                      <div className="p-4 rounded-xl bg-black/60 border border-[#1E293B] font-mono text-xs text-[#CBD5E1] whitespace-pre-wrap leading-relaxed select-text">
                        {activeRecord.markdownContent}
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-[#0F172A] border border-[#1E293B] flex items-center justify-center text-[#64748B]">
                  <FileText className="h-7 w-7" />
                </div>
                <h3 className="text-sm font-bold text-[#A5F3FC]">No Report Selected</h3>
                <p className="text-xs text-[#94A3B8] max-w-sm">
                  Select an isolated analysis record from the left inbox or perform a new URL / media ingestion test.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
