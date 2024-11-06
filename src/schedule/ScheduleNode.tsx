import { BaseNode } from '@/shared/base-node';
import { Handle, type NodeProps, Position } from '@xyflow/react';
import type { TScheduleNode } from './createSchedulesSlice';

export function ScheduleNode({ data }: NodeProps<TScheduleNode>) {
  return (
    <BaseNode>
      <>
        {data.label}
        <Handle type="target" position={Position.Top} />
        <Handle type="source" position={Position.Bottom} />
      </>
    </BaseNode>
  );
}
