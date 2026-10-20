import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { StickyNote, Tag } from 'lucide-react';

const noteColorThemes = {
  yellow: 'bg-amber-950/80 border-amber-500/40 text-amber-100',
  emerald: 'bg-emerald-950/80 border-emerald-500/40 text-emerald-100',
  cyan: 'bg-cyan-950/80 border-cyan-500/40 text-cyan-100',
  rose: 'bg-rose-950/80 border-rose-500/40 text-rose-100',
  purple: 'bg-purple-950/80 border-purple-500/40 text-purple-100'
};

export const StickyNoteNode = memo(({ data, selected }) => {
  const color = data.color || 'emerald';
  const colorStyle = noteColorThemes[color] || noteColorThemes.emerald;
  const tags = data.tags || [];

  return (
    <div
      className={`w-64 rounded-xl border p-4 transition-all duration-200 backdrop-blur-md shadow-card ${colorStyle} ${
        selected ? 'ring-2 ring-emerald-400 shadow-glow' : 'hover:scale-[1.01]'
      }`}
    >
      <Handle type="target" position={Position.Left} className="!bg-emerald-400 !w-2 !h-2" />
      <Handle type="target" position={Position.Top} className="!bg-emerald-400 !w-2 !h-2" />

      <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
        <div className="flex items-center gap-1.5 font-semibold text-xs tracking-wide">
          <StickyNote className="w-3.5 h-3.5 opacity-80" />
          <span>{data.label || 'Idea / Note'}</span>
        </div>
        {data.referencedEntity && (
          <span className="text-[10px] font-mono opacity-60">
            {data.referencedEntity.type}:{data.referencedEntity.id}
          </span>
        )}
      </div>

      {data.description && (
        <p className="text-xs opacity-90 leading-relaxed whitespace-pre-wrap">
          {data.description}
        </p>
      )}

      {tags.length > 0 && (
        <div className="mt-3 pt-2 border-t border-white/10 flex items-center gap-1 flex-wrap">
          {tags.map((tag, idx) => (
            <span key={idx} className="flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full bg-white/10 opacity-80">
              <Tag className="w-2.5 h-2.5" />
              {tag}
            </span>
          ))}
        </div>
      )}

      <Handle type="source" position={Position.Right} className="!bg-emerald-400 !w-2 !h-2" />
      <Handle type="source" position={Position.Bottom} className="!bg-emerald-400 !w-2 !h-2" />
    </div>
  );
});

StickyNoteNode.displayName = 'StickyNoteNode';
