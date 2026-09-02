/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * R-WAVE Universal Intelligence Lab - WebMCP Event Stream Logger
 */

import React, { useState } from 'react';
import {
  Activity,
  Trash2,
  Download,
  Pause,
  Play,
  Copy,
  Check,
  Radio,
  Clock,
  Code2,
} from 'lucide-react';
import { WebMCPEvent } from '../types/webmcp';

interface EventStreamLoggerProps {
  events: WebMCPEvent[];
  onClearEvents: () => void;
}

export const EventStreamLogger: React.FC<EventStreamLoggerProps> = ({ events, onClearEvents }) => {
  const [isPaused, setIsPaused] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<WebMCPEvent | null>(null);
  const [copied, setCopied] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');

  const filteredEvents = events.filter((evt) => {
    if (filterType === 'all') return true;
    return evt.type.includes(filterType);
  });

  const handleExportLogs = () => {
    const blob = new Blob([JSON.stringify(events, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rwave-webmcp-events-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopyPayload = () => {
    if (!selectedEvent) return;
    navigator.clipboard.writeText(JSON.stringify(selectedEvent, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getEventBadgeColor = (type: string) => {
    if (type.includes('toolexecuted')) {
      return 'bg-[#0D9488]/20 text-[#2DD4BF] border-[#0D9488]/40';
    }
    if (type.includes('toolregistered')) {
      return 'bg-[#00CCCC]/10 text-[#00CCCC] border-[#00CCCC]/30';
    }
    if (type.includes('contextupdated')) {
      return 'bg-[#818CF8]/10 text-[#A5B4FC] border-[#818CF8]/30';
    }
    return 'bg-[#1E293B] text-[#94A3B8] border-[#334155]';
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-xl bg-gradient-to-r from-[#0F172A]/80 via-[#0D9488]/10 to-[#0F172A]/80 border border-[#1E293B] p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="h-2 w-2 rounded-full bg-[#00CCCC] animate-cool-pulse" />
            <h2 className="text-lg font-bold text-[#A5F3FC] tracking-tight">
              Real-Time WebMCP Event Bus
            </h2>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#1E293B] text-[#00CCCC] border border-[#334155]">
              window.addEventListener('modelcontext:*')
            </span>
          </div>
          <p className="text-sm text-[#94A3B8] max-w-2xl">
            Live telemetry stream capturing every tool registration, parameter schema validation, and tool execution dispatched across the browser context.
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          <button
            onClick={() => setIsPaused(!isPaused)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-colors cursor-pointer ${
              isPaused
                ? 'bg-[#00CCCC]/20 text-[#00CCCC] border-[#00CCCC]/40'
                : 'bg-[#1E293B] text-[#CBD5E1] border-[#334155] hover:bg-[#334155]'
            }`}
          >
            {isPaused ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
            <span>{isPaused ? 'Resume' : 'Pause'}</span>
          </button>

          <button
            onClick={handleExportLogs}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#00CCCC] hover:bg-[#00CCCC]/90 text-[#0A0C14] font-bold border border-[#00CCCC]/40 transition-colors shadow-[0_0_12px_rgba(0,204,204,0.3)] cursor-pointer"
          >
            <Download className="h-3 w-3 text-[#0A0C14]" />
            <span>Export JSON</span>
          </button>

          <button
            onClick={onClearEvents}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1E293B] hover:bg-[#334155] text-[#94A3B8] hover:text-[#00CCCC] border border-[#334155] transition-colors cursor-pointer"
          >
            <Trash2 className="h-3 w-3" />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 text-xs font-mono">
        <span className="text-[#64748B] uppercase tracking-wider text-[11px] font-bold">Filter:</span>
        {['all', 'toolexecuted', 'toolregistered', 'contextupdated'].map((ft) => (
          <button
            key={ft}
            onClick={() => setFilterType(ft)}
            className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
              filterType === ft
                ? 'bg-[#1E293B] text-[#A5F3FC] border border-[#00CCCC]/40 font-semibold shadow-[0_0_10px_rgba(0,204,204,0.2)]'
                : 'text-[#94A3B8] hover:text-[#E0E7FF] bg-[#0F172A]/40 border border-[#1E293B]/60'
            }`}
          >
            {ft}
          </button>
        ))}
      </div>

      {/* Event Stream Split-View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Event List (7 cols) */}
        <div className="lg:col-span-7 space-y-2 max-h-[580px] overflow-y-auto pr-1">
          {filteredEvents.length === 0 ? (
            <div className="p-8 text-center rounded-xl bg-[#0F172A]/40 border border-[#1E293B] text-[#94A3B8] text-xs font-mono">
              No protocol events recorded in stream yet. Trigger a WebMCP tool execution to generate events.
            </div>
          ) : (
            filteredEvents.map((evt) => {
              const isSelected = selectedEvent?.id === evt.id;
              return (
                <div
                  key={evt.id}
                  onClick={() => setSelectedEvent(evt)}
                  className={`p-3.5 rounded-xl border font-mono text-xs cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-[#0F172A] border-[#00CCCC]/60 shadow-[0_0_15px_rgba(0,204,204,0.15)]'
                      : 'bg-[#0F172A]/60 border-[#1E293B] hover:bg-[#0F172A] hover:border-[#334155]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className={`px-2 py-0.5 rounded border text-[10px] ${getEventBadgeColor(evt.type)}`}>
                      {evt.type}
                    </span>
                    <span className="text-[10px] text-[#64748B] flex items-center gap-1">
                      <Clock className="h-2.5 w-2.5" />
                      {new Date(evt.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                      .{evt.timestamp % 1000}
                    </span>
                  </div>

                  <div className="text-[#CBD5E1] text-[11px] truncate">
                    {evt.details?.name
                      ? `Tool registered: ${evt.details.name}`
                      : evt.details?.tool
                      ? `Executed ${evt.details.tool} in ${evt.details.durationMs}ms`
                      : evt.details?.item
                      ? `Context updated: ${evt.details.item.title}`
                      : JSON.stringify(evt.details)}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Payload Inspector (5 cols) */}
        <div className="lg:col-span-5">
          {selectedEvent ? (
            <div className="rounded-xl bg-[#0F172A]/70 border border-[#1E293B] p-4 space-y-3 sticky top-20 font-mono text-xs shadow-xl">
              <div className="flex items-center justify-between border-b border-[#1E293B] pb-2.5">
                <span className="text-[#A5F3FC] font-bold flex items-center gap-1.5">
                  <Code2 className="h-3.5 w-3.5 text-[#00CCCC]" /> Event Details
                </span>
                <button
                  onClick={handleCopyPayload}
                  className="flex items-center gap-1 text-[11px] text-[#94A3B8] hover:text-[#00CCCC] transition-colors cursor-pointer"
                >
                  {copied ? <Check className="h-3 w-3 text-[#0D9488]" /> : <Copy className="h-3 w-3" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              <div className="space-y-1.5 text-[11px]">
                <div className="flex justify-between text-[#94A3B8]">
                  <span className="text-[#64748B]">Event ID:</span>
                  <span className="text-[#E0E7FF]">{selectedEvent.id}</span>
                </div>
                <div className="flex justify-between text-[#94A3B8]">
                  <span className="text-[#64748B]">Event Type:</span>
                  <span className="text-[#00CCCC] font-semibold">{selectedEvent.type}</span>
                </div>
                <div className="flex justify-between text-[#94A3B8]">
                  <span className="text-[#64748B]">Timestamp:</span>
                  <span className="text-[#E0E7FF]">{new Date(selectedEvent.timestamp).toISOString()}</span>
                </div>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-[#64748B] block mb-1">Payload JSON</span>
                <pre className="p-3 rounded-lg bg-black/40 border border-[#1E293B] text-[11px] text-[#00CCCC] overflow-x-auto max-h-[380px]">
                  {JSON.stringify(selectedEvent.details, null, 2)}
                </pre>
              </div>
            </div>
          ) : (
            <div className="p-8 rounded-xl bg-[#0F172A]/40 border border-[#1E293B] text-center text-[#94A3B8] text-xs font-mono">
              Select an event from the stream to inspect the full event payload.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
