import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Flag, CheckCircle2, Clock, AlertCircle, ArrowRight } from 'lucide-react';

const statusConfig = {
  completed: {
    color: 'text-emerald-400 bg-emerald-950/60 border-emerald-500/40',
    icon: CheckCircle2,
    label: 'Completed'
  },
  in_progress: {
    color: 'text-cyan-400 bg-cyan-950/60 border-cyan-500/40 animate-pulse',
    icon: Clock,
    label: 'In Progress'
  },
  active: {
    color: 'text-cyan-400 bg-cyan-950/60 border-cyan-500/40 animate-pulse',
    icon: Clock,
    label: 'Active'
  },
  planned: {
    color: 'text-slate-400 bg-slate-900/60 border-slate-700/50',
    icon: Flag,
    label: 'Planned'
  },
  blocked: {
    color: 'text-rose-400 bg-rose-950/60 border-rose-500/40',
    icon: AlertCircle,
    label: 'Blocked'
  }
};

export const MilestoneNode = memo(({ data, selected }) => {
  const milestone = data.milestone || data;
  const statusInfo = statusConfig[milestone.status] || statusConfig.planned;
  const StatusIcon = statusInfo.icon;
  const isActive = data.isActive;

  return (
    <div
      className={`w-80 rounded-xl bg-obsidian-800/95 border transition-all duration-200 backdrop-blur-md shadow-card ${
        selected
          ? 'border-emerald-400 ring-2 ring-emerald-400/40 shadow-glow'
          : isActive
          ? 'border-cyan-400/80 ring-1 ring-cyan-400/30'
          : 'border-white/10 hover:border-emerald-500/40'
      }`}
    >
      <Handle type="target" position={Position.Left} className="!bg-emerald-500 !w-2.5 !h-2.5" />

      {/* Header */}
      <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between gap-2 bg-obsidian-900/60 rounded-t-xl">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/20">
            {milestone.id}
          </span>
          {isActive && (
            <span className="text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              Active Focus
            </span>
          )}
        </div>
        <div className={`flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border ${statusInfo.color}`}>
          <StatusIcon className="w-3 h-3" />
          <span>{statusInfo.label}</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-2.5">
        <h3 className="font-semibold text-sm text-emerald-50 leading-snug">
          {milestone.title}
        </h3>
        {milestone.description && (
          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
            {milestone.description}
          </p>
        )}

        {/* Target Outcome */}
        {milestone.targetOutcome && (
          <div className="p-2 rounded-lg bg-obsidian-950/70 border border-white/5">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 block mb-0.5">
              Target Outcome
            </span>
            <p className="text-xs text-emerald-200/90 italic leading-snug">
              "{milestone.targetOutcome}"
            </p>
          </div>
        )}

        {/* Deliverables */}
        {milestone.deliverables && milestone.deliverables.length > 0 && (
          <div className="pt-1">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 block mb-1">
              Deliverables ({milestone.deliverables.length})
            </span>
            <ul className="space-y-1">
              {milestone.deliverables.slice(0, 3).map((item, idx) => (
                <li key={idx} className="text-xs text-slate-300 flex items-start gap-1.5 truncate">
                  <ArrowRight className="w-3 h-3 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <span className="truncate">{item}</span>
                </li>
              ))}
              {milestone.deliverables.length > 3 && (
                <li className="text-[10px] text-slate-500 pl-4">
                  +{milestone.deliverables.length - 3} more deliverables
                </li>
              )}
            </ul>
          </div>
        )}
      </div>

      <Handle type="source" position={Position.Right} className="!bg-emerald-500 !w-2.5 !h-2.5" />
    </div>
  );
});

MilestoneNode.displayName = 'MilestoneNode';
