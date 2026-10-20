import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { ShieldAlert, ShieldCheck, AlertTriangle, Info } from 'lucide-react';

const severityConfig = {
  error: {
    badge: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    icon: ShieldAlert,
    border: 'border-rose-500/30'
  },
  warning: {
    badge: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    icon: AlertTriangle,
    border: 'border-amber-500/30'
  },
  info: {
    badge: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
    icon: Info,
    border: 'border-blue-500/30'
  }
};

export const RuleNode = memo(({ data, selected }) => {
  const rule = data.rule || data;
  const severity = rule.severity || 'error';
  const config = severityConfig[severity] || severityConfig.error;
  const SeverityIcon = config.icon;

  return (
    <div
      className={`w-72 rounded-xl bg-obsidian-800/95 border transition-all duration-200 backdrop-blur-md shadow-card ${
        selected
          ? 'border-emerald-400 ring-2 ring-emerald-400/40 shadow-glow'
          : `${config.border} hover:border-emerald-500/40`
      }`}
    >
      <Handle type="target" position={Position.Left} className="!bg-emerald-500 !w-2.5 !h-2.5" />
      <Handle type="target" position={Position.Top} id="top" className="!bg-emerald-500 !w-2.5 !h-2.5" />

      {/* Header */}
      <div className="px-4 py-2 border-b border-white/5 flex items-center justify-between gap-2 bg-obsidian-900/60 rounded-t-xl">
        <div className="flex items-center gap-1.5">
          <SeverityIcon className="w-3.5 h-3.5 text-slate-300" />
          <span className="font-mono text-xs font-bold text-slate-200">{rule.id}</span>
        </div>
        <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded border ${config.badge}`}>
          {severity}
        </span>
      </div>

      {/* Content */}
      <div className="p-3.5 space-y-1.5">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-xs text-slate-200 truncate">
            {rule.title}
          </h4>
          <span className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">
            {rule.category}
          </span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed bg-obsidian-950/60 p-2.5 rounded-lg border border-white/5">
          {rule.rule}
        </p>
        {rule.enforcedBy && (
          <div className="text-[10px] text-slate-500 font-mono pt-1">
            Enforced by: <span className="text-slate-400">{rule.enforcedBy}</span>
          </div>
        )}
      </div>

      <Handle type="source" position={Position.Right} className="!bg-emerald-500 !w-2.5 !h-2.5" />
      <Handle type="source" position={Position.Bottom} id="bottom" className="!bg-emerald-500 !w-2.5 !h-2.5" />
    </div>
  );
});

RuleNode.displayName = 'RuleNode';
