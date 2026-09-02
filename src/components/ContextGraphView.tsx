/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * R-WAVE Universal Intelligence Lab - Shared Context Graph
 */

import React, { useState } from 'react';
import {
  Network,
  Plus,
  Trash2,
  Copy,
  Check,
  Tag,
  Search,
  BookOpen,
  FlaskConical,
  Database,
  Cpu,
  Layers,
  Sparkles,
  ExternalLink,
  Globe,
  Music,
  Video,
  FileText,
  FileCode,
} from 'lucide-react';
import { WebMCPContextItem, ModelContextProtocolAPI } from '../types/webmcp';

interface ContextGraphViewProps {
  mcp: ModelContextProtocolAPI;
  contextItems: WebMCPContextItem[];
}

export const ContextGraphView: React.FC<ContextGraphViewProps> = ({ mcp, contextItems }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [isAddingNode, setIsAddingNode] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // New Node Form State
  const [newNodeTitle, setNewNodeTitle] = useState('');
  const [newNodeType, setNewNodeType] = useState<WebMCPContextItem['type']>('hypothesis');
  const [newNodeContent, setNewNodeContent] = useState('');
  const [newNodeTags, setNewNodeTags] = useState('');
  const [newNodeSource, setNewNodeSource] = useState<'human' | 'agent'>('human');

  // Extract all unique tags
  const allTags = Array.from(
    new Set(contextItems.flatMap((item) => item.tags || []))
  );

  const filteredItems = contextItems.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      JSON.stringify(item.content).toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || item.type === filterType;
    const matchesTag = selectedTag === 'all' || (item.tags && item.tags.includes(selectedTag));
    return matchesSearch && matchesType && matchesTag;
  });

  const handleCreateNode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNodeTitle.trim() || !newNodeContent.trim()) return;

    let parsedContent: any = newNodeContent;
    try {
      if (newNodeContent.trim().startsWith('{') || newNodeContent.trim().startsWith('[')) {
        parsedContent = JSON.parse(newNodeContent);
      }
    } catch {
      // Keep as string
    }

    const tagsArray = newNodeTags
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

    mcp.provideContext({
      key: `ctx_${Date.now()}`,
      type: newNodeType,
      title: newNodeTitle,
      content: parsedContent,
      tags: tagsArray.length > 0 ? tagsArray : ['research'],
      source: newNodeSource,
    });

    // Reset Form
    setNewNodeTitle('');
    setNewNodeContent('');
    setNewNodeTags('');
    setIsAddingNode(false);
  };

  const handleDelete = (id: string) => {
    mcp.removeContext(id);
  };

  const handleCopy = (item: WebMCPContextItem) => {
    navigator.clipboard.writeText(JSON.stringify(item, null, 2));
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getTypeBadgeClass = (type: WebMCPContextItem['type'], item?: WebMCPContextItem) => {
    const tags = item?.tags || [];
    if (tags.includes('url-ingest') || tags.includes('web-context')) {
      return 'bg-[#00CCCC]/10 text-[#00CCCC] border-[#00CCCC]/30';
    }
    if (tags.includes('video') || tags.includes('youtube')) {
      return 'bg-[#0D9488]/20 text-[#2DD4BF] border-[#0D9488]/40';
    }
    if (tags.includes('audio')) {
      return 'bg-[#38BDF8]/20 text-[#38BDF8] border-[#38BDF8]/40';
    }
    if (tags.includes('pdf') || tags.includes('json')) {
      return 'bg-[#818CF8]/20 text-[#A5B4FC] border-[#818CF8]/40';
    }

    switch (type) {
      case 'hypothesis':
        return 'bg-[#00CCCC]/10 text-[#00CCCC] border-[#00CCCC]/30';
      case 'dataset':
        return 'bg-[#0D9488]/20 text-[#2DD4BF] border-[#0D9488]/40';
      case 'diagnostic':
        return 'bg-[#818CF8]/10 text-[#A5B4FC] border-[#818CF8]/30';
      case 'artifact':
        return 'bg-[#38BDF8]/10 text-[#38BDF8] border-[#38BDF8]/30';
      default:
        return 'bg-[#1E293B] text-[#94A3B8] border-[#334155]';
    }
  };

  const getTypeIcon = (type: WebMCPContextItem['type'], item?: WebMCPContextItem) => {
    const tags = item?.tags || [];
    if (tags.includes('url-ingest') || tags.includes('web-context')) {
      return <Globe className="h-3.5 w-3.5 text-[#00CCCC]" />;
    }
    if (tags.includes('video') || tags.includes('youtube')) {
      return <Video className="h-3.5 w-3.5 text-[#2DD4BF]" />;
    }
    if (tags.includes('audio')) {
      return <Music className="h-3.5 w-3.5 text-[#38BDF8]" />;
    }
    if (tags.includes('pdf')) {
      return <FileText className="h-3.5 w-3.5 text-[#A5B4FC]" />;
    }
    if (tags.includes('json')) {
      return <FileCode className="h-3.5 w-3.5 text-[#2DD4BF]" />;
    }

    switch (type) {
      case 'hypothesis':
        return <FlaskConical className="h-3.5 w-3.5 text-[#00CCCC]" />;
      case 'dataset':
        return <Database className="h-3.5 w-3.5 text-[#2DD4BF]" />;
      case 'diagnostic':
        return <Cpu className="h-3.5 w-3.5 text-[#818CF8]" />;
      default:
        return <BookOpen className="h-3.5 w-3.5 text-[#94A3B8]" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Context Graph Overview */}
      <div className="rounded-xl bg-gradient-to-r from-[#0F172A]/80 via-[#0D9488]/10 to-[#0F172A]/80 border border-[#1E293B] p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="h-2 w-2 rounded-full bg-[#00CCCC] animate-cool-pulse" />
            <h2 className="text-lg font-bold text-[#A5F3FC] tracking-tight">
              Shared Context & Knowledge Graph
            </h2>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#1E293B] text-[#00CCCC] border border-[#334155]">
              {contextItems.length} Nodes Synchronized
            </span>
          </div>
          <p className="text-sm text-[#94A3B8] max-w-2xl">
            Live structured memory synchronized in real-time between human researchers and browser AI agents.
            Queried dynamically via the <code className="text-[#00CCCC] font-mono">rwave_quantum_query</code> tool.
          </p>
        </div>

        <button
          id="btn-add-context-node"
          onClick={() => setIsAddingNode(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#00CCCC] hover:bg-[#00CCCC]/90 text-[#0A0C14] font-bold text-xs uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(0,204,204,0.35)] cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Add Context Node</span>
        </button>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#64748B]" />
          <input
            type="text"
            placeholder="Search context titles, content, or JSON payloads..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-[#0F172A]/70 border border-[#1E293B] text-xs font-mono text-[#E0E7FF] placeholder-[#64748B] focus:outline-none focus:border-[#00CCCC]/60"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-medium">
          {['all', 'hypothesis', 'dataset', 'diagnostic', 'artifact', 'config'].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1.5 rounded-md capitalize whitespace-nowrap transition-all ${
                filterType === type
                  ? 'bg-[#1E293B] text-[#A5F3FC] border border-[#00CCCC]/40 shadow-[0_0_10px_rgba(0,204,204,0.2)] font-semibold'
                  : 'text-[#94A3B8] hover:text-[#E0E7FF] bg-[#0F172A]/40 border border-[#1E293B]/60'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Tags Filter */}
      {allTags.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap text-[11px] font-mono text-[#94A3B8]">
          <span className="flex items-center gap-1 text-[#64748B]">
            <Tag className="h-3 w-3" /> Filter by tag:
          </span>
          <button
            onClick={() => setSelectedTag('all')}
            className={`px-2 py-0.5 rounded transition-colors ${
              selectedTag === 'all' ? 'bg-[#00CCCC]/20 text-[#00CCCC] border border-[#00CCCC]/40' : 'hover:text-[#E0E7FF]'
            }`}
          >
            All
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`px-2 py-0.5 rounded transition-colors ${
                selectedTag === tag ? 'bg-[#00CCCC]/20 text-[#00CCCC] border border-[#00CCCC]/40' : 'hover:text-[#E0E7FF]'
              }`}
            >
              #{tag}
            </button>
          ))}
        </div>
      )}

      {/* Context Nodes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            id={`context-node-${item.id}`}
            className="rounded-xl bg-[#0F172A]/60 border border-[#1E293B] hover:border-[#00CCCC]/40 p-4 space-y-3 transition-all flex flex-col justify-between shadow-lg"
          >
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-md bg-[#0A0C14] border border-[#1E293B] flex items-center justify-center text-[#00CCCC]">
                    {getTypeIcon(item.type, item)}
                  </div>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full border capitalize ${getTypeBadgeClass(
                      item.type,
                      item
                    )}`}
                  >
                    {item.type}
                  </span>
                </div>

                <div className="flex items-center gap-1 text-[#94A3B8]">
                  <button
                    onClick={() => handleCopy(item)}
                    className="p-1 hover:text-[#00CCCC] transition-colors cursor-pointer"
                    title="Copy node JSON"
                  >
                    {copiedId === item.id ? (
                      <Check className="h-3.5 w-3.5 text-[#0D9488]" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-1 hover:text-[#38BDF8] text-[#64748B] transition-colors cursor-pointer"
                    title="Delete context node"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <h3 className="font-bold text-[#E0E7FF] text-sm tracking-tight leading-snug">
                {item.title}
              </h3>

              <div className="text-xs text-[#CBD5E1] font-mono bg-black/40 p-2.5 rounded-lg border border-[#1E293B] overflow-x-auto max-h-36">
                {typeof item.content === 'string' ? (
                  <p className="leading-relaxed whitespace-pre-wrap">{item.content}</p>
                ) : (
                  <pre className="text-[11px] text-[#A5F3FC]">{JSON.stringify(item.content, null, 2)}</pre>
                )}
              </div>
            </div>

            <div className="border-t border-[#1E293B] pt-2.5 flex items-center justify-between text-[10px] font-mono text-[#94A3B8]">
              <div className="flex items-center gap-1 flex-wrap">
                {(item.tags || []).slice(0, 3).map((tag) => (
                  <span key={tag} className="px-1.5 py-0.5 rounded bg-[#0A0C14] text-[#94A3B8] border border-[#1E293B]">
                    #{tag}
                  </span>
                ))}
              </div>

              <span className="capitalize text-[#64748B]">source: {item.source}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Add Context Node Modal */}
      {isAddingNode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-[#0F172A] border border-[#1E293B] p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#1E293B] pb-3">
              <h3 className="font-bold text-[#A5F3FC] flex items-center gap-2">
                <Plus className="h-4 w-4 text-[#00CCCC]" /> Add Context Node
              </h3>
              <button
                onClick={() => setIsAddingNode(false)}
                className="text-[#94A3B8] hover:text-[#E0E7FF] text-xs font-mono cursor-pointer"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleCreateNode} className="space-y-3 font-mono text-xs">
              <div>
                <label className="block text-[#CBD5E1] mb-1 font-semibold">Title</label>
                <input
                  type="text"
                  placeholder="e.g. Hypothesis: WebMCP Latency Reduction"
                  value={newNodeTitle}
                  onChange={(e) => setNewNodeTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#0A0C14] border border-[#1E293B] text-[#E0E7FF] focus:outline-none focus:border-[#00CCCC]/60"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#CBD5E1] mb-1 font-semibold">Type</label>
                  <select
                    value={newNodeType}
                    onChange={(e) => setNewNodeType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg bg-[#0A0C14] border border-[#1E293B] text-[#E0E7FF] focus:outline-none focus:border-[#00CCCC]/60"
                  >
                    <option value="hypothesis">Hypothesis</option>
                    <option value="dataset">Dataset</option>
                    <option value="diagnostic">Diagnostic</option>
                    <option value="artifact">Artifact</option>
                    <option value="config">Config / Spec</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#CBD5E1] mb-1 font-semibold">Source</label>
                  <select
                    value={newNodeSource}
                    onChange={(e) => setNewNodeSource(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg bg-[#0A0C14] border border-[#1E293B] text-[#E0E7FF] focus:outline-none focus:border-[#00CCCC]/60"
                  >
                    <option value="human">Human Researcher</option>
                    <option value="agent">Autonomous Agent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[#CBD5E1] mb-1 font-semibold">Content (Text or JSON string)</label>
                <textarea
                  rows={4}
                  placeholder="Enter context narrative, experimental findings, or raw JSON object..."
                  value={newNodeContent}
                  onChange={(e) => setNewNodeContent(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#0A0C14] border border-[#1E293B] text-[#E0E7FF] focus:outline-none focus:border-[#00CCCC]/60"
                  required
                />
              </div>

              <div>
                <label className="block text-[#CBD5E1] mb-1 font-semibold">Tags (Comma-separated)</label>
                <input
                  type="text"
                  placeholder="benchmark, latency, webmcp"
                  value={newNodeTags}
                  onChange={(e) => setNewNodeTags(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#0A0C14] border border-[#1E293B] text-[#E0E7FF] focus:outline-none focus:border-[#00CCCC]/60"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddingNode(false)}
                  className="px-3.5 py-2 rounded-lg bg-[#1E293B] hover:bg-[#334155] text-[#CBD5E1] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#00CCCC] hover:bg-[#00CCCC]/90 text-[#0A0C14] font-bold shadow-[0_0_12px_rgba(0,204,204,0.3)] cursor-pointer uppercase tracking-wider"
                >
                  Save Context Node
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
