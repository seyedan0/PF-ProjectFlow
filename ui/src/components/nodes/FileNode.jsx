import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { FileCode, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

const layerColors = {
  core: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  server: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
  ui: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
  cli: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  config: 'bg-slate-500/15 text-slate-300 border-slate-500/30'
};

export const FileNode = memo(({ data, selected }) => {
  const file = data.file || data;
  const layer = file.layer || 'core';
  const layerStyle = layerColors[layer] || layerColors.core;

  // Drift detection: mismatch between intended and observed responsibility
  const hasDrift = Boolean(
    (file.intendedResponsibility && file.observedResponsibility &&
     file.intendedResponsibility.trim().toLowerCase() !== file.observedResponsibility.trim().toLowerCase()) ||
    file.driftDetected ||
    data.hasDrift
  );

  return (
    <div
      className={`w-72 rounded-xl bg-obsidian-800/95 border transition-all duration-200 backdrop-blur-md shadow-card ${
        selected
          ? 'border-emerald-400 ring-2 ring-emerald-400/40 shadow-glow'
          : hasDrift
          ? 'border-amber-500/70 shadow-glow-sm ring-1 ring-amber-500/30'
          : 'border-white/10 hover:border-emerald-500/40'
      }`}
    >
      <Handle type="target" position={Position.Left} className="!bg-emerald-500 !w-2.5 !h-2.5" />
      <Handle type="target" position={Position.Top} id="top" className="!bg-emerald-500 !w-2.5 !h-2.5" />

      {/* Header */}
      <div className="px-3.5 py-2 border-b border-white/5 flex items-center justify-between gap-2 bg-obsidian-900/60 rounded-t-xl">
        <div className="flex items-center gap-1.5 truncate">
          <FileCode className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
          <span className="font-mono text-xs font-semibold text-slate-200 truncate" title={file.path}>
            {file.path ? file.path.split('/').pop() : 'file'}
          </span>
        </div>
        <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border ${layerStyle}`}>
          {layer}
        </span>
      </div>

      {/* Content */}
      <div className="p-3.5 space-y-2">
        <div className="text-[11px] font-mono text-slate-400 truncate bg-obsidian-950/70 px-2 py-1 rounded border border-white/5" title={file.path}>
          {file.path}
        </div>

        {file.role && (
          <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
            {file.role}
          </p>
        )}

        {/* Drift Alert Banner */}
        {hasDrift && (
          <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-200 space-y-1">
            <div className="flex items-center gap-1 font-semibold text-amber-400">
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Architectural Drift Detected</span>
            </div>
            {file.intendedResponsibility && (
              <div className="text-[10px] text-slate-400">
                Intended: <span className="text-slate-300">{file.intendedResponsibility}</span>
              </div>
            )}
            {file.observedResponsibility && (
              <div className="text-[10px] text-amber-300/90">
                Observed: <span>{file.observedResponsibility}</span>
              </div>
            )}
          </div>
        )}

        {/* Associated Modules & APIs */}
        <div className="pt-1 flex items-center gap-2 flex-wrap text-[10px]">
          {file.relatedModuleIds && file.relatedModuleIds.map((modId) => (
            <span key={modId} className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 font-mono border border-emerald-500/20">
              {modId}
            </span>
          ))}
          {file.relatedApiIds && file.relatedApiIds.map((apiId) => (
            <span key={apiId} className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-300 font-mono border border-blue-500/20">
              {apiId}
            </span>
          ))}
        </div>
      </div>

      <Handle type="source" position={Position.Right} className="!bg-emerald-500 !w-2.5 !h-2.5" />
      <Handle type="source" position={Position.Bottom} id="bottom" className="!bg-emerald-500 !w-2.5 !h-2.5" />
    </div>
  );
});

FileNode.displayName = 'FileNode';
