import { useWs } from '@/websocket/useWs';
import { useStore } from '@/store';
import { ReadyState } from 'react-use-websocket';
import { WsUrlForm } from '@/websocket/WsUrlForm';
import { EntitiesInspectorPage } from '@/entity/EntitiesInspectorPage';
import { SchedulePage } from '@/schedule/SchedulePage';

export function RenderedPage() {
  const currentPage = useStore((s) => s.currentPage);
  const { readyState } = useWs();
  const hasConnected = useStore((state) => state.hasConnected);
  if (readyState !== ReadyState.OPEN && !hasConnected) {
    return <WsUrlForm />;
  }

  if (currentPage === 'inspector') {
    return <EntitiesInspectorPage />;
  }

  if (currentPage === 'schedule') {
    return <SchedulePage />;
  }

  return <>Page not found</>;
}
