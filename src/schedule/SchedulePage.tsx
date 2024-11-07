import { ReactFlowProvider } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { ScheduleGraph } from './ScheduleGraph';

export function SchedulePage() {
  return (
    <div style={{ height: '100%' }}>
      <ReactFlowProvider>
        <ScheduleGraph />
      </ReactFlowProvider>
    </div>
  );
}
