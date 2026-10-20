import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Database, Key } from 'lucide-react';

export const DataModelNode = memo(({ data, selected }) => {
  const model = data.model || data;
  const fields = model.fields || [];

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
      <div className="px-4 py-2.5 border-b border-white/5 flex items-center justify-between gap-2 bg-obsidian-900/60 rounded-t-xl">
        <div className="flex items-center gap-1.5">
          <Database className="w-3.5 h-3.5 text-cyan-400" />
          <span className="font-mono text-xs font-bold text-slate-200">{model.id}</span>
        </div>
        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
          Entity
        </span>
      </div>

      {/* Content */}
      <div className="p-3.5 space-y-2">
        <h4 className="font-semibold text-xs text-emerald-100">
          {model.name}
        </h4>
        {model.description && (
          <p className="text-[11px] text-slate-400 line-clamp-1">
            {model.description}
          </p>
        )}

        {/* Fields list */}
        {fields.length > 0 && (
          <div className="rounded-lg bg-obsidian-950/80 border border-white/5 divide-y divide-white/5 overflow-hidden">
            {fields.slice(0, 4).map((f, idx) => (
              <div key={idx} className="px-2.5 py-1 flex items-center justify-between text-[11px] font-mono">
                <div className="flex items-center gap-1 text-slate-200 truncate">
                  {f.name === 'id' && <Key className="w-2.5 h-2.5 text-amber-400 flex-shrink-0" />}
                  <span className="truncate">{f.name}</span>
                  {f.required && <span className="text-rose-400 text-[10px]">*</span>}
                </div>
                <span className="text-slate-500 text-[10px] ml-2 flex-shrink-0">{f.type}</span>
              </div>
            ))}
            {fields.length > 4 && (
              <div className="px-2.5 py-1 text-[10px] text-slate-500 text-center bg-obsidian-900/40">
                +{fields.length - 4} more fields
              </div>
            )}
          </div>
        )}
      </div>

      <Handle type="source" position={Position.Right} className="!bg-emerald-500 !w-2.5 !h-2.5" />
      <Handle type="source" position={Position.Bottom} id="bottom" className="!bg-emerald-500 !w-2.5 !h-2.5" />
    </div>
  );
});

DataModelNode.displayName = 'DataModelNode';
