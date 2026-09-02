/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * R-WAVE Universal Intelligence Lab - Dynamic WebMCP Tool Creator
 */

import React, { useState } from 'react';
import {
  Sparkles,
  X,
  Code2,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { ModelContextProtocolAPI, ToolCategory, WebMCPParameterSchema } from '../types/webmcp';

interface CustomToolModalProps {
  mcp: ModelContextProtocolAPI;
  isOpen: boolean;
  onClose: () => void;
  onToolCreated: () => void;
}

export const CustomToolModal: React.FC<CustomToolModalProps> = ({
  mcp,
  isOpen,
  onClose,
  onToolCreated,
}) => {
  const [toolName, setToolName] = useState('rwave_crypto_digest');
  const [category, setCategory] = useState<ToolCategory>('custom');
  const [description, setDescription] = useState(
    'Calculates secure cryptographic hash of text or JSON object in browser sandbox.'
  );
  const [parametersJson, setParametersJson] = useState(
    JSON.stringify(
      {
        type: 'object',
        properties: {
          text: {
            type: 'string',
            description: 'The text string or payload to digest.',
          },
          algorithm: {
            type: 'string',
            enum: ['SHA-256', 'SHA-384', 'SHA-512'],
            default: 'SHA-256',
            description: 'SubtleCrypto algorithm.',
          },
        },
        required: ['text'],
      },
      null,
      2
    )
  );
  const [handlerCode, setHandlerCode] = useState(`// Function body receiving (args)
const text = args.text || '';
const algo = args.algorithm || 'SHA-256';

const encoder = new TextEncoder();
const data = encoder.encode(text);
const hashBuffer = await crypto.subtle.digest(algo, data);
const hashArray = Array.from(new Uint8Array(hashBuffer));
const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

return {
  input: text,
  algorithm: algo,
  digestHex: hashHex,
  byteLength: hashArray.length,
  timestamp: Date.now()
};`);

  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      // 1. Validate tool name
      if (!toolName.trim()) {
        throw new Error('Tool name is required');
      }

      // 2. Validate parameters JSON
      let parsedSchema: WebMCPParameterSchema;
      try {
        parsedSchema = JSON.parse(parametersJson);
      } catch (err: any) {
        throw new Error(`Invalid Parameter JSON Schema: ${err.message}`);
      }

      // 3. Create Async Function handler
      // Create safe async executor function
      const asyncFunctionConstructor = Object.getPrototypeOf(async function () {}).constructor;
      const createdHandler = new asyncFunctionConstructor('args', handlerCode);

      // 4. Register to WebMCP Runtime
      mcp.registerTool({
        name: toolName.trim(),
        description: description.trim(),
        category,
        version: '1.0.0',
        author: 'Researcher (Live WebMCP Session)',
        parameters: parsedSchema,
        handler: createdHandler,
      });

      onToolCreated();
      onClose();
    } catch (err: any) {
      setError(err?.message || String(err));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-2xl bg-[#0F172A] border border-[#1E293B] p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto font-mono text-xs">
        <div className="flex items-center justify-between border-b border-[#1E293B] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#00CCCC] to-[#0D9488] shadow-[0_0_12px_rgba(0,204,204,0.3)] flex items-center justify-center text-[#0A0C14]">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-bold text-[#A5F3FC] text-sm">Register Custom WebMCP Tool</h3>
              <p className="text-[11px] text-[#94A3B8]">
                Hooks into document.modelContext for immediate AI agent and browser execution
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#94A3B8] hover:text-[#E0E7FF] hover:bg-[#1E293B] transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-[#00CCCC]/10 border border-[#00CCCC]/40 text-[#A5F3FC] flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-[#00CCCC] flex-shrink-0 mt-0.5" />
            <p className="text-[11px] leading-tight">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[#CBD5E1] mb-1 font-semibold">Tool Name</label>
              <input
                type="text"
                value={toolName}
                onChange={(e) => setToolName(e.target.value)}
                placeholder="e.g. rwave_crypto_digest"
                className="w-full px-3 py-2 rounded-lg bg-[#0A0C14] border border-[#1E293B] text-[#E0E7FF] focus:outline-none focus:border-[#00CCCC]/60"
                required
              />
            </div>

            <div>
              <label className="block text-[#CBD5E1] mb-1 font-semibold">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full px-3 py-2 rounded-lg bg-[#0A0C14] border border-[#1E293B] text-[#E0E7FF] focus:outline-none focus:border-[#00CCCC]/60"
              >
                <option value="custom">Custom</option>
                <option value="diagnostic">Diagnostic</option>
                <option value="research">Research</option>
                <option value="synthesis">Synthesis</option>
                <option value="benchmark">Benchmark</option>
                <option value="system">System</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[#CBD5E1] mb-1 font-semibold">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What does this tool do?"
              className="w-full px-3 py-2 rounded-lg bg-[#0A0C14] border border-[#1E293B] text-[#E0E7FF] focus:outline-none focus:border-[#00CCCC]/60"
              required
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[#CBD5E1] font-semibold">Parameter JSON Schema (OpenAI / WebMCP Format)</label>
              <span className="text-[10px] text-[#00CCCC] font-bold">JSON Schema v7</span>
            </div>
            <textarea
              rows={5}
              value={parametersJson}
              onChange={(e) => setParametersJson(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#0A0C14] border border-[#1E293B] text-[#00CCCC] focus:outline-none focus:border-[#00CCCC]/60 text-[11px]"
              required
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[#CBD5E1] font-semibold">JavaScript Handler Body (Async/Await supported)</label>
              <span className="text-[10px] text-[#0D9488] font-bold">Safe Browser Context</span>
            </div>
            <textarea
              rows={6}
              value={handlerCode}
              onChange={(e) => setHandlerCode(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#0A0C14] border border-[#1E293B] text-[#2DD4BF] focus:outline-none focus:border-[#0D9488]/60 text-[11px]"
              required
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#1E293B]">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-lg bg-[#1E293B] hover:bg-[#334155] text-[#CBD5E1] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-[#00CCCC] hover:bg-[#00CCCC]/90 text-[#0A0C14] font-bold shadow-[0_0_12px_rgba(0,204,204,0.3)] cursor-pointer uppercase tracking-wider"
            >
              Register to document.modelContext
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
