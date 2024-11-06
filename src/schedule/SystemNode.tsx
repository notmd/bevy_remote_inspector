import { BaseNode } from '@/shared/base-node';
import { Handle, type NodeProps, Position } from '@xyflow/react';
import type { TScheduleNode } from './createSchedulesSlice';

export function SystemNode({ data }: NodeProps<TScheduleNode>) {
  return (
    <BaseNode className="flex items-center text-sm">
      <>
        <Handle type="target" position={Position.Top} />
        {data.label}
        <Handle type="source" position={Position.Bottom} />
      </>
    </BaseNode>
  );
}
