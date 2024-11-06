import { BaseNode } from '@/shared/base-node';
import { Handle, type NodeProps, Position } from '@xyflow/react';
import type { TScheduleNode } from './createSchedulesSlice';

export function SystemNode({ data, width, height, ...props }: NodeProps<TScheduleNode>) {
  console.log('SystemNode', props);
  return (
    <BaseNode
      className="flex items-center text-sm"
      //   style={{
      //     minWidth: width,
      //     minHeight: height,
      //   }}
    >
      <>
        <Handle type="target" position={Position.Top} />
        {data.label}
        <Handle type="source" position={Position.Bottom} />
      </>
    </BaseNode>
  );
}
