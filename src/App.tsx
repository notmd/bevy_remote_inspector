import './App.css';
import { ThemeProvider } from './theme/ThemeProvider';
import { WebsocketConnector } from './websocket/WebSocketConnector';
import { Layout } from './layout/Layout';
import { WebSocketReconnectOverlay } from './websocket/WebSocketReconnectOverlay';
import { Toaster } from './shared/ui/toaster';
import { RenderedPage } from './page/RenderedPage';

function App() {
  return (
    <>
      <WebsocketConnector />
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <WebSocketReconnectOverlay />
        <Layout>
          <RenderedPage />
          <Toaster />
        </Layout>
      </ThemeProvider>
    </>
  );
}

export default App;
