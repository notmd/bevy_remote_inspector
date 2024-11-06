import { useStore } from '@/store';
import { ReactFlowProvider } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { ScheduleGraph } from './ScheduleGraph';

export function SchedulePage() {
  const nodes = useStore((s) => s.nodes);
  if (nodes.length === 0) {
    return 'no nodes';
  }

  return (
    <div style={{ height: '100%' }}>
      <ReactFlowProvider>
        <ScheduleGraph />
      </ReactFlowProvider>
    </div>
  );
}
