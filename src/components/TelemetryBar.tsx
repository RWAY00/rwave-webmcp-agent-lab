/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * R-WAVE Universal Intelligence Lab - Live Telemetry & Protocol Status Bar
 */

import React, { useEffect, useState } from 'react';
import {
  Activity,
  Cpu,
  ShieldCheck,
  Zap,
  Layers,
  Radio,
} from 'lucide-react';
import { TelemetryMetrics } from '../types/webmcp';

interface TelemetryBarProps {
  metrics: TelemetryMetrics;
}

export const TelemetryBar: React.FC<TelemetryBarProps> = ({ metrics }) => {
  const [fps, setFps] = useState(60);

  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    let animId: number;

    const measure = () => {
      frameCount++;
      const now = performance.now();
      if (now - lastTime >= 1000) {
        setFps(Math.round((frameCount * 1000) / (now - lastTime)));
        frameCount = 0;
        lastTime = now;
      }
      animId = requestAnimationFrame(measure);
    };

    animId = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <footer className="border-t border-[#1E293B] bg-[#0A0C14]/95 backdrop-blur-md sticky bottom-0 z-30 font-mono text-[11px] text-[#94A3B8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Spec info & status */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-[#A5F3FC]">
            <div className="w-2 h-2 rounded-full bg-[#00CCCC] animate-cool-pulse" />
            <span className="font-bold tracking-wider uppercase text-[10px] text-[#00CCCC]">WebMCP v1.4-draft</span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-[#94A3B8] border-l border-[#1E293B] pl-4">
            <span className="text-[10px] uppercase text-[#64748B]">Isolation:</span>
            <span className="text-[#0D9488] font-semibold flex items-center gap-1">
              <ShieldCheck className="h-3 w-3 text-[#00CCCC]" /> Grade-A Secure Sandbox
            </span>
          </div>
        </div>

        {/* Right: Real-time telemetry items */}
        <div className="flex items-center gap-5 text-[#CBD5E1]">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] uppercase text-[#64748B]">FPS:</span>
            <span className="text-[#00CCCC] font-bold">{fps}</span>
          </div>

          <div className="hidden md:flex items-center gap-1.5">
            <span className="text-[10px] uppercase text-[#64748B]">Heap:</span>
            <span className="text-[#0D9488] font-bold">{metrics.memoryMB} MB</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[10px] uppercase text-[#64748B]">Tools:</span>
            <span className="text-[#A5F3FC] font-bold">{metrics.registeredToolsCount}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[10px] uppercase text-[#64748B]">Context:</span>
            <span className="text-[#818CF8] font-bold">{metrics.contextNodesCount} nodes</span>
          </div>

          <div className="hidden lg:flex items-center gap-1.5 border-l border-[#1E293B] pl-4 text-[10px] text-[#64748B] uppercase tracking-widest">
            <span className="text-[#00CCCC]">R-WAVE</span> Quantum Encryption
          </div>
        </div>
      </div>
    </footer>
  );
};
