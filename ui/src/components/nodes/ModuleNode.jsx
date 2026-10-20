import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Box, Layers, Check } from 'lucide-react';

const layerColors = {
  core: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  server: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
  ui: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
  cli: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  scanner: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
  shared: 'bg-slate-500/15 text-slate-300 border-slate-500/30'
};

export const ModuleNode = memo(({ data, selected }) => {
  const module = data.module || data;
  const layerStyle = layerColors[module.layer] || layerColors.core;

  return (
    <div
      className={`w-72 rounded-xl bg-obsidian-800/95 border transition-all duration-200 backdrop-blur-md shadow-card ${
        selected
          ? 'border-emerald-400 ring-2 ring-emerald-400/40 shadow-glow'
          : 'border-white/10 hover:border-emerald-500/40'
      }`}
    >
      <Handle type="target" position={Position.Left} className="!bg-emerald-500 !w-2.5 !h-2.5" />
      <Handle type="target" position={Position.Top} id="top" className="!bg-emerald-500 !w-2.5 !h-2.5" />

      {/* Header */}
      <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between gap-2 bg-obsidian-900/60 rounded-t-xl">
        <div className="flex items-center gap-2">
          <Box className="w-4 h-4 text-emerald-400" />
          <span className="font-mono text-xs font-bold text-slate-200">{module.id}</span>
        </div>
        <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded border ${layerStyle}`}>
          {module.layer || 'core'}
        </span>
      </div>

      {/* Content */}
      <div className="p-4 space-y-2.5">
        <h4 className="font-semibold text-sm text-emerald-50 leading-tight">
          {module.name}
        </h4>
        {module.description && (
          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
            {module.description}
          </p>
        )}

        {/* Responsibilities */}
        {module.responsibilities && module.responsibilities.length > 0 && (
          <div className="pt-1">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 block mb-1">
              Responsibilities
            </span>
            <ul className="space-y-1">
              {module.responsibilities.slice(0, 3).map((resp, idx) => (
                <li key={idx} className="text-xs text-slate-300 flex items-start gap-1.5 truncate">
                  <Check className="w-3 h-3 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span className="truncate">{resp}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Dependencies */}
        {module.dependencies && module.dependencies.length > 0 && (
          <div className="pt-1 flex items-center gap-1.5 text-[11px] text-slate-400">
            <Layers className="w-3 h-3 text-slate-500" />
            <span>Depends on: <strong className="text-slate-300 font-mono">{module.dependencies.join(', ')}</strong></span>
          </div>
        )}
      </div>

      <Handle type="source" position={Position.Right} className="!bg-emerald-500 !w-2.5 !h-2.5" />
      <Handle type="source" position={Position.Bottom} id="bottom" className="!bg-emerald-500 !w-2.5 !h-2.5" />
    </div>
  );
});

ModuleNode.displayName = 'ModuleNode';
