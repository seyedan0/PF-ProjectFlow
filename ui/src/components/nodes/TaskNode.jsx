import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { CheckSquare, Clock, AlertCircle, Play, CheckCircle2 } from 'lucide-react';

const taskStatusConfig = {
  ready: {
    color: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    icon: Play,
    label: 'Ready'
  },
  in_progress: {
    color: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30 animate-pulse',
    icon: Clock,
    label: 'In Progress'
  },
  done: {
    color: 'bg-slate-700/30 text-emerald-400 border-emerald-500/30',
    icon: CheckCircle2,
    label: 'Done'
  },
  planned: {
    color: 'bg-slate-800 text-slate-400 border-slate-700',
    icon: AlertCircle,
    label: 'Planned'
  }
};

export const TaskNode = memo(({ data, selected }) => {
  const task = data.task || data;
  const status = task.status || 'ready';
  const config = taskStatusConfig[status] || taskStatusConfig.ready;
  const StatusIcon = config.icon;

  const ac = task.acceptanceCriteria || [];
  const assignedFiles = task.assignedFiles || [];

  return (
    <div
      className={`w-80 rounded-xl bg-obsidian-800/95 border transition-all duration-200 backdrop-blur-md shadow-card ${
        selected
          ? 'border-emerald-400 ring-2 ring-emerald-400/40 shadow-glow'
          : status === 'in_progress'
          ? 'border-cyan-400/70 ring-1 ring-cyan-400/30'
          : 'border-white/10 hover:border-emerald-500/40'
      }`}
    >
      <Handle type="target" position={Position.Left} className="!bg-emerald-500 !w-2.5 !h-2.5" />
      <Handle type="target" position={Position.Top} id="top" className="!bg-emerald-500 !w-2.5 !h-2.5" />

      {/* Header */}
      <div className="px-4 py-2.5 border-b border-white/5 flex items-center justify-between gap-2 bg-obsidian-900/60 rounded-t-xl">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            {task.id}
          </span>
          {task.milestoneId && (
            <span className="font-mono text-[10px] text-slate-400">
              {task.milestoneId}
            </span>
          )}
        </div>
        <div className={`flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border ${config.color}`}>
          <StatusIcon className="w-3 h-3" />
          <span>{config.label}</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-2.5">
        <h4 className="font-semibold text-xs text-emerald-100 leading-snug">
          {task.title}
        </h4>

        {task.description && (
          <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
            {task.description}
          </p>
        )}

        {/* Acceptance Criteria */}
        {ac.length > 0 && (
          <div className="pt-1">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 block mb-1">
              Acceptance Criteria ({ac.length})
            </span>
            <div className="space-y-1">
              {ac.slice(0, 2).map((item, idx) => (
                <div key={idx} className="flex items-start gap-1.5 text-[11px] text-slate-300">
                  <CheckSquare className="w-3 h-3 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <span className="truncate">{item}</span>
                </div>
              ))}
              {ac.length > 2 && (
                <div className="text-[10px] text-slate-500 pl-4.5">
                  +{ac.length - 2} more criteria
                </div>
              )}
            </div>
          </div>
        )}

        {/* Assigned Files */}
        {assignedFiles.length > 0 && (
          <div className="pt-1 flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] text-slate-500 font-mono">Files:</span>
            {assignedFiles.slice(0, 2).map((f, i) => (
              <span key={i} className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-obsidian-950 text-slate-300 border border-white/5 truncate max-w-[120px]">
                {f.split('/').pop()}
              </span>
            ))}
          </div>
        )}
      </div>

      <Handle type="source" position={Position.Right} className="!bg-emerald-500 !w-2.5 !h-2.5" />
      <Handle type="source" position={Position.Bottom} id="bottom" className="!bg-emerald-500 !w-2.5 !h-2.5" />
    </div>
  );
});

TaskNode.displayName = 'TaskNode';
