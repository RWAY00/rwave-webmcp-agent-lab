/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * R-WAVE Universal Intelligence Lab - Human-Agent Collaborative Console
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Sparkles,
  Cpu,
  Bot,
  User,
  CheckCircle2,
  Clock,
  ChevronDown,
  ChevronUp,
  Terminal,
  Play,
  RotateCcw,
  Zap,
  Layers,
  Search,
  Activity,
  Code2,
} from 'lucide-react';
import { AgentChatMessage, ModelContextProtocolAPI, WebMCPToolResult } from '../types/webmcp';

interface AgentCollaboratorProps {
  mcp: ModelContextProtocolAPI;
}

export const AgentCollaborator: React.FC<AgentCollaboratorProps> = ({ mcp }) => {
  const [messages, setMessages] = useState<AgentChatMessage[]>([
    {
      id: 'welcome_1',
      sender: 'agent',
      text: 'R-WAVE Universal Intelligence Agent initialized. I am running natively in your browser environment connected to document.modelContext. I can inspect system hardware, synthesize live DOM semantics, run computational benchmarks, and update the shared context graph.',
      timestamp: Date.now(),
      suggestedTools: ['rwave_neural_inspector', 'rwave_web_synthesizer', 'rwave_quantum_query'],
    },
  ]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [expandedToolDetails, setExpandedToolDetails] = useState<Record<string, boolean>>({});
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const toggleToolDetails = (toolExecId: string) => {
    setExpandedToolDetails((prev) => ({
      ...prev,
      [toolExecId]: !prev[toolExecId],
    }));
  };

  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || inputPrompt;
    if (!textToSend.trim() || isLoading) return;

    const userMessage: AgentChatMessage = {
      id: `usr_${Date.now()}`,
      sender: 'human',
      text: textToSend,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!customText) setInputPrompt('');
    setIsLoading(true);

    try {
      // 1. Contact Backend Agent Server (/api/agent/chat)
      const tools = mcp.getTools();
      const contextItems = mcp.getContext();

      const response = await fetch('/api/agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          tools: tools.map((t) => ({
            name: t.name,
            description: t.description,
            parameters: t.parameters,
            category: t.category,
          })),
          contextItems,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      const data = await response.json();
      const invokedToolResults: WebMCPToolResult[] = [];

      // 2. Client-side WebMCP Tool Execution Loop!
      if (Array.isArray(data.invokedTools) && data.invokedTools.length > 0) {
        for (const toolReq of data.invokedTools) {
          try {
            const toolResult = await mcp.executeTool(toolReq.name, toolReq.args || {});
            invokedToolResults.push(toolResult);
          } catch (err: any) {
            invokedToolResults.push({
              tool: toolReq.name,
              success: false,
              timestamp: Date.now(),
              durationMs: 0,
              error: err?.message || String(err),
              args: toolReq.args || {},
            });
          }
        }
      }

      const agentMessage: AgentChatMessage = {
        id: `agent_${Date.now()}`,
        sender: 'agent',
        text: data.text || 'Action executed successfully.',
        timestamp: Date.now(),
        thoughts: data.thoughts || [],
        toolInvocations: invokedToolResults,
      };

      setMessages((prev) => [...prev, agentMessage]);
    } catch (err: any) {
      // Fallback direct client-side execution if server is unreachable
      const fallbackToolResult = await mcp.executeTool('rwave_neural_inspector', {
        detailedMemory: true,
        probeWebGL: true,
      });

      setMessages((prev) => [
        ...prev,
        {
          id: `agent_${Date.now()}`,
          sender: 'agent',
          text: `Executed client-side browser inspection directly via WebMCP runtime. Result captured in telemetry stream.`,
          timestamp: Date.now(),
          toolInvocations: [fallbackToolResult],
          thoughts: ['Executed client-side fallback via document.modelContext'],
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: `welcome_${Date.now()}`,
        sender: 'agent',
        text: 'Session reset. R-WAVE Agent ready for WebMCP commands and interactive research synthesis.',
        timestamp: Date.now(),
      },
    ]);
  };

  const promptStarters = [
    { label: 'Render Dynamic Canvas Mindmap', prompt: 'Use rwave_canvas_manager to create a new mindmap node on the Interactive Canvas detailing WebMCP Zero-IPC DOM Architecture with human-in-the-loop approval.' },
    { label: 'Execute Autonomous Pipeline', prompt: 'Execute the autonomous multi-step pipeline on the interactive canvas via rwave_autonomous_executor and update canvas verification stages in real-time.' },
    { label: 'Trigger Mock Settlement / Action', prompt: 'Trigger a simulated compute grant settlement of 500 RWAVE-GOV via rwave_autonomous_executor and record deterministic txHash receipt.' },
    { label: 'Ingest External Web URL', prompt: 'Fetch the external webpage "https://en.wikipedia.org/wiki/Model_Context_Protocol" using rwave_url_fetcher and extract structured DOM context into the graph.' },
    { label: 'Synthesize Audio/Video Media', prompt: 'Parse and extract semantic metadata from "neural_frequency_spectrum.wav" audio stream using rwave_multimedia_synthesizer.' },
    { label: 'Evaluate Research Hypothesis', prompt: 'Evaluate hypothesis: "Client-side WebMCP micro-benchmarks reduce agent execution latency by 4x" using rwave_hypothesis_tester.' },
    { label: 'Run Sandbox Memory Benchmark', prompt: 'Execute rwave_sandbox_benchmark to measure memory consumption, 8MB buffer throughput, and microtask speed.' },
    { label: 'Run Full Neural Diagnostics', prompt: 'Run complete browser neural diagnostics to inspect memory, GPU, and sandbox profile.' },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[720px]">
      {/* Main Chat Conversation (8 cols) */}
      <div className="lg:col-span-8 flex flex-col rounded-xl bg-[#0F172A]/70 border border-[#1E293B] h-full overflow-hidden shadow-xl">
        {/* Chat Header */}
        <div className="px-5 py-3.5 border-b border-[#1E293B] flex items-center justify-between bg-[#0A0C14]/60">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#00CCCC] to-[#0D9488] shadow-[0_0_12px_rgba(0,204,204,0.3)] flex items-center justify-center text-[#0A0C14]">
              <Bot className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-[#A5F3FC]">R-WAVE Autonomous Agent</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#1E293B] text-[#00CCCC] border border-[#334155] flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#00CCCC] animate-cool-pulse" />
                  WebMCP Live
                </span>
              </div>
              <p className="text-[11px] text-[#94A3B8] font-mono">
                Model: Gemini 3.7 Flash / Browser Runtime Bridge
              </p>
            </div>
          </div>

          <button
            onClick={handleResetChat}
            className="flex items-center gap-1 text-xs text-[#94A3B8] hover:text-[#00CCCC] px-2.5 py-1.5 rounded-md hover:bg-[#1E293B] transition-colors font-mono cursor-pointer"
            title="Reset conversation"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Clear</span>
          </button>
        </div>

        {/* Messages Stream */}
        <div className="flex-1 p-5 overflow-y-auto space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.sender === 'human' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.sender !== 'human' && (
                <div className="h-7 w-7 rounded-md bg-[#0A0C14] border border-[#1E293B] flex-shrink-0 flex items-center justify-center text-[#00CCCC] mt-0.5">
                  <Bot className="h-3.5 w-3.5" />
                </div>
              )}

              <div
                className={`max-w-2xl space-y-2.5 ${
                  msg.sender === 'human'
                    ? 'bg-[#0D9488]/20 text-[#E0E7FF] border border-[#00CCCC]/40 rounded-2xl rounded-tr-sm p-4'
                    : 'bg-[#0A0C14]/90 text-[#E0E7FF] border border-[#1E293B] rounded-2xl rounded-tl-sm p-4'
                }`}
              >
                {/* Agent Thoughts if present */}
                {msg.thoughts && msg.thoughts.length > 0 && (
                  <div className="p-2.5 rounded-lg bg-[#0F172A]/90 border border-[#1E293B] text-[11px] font-mono text-[#00CCCC] space-y-1">
                    <div className="flex items-center gap-1 text-[#64748B] text-[10px] font-semibold tracking-wider uppercase">
                      <Sparkles className="h-3 w-3 text-[#00CCCC]" />
                      <span>Agent Thought Process</span>
                    </div>
                    {msg.thoughts.map((thought, idx) => (
                      <div key={idx} className="flex items-start gap-1.5 text-[#CBD5E1]">
                        <span className="text-[#00CCCC]">•</span>
                        <span>{thought}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Message Body */}
                <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>

                {/* WebMCP Tool Invocations Cards */}
                {msg.toolInvocations && msg.toolInvocations.length > 0 && (
                  <div className="space-y-2 pt-1 border-t border-[#1E293B]">
                    <div className="flex items-center justify-between text-[11px] font-mono text-[#94A3B8]">
                      <span className="flex items-center gap-1.5 text-[#00CCCC] font-semibold">
                        <Terminal className="h-3 w-3 text-[#00CCCC]" />
                        WebMCP Executions ({msg.toolInvocations.length})
                      </span>
                      <span className="text-[#64748B]">Native Browser Sandbox</span>
                    </div>

                    {msg.toolInvocations.map((toolResult, idx) => {
                      const toolExecId = `${msg.id}_tool_${idx}`;
                      const isExpanded = !!expandedToolDetails[toolExecId];

                      return (
                        <div
                          key={idx}
                          className="rounded-lg bg-[#0F172A] border border-[#1E293B] overflow-hidden text-xs font-mono"
                        >
                          <div
                            onClick={() => toggleToolDetails(toolExecId)}
                            className="p-2.5 flex items-center justify-between bg-[#0F172A] hover:bg-[#1E293B]/40 cursor-pointer transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <span className="h-2 w-2 rounded-full bg-[#00CCCC]" />
                              <span className="font-semibold text-[#A5F3FC]">{toolResult.tool}</span>
                              <span className="text-[10px] text-[#64748B]">({toolResult.durationMs}ms)</span>
                            </div>

                            <div className="flex items-center gap-1.5 text-[#94A3B8] text-[11px]">
                              {toolResult.success ? (
                                <span className="text-[#00CCCC] flex items-center gap-1 font-semibold">
                                  <CheckCircle2 className="h-3 w-3" /> Success
                                </span>
                              ) : (
                                <span className="text-[#F43F5E] font-semibold">Error</span>
                              )}
                              {isExpanded ? (
                                <ChevronUp className="h-3.5 w-3.5 text-[#94A3B8]" />
                              ) : (
                                <ChevronDown className="h-3.5 w-3.5 text-[#94A3B8]" />
                              )}
                            </div>
                          </div>

                          {isExpanded && (
                            <div className="p-3 bg-black/40 border-t border-[#1E293B] space-y-2">
                              {toolResult.args && Object.keys(toolResult.args).length > 0 && (
                                <div>
                                  <span className="text-[10px] text-[#64748B] uppercase font-bold block mb-1">
                                    Input Arguments
                                  </span>
                                  <pre className="p-2 rounded bg-black/50 border border-[#1E293B] text-[11px] text-[#CBD5E1] overflow-x-auto">
                                    {JSON.stringify(toolResult.args, null, 2)}
                                  </pre>
                                </div>
                              )}
                              <div>
                                <span className="text-[10px] text-[#64748B] uppercase font-bold block mb-1">
                                  Output Payload
                                </span>
                                <pre className="p-2 rounded bg-black/50 border border-[#1E293B] text-[11px] text-[#00CCCC] overflow-x-auto max-h-48">
                                  {JSON.stringify(
                                    toolResult.success ? toolResult.data : toolResult.error,
                                    null,
                                    2
                                  )}
                                </pre>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="text-[10px] font-mono text-[#64748B] flex items-center justify-end gap-1">
                  <Clock className="h-2.5 w-2.5" />
                  {new Date(msg.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}
                </div>
              </div>

              {msg.sender === 'human' && (
                <div className="h-7 w-7 rounded-md bg-[#0D9488]/30 border border-[#00CCCC]/40 flex-shrink-0 flex items-center justify-center text-[#00CCCC] mt-0.5">
                  <User className="h-3.5 w-3.5" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="h-7 w-7 rounded-md bg-[#0A0C14] border border-[#1E293B] flex items-center justify-center text-[#00CCCC]">
                <Bot className="h-3.5 w-3.5" />
              </div>
              <div className="p-3.5 rounded-2xl bg-[#0A0C14] border border-[#1E293B] flex items-center gap-2 text-xs font-mono text-[#00CCCC]">
                <span className="h-3 w-3 rounded-full border-2 border-[#00CCCC] border-t-transparent animate-spin" />
                <span>Coordinating WebMCP Tool Invocations...</span>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input Box */}
        <div className="p-3.5 border-t border-[#1E293B] bg-[#0A0C14]/90">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              id="agent-chat-input"
              type="text"
              placeholder="Ask the agent to inspect telemetry, synthesize DOM, or run benchmarks..."
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 rounded-lg bg-[#0F172A] border border-[#1E293B] text-[#E0E7FF] placeholder-[#64748B] focus:outline-none focus:border-[#00CCCC]/60 focus:ring-1 focus:ring-[#00CCCC]/40 text-xs sm:text-sm font-mono"
            />
            <button
              id="btn-send-agent-message"
              type="submit"
              disabled={isLoading || !inputPrompt.trim()}
              className="px-4 py-2.5 rounded-lg bg-[#00CCCC] hover:bg-[#00CCCC]/90 text-[#0A0C14] font-bold text-xs uppercase tracking-wider transition-all shadow-[0_0_12px_rgba(0,204,204,0.3)] disabled:opacity-40 cursor-pointer flex items-center gap-1.5"
            >
              <Send className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Send</span>
            </button>
          </form>
        </div>
      </div>

      {/* Right Sidebar: Quick Actions & Agent Capabilities (4 cols) */}
      <div className="lg:col-span-4 space-y-4">
        {/* Quick Prompt Starters */}
        <div className="rounded-xl bg-[#0F172A]/70 border border-[#1E293B] p-4 space-y-3 shadow-lg">
          <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.2em] font-bold text-[#64748B]">
            <Zap className="h-3.5 w-3.5 text-[#00CCCC]" />
            <span>COLLABORATIVE PROMPTS</span>
          </div>

          <div className="space-y-2">
            {promptStarters.map((starter, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(starter.prompt)}
                disabled={isLoading}
                className="w-full text-left p-2.5 rounded-lg bg-[#0A0C14] hover:bg-[#1E293B]/40 border border-[#1E293B] hover:border-[#00CCCC]/40 text-xs text-[#CBD5E1] transition-all font-mono group cursor-pointer"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[#00CCCC] font-semibold group-hover:text-[#A5F3FC]">
                    {starter.label}
                  </span>
                  <Play className="h-2.5 w-2.5 text-[#64748B] group-hover:text-[#00CCCC] fill-current" />
                </div>
                <p className="text-[11px] text-[#94A3B8] line-clamp-1">{starter.prompt}</p>
              </button>
            ))}
          </div>
        </div>

        {/* WebMCP Protocol Execution Architecture Card */}
        <div className="rounded-xl bg-[#0F172A]/70 border border-[#1E293B] p-4 space-y-3 font-mono text-xs shadow-lg">
          <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.2em] font-bold text-[#64748B]">
            <Code2 className="h-3.5 w-3.5 text-[#0D9488]" />
            <span>WEBMCP INTEROP ARCHITECTURE</span>
          </div>

          <div className="space-y-2 text-[11px] text-[#94A3B8] leading-relaxed">
            <div className="p-2.5 rounded bg-[#0A0C14] border border-[#1E293B] flex items-center justify-between">
              <span className="text-[#64748B]">Bridge Endpoint:</span>
              <span className="text-[#00CCCC] font-bold">/api/agent/chat</span>
            </div>
            <div className="p-2.5 rounded bg-[#0A0C14] border border-[#1E293B] flex items-center justify-between">
              <span className="text-[#64748B]">Execution Runtime:</span>
              <span className="text-[#0D9488] font-bold">Client DOM Sandbox</span>
            </div>
            <div className="p-2.5 rounded bg-[#0A0C14] border border-[#1E293B] flex items-center justify-between">
              <span className="text-[#64748B]">Model Protocol:</span>
              <span className="text-[#38BDF8] font-bold">WebMCP Draft v1.4</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
