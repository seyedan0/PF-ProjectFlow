import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Network, ArrowDownRight, ArrowUpRight } from 'lucide-react';

const methodStyles = {
  GET: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
  POST: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
  PUT: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
  PATCH: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
  DELETE: 'bg-rose-500/20 text-rose-300 border-rose-500/40'
};

export const ApiNode = memo(({ data, selected }) => {
  const api = data.api || data;
  const method = (api.method || 'GET').toUpperCase();
  const methodStyle = methodStyles[method] || methodStyles.GET;
  const endpoint = api.endpoint || api.path || '/';

  const hasRequestPayload = Boolean(api.requestPayload || api.request);
  const hasResponsePayload = Boolean(api.responsePayload || api.response);

  return (
    <div
      className={`w-80 rounded-xl bg-obsidian-800/95 border transition-all duration-200 backdrop-blur-md shadow-card ${
        selected
          ? 'border-emerald-400 ring-2 ring-emerald-400/40 shadow-glow'
          : 'border-white/10 hover:border-emerald-500/40'
      }`}
    >
      <Handle type="target" position={Position.Left} className="!bg-emerald-500 !w-2.5 !h-2.5" />
      <Handle type="target" position={Position.Top} id="top" className="!bg-emerald-500 !w-2.5 !h-2.5" />

      {/* Header */}
      <div className="px-4 py-2.5 border-b border-white/5 flex items-center justify-between gap-2 bg-obsidian-900/60 rounded-t-xl">
        <div className="flex items-center gap-1.5 min-w-0">
          <Network className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
          <span className="font-mono text-xs font-semibold text-slate-200 truncate">{api.id}</span>
        </div>
        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${methodStyle}`}>
          {method}
        </span>
      </div>

      {/* Content */}
      <div className="p-4 space-y-2">
        <div className="font-mono text-xs font-bold text-emerald-200 bg-obsidian-950/80 px-2.5 py-1.5 rounded border border-white/5 truncate">
          {endpoint}
        </div>

        <h4 className="font-medium text-xs text-slate-200 leading-tight">
          {api.name}
        </h4>

        {api.description && (
          <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
            {api.description}
          </p>
        )}

        {/* Payload Indicators */}
        <div className="pt-1 flex items-center gap-2">
          {hasRequestPayload && (
            <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20">
              <ArrowDownRight className="w-2.5 h-2.5" />
              Req Body
            </span>
          )}
          {hasResponsePayload && (
            <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
              <ArrowUpRight className="w-2.5 h-2.5" />
              Response
            </span>
          )}
          {api.moduleId && (
            <span className="text-[10px] font-mono text-slate-500 ml-auto">
              mod: {api.moduleId}
            </span>
          )}
        </div>
      </div>

      <Handle type="source" position={Position.Right} className="!bg-emerald-500 !w-2.5 !h-2.5" />
      <Handle type="source" position={Position.Bottom} id="bottom" className="!bg-emerald-500 !w-2.5 !h-2.5" />
    </div>
  );
});

ApiNode.displayName = 'ApiNode';
