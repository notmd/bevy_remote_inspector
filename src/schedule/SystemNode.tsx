import { BaseNode } from '@/shared/base-node';
import { Handle, type NodeProps, Position } from '@xyflow/react';
import type { TScheduleNode } from './createSchedulesSlice';

export function SystemNode({ data }: NodeProps<TScheduleNode>) {
  return (
    <BaseNode className="flex items-center bg-slate-800 text-sm">
      <>
        {data.label}
        {data.showTargetHandle && <Handle type="target" position={Position.Top} />}
        {data.showSourceHandle && <Handle type="source" position={Position.Bottom} />}
      </>
    </BaseNode>
  );
}
