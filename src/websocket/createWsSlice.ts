import type { SharedSlice } from '@/store';
import type { StateCreator } from 'zustand';
import { WEB_SOCKET_MESSAGE_ID } from './useWs';
import { ReadyState } from 'react-use-websocket';
import type { SendJsonMessage } from 'react-use-websocket/dist/lib/types';
import { toast } from '@/shared/hooks/use-toast';
import type { TType, TypeName } from '@/type-registry/useTypeRegistry';
import type { ComponentId, ComponentInfo, ComponentValue } from '@/component/useComponents';
import type { EntityId } from '@/entity/useEntity';
import type { ScheduleInfo } from '@/schedule/createSchedulesSlice';
export type WsSlice = {
  url?: string;
  readyState: ReadyState;
  sendMessage: (data: {
    method: string;
    params: any;
    callback?: (data: WsEvent) => void;
  }) => void;
  initSendMessage: (fn: SendJsonMessage) => void;
  setReadyState: (readyState: ReadyState) => void;
  onMessage: (message: MessageEvent<any>) => void;
  commandCallbacks: Map<string, (data: WsEvent) => void>;
  shouldReconnect: boolean;
  hasConnected: boolean;
  isManuallyConnect: boolean;
};

let sendMessageInteral: SendJsonMessage = () => {
  console.error('sendMessage not initialized');
};

let id = 10;
export const createWsSlice: StateCreator<SharedSlice, [], [], WsSlice> = (set, get) => ({
  url: parseWsURL(localStorage.getItem('ws_url') || 'ws://localhost:3000'),
  commandCallbacks: new Map(),
  readyState: ReadyState.UNINSTANTIATED,
  shouldReconnect: true,
  isManuallyConnect: false,
  hasConnected: false,
  sendMessage: ({
    callback,
    ...data
  }: {
    method: string;
    params: any;
    callback?: (data: WsEvent) => void;
  }) => {
    const newId = String(id++);
    if (callback !== undefined) {
      const commandCallbacks = get().commandCallbacks;

      commandCallbacks.set(newId, callback);

      set({ commandCallbacks: commandCallbacks });
    }

    sendMessageInteral({
      ...data,
      id: newId,
      jsonrpc: '2.0',
    });

    import.meta.env.DEV &&
      console.log(`send message ${data.method} ${JSON.stringify(data.params)}`);
  },
  initSendMessage: (fn) => {
    sendMessageInteral = fn;
  },
  setReadyState: (readyState) => {
    set({ readyState });

    if (readyState === ReadyState.OPEN) {
      set({
        hasConnected: true,
        shouldReconnect: true,
        childParentMap: new Map(),
        entities: new Map(),
        registry: new Map(),
        componentNameToIdMap: new Map(),
        components: new Map(),
        inspectingEntity: null,
      });
      localStorage.setItem('ws_url', get().url!);
    }
  },
  onMessage: (message) => {
    try {
      const event = JSON.parse(message.data) as WsEvent;
      if (event.id === null) {
        return;
      }

      if (event.id !== WEB_SOCKET_MESSAGE_ID) {
        const commandCallbacks = get().commandCallbacks;

        const callback = commandCallbacks.get(event.id);
        if (typeof callback === 'function') {
          callback(event);
          commandCallbacks.delete(event.id);
          set({ commandCallbacks });
        }

        if (event.error) {
          toast({
            title: 'Error',
            description: event.error.message,
            variant: 'destructive',
          });
        }
        return;
      }

      for (const item of event.result) {
        if (item.kind === 'type_registry') {
          get().setRegistry(item.types);
        } else if (item.kind === 'component') {
          get().updateComponents(item.components);
        } else if (item.kind === 'entity') {
          get().updateEntity(item.entity, item.mutation);
        } else if (item.kind === 'schedules') {
          get().setSchedules(item.schedules);
        } else {
          console.log(item);
        }
      }
    } catch (e) {
      console.error(e);
    }
  },
});

export function parseWsURL(input: string): string | undefined {
  try {
    const url = new URL(input);
    const ws_url = `ws://${url.host}${url.pathname}`;
    return ws_url;
  } catch (e) {
    return;
  }
}

export type WsEvent = {
  id: string | null;
  result: StreamEvent[];
  error?: {
    code: number;
    message: string;
  };
};

type StreamEvent = TypeRegistryEvent | ComponentsEvent | EntityEvent | ScheduleEvent;

export type TypeRegistryEvent = {
  kind: 'type_registry';
  types: Array<[TypeName, TType]>;
};

export type ComponentsEvent = {
  kind: 'component';
  components: Array<ComponentInfo & { id: ComponentId }>;
};

export type EntityEvent = {
  kind: 'entity';
  entity: EntityId;
  mutation: EntityMutaion;
};

export type ScheduleEvent = {
  kind: 'schedules';
  schedules: ScheduleInfo[];
};

export type EntityMutaion = EntityMutationChange | EntityMutationRemove;

export type EntityMutationChange = {
  kind: 'change';
  changes: Array<[ComponentId, boolean, ComponentValue]>;
  removes: Array<[ComponentId, boolean]>;
};
export type EntityMutationRemove = { kind: 'remove' };
