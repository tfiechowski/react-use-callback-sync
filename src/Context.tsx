import * as React from 'react';
import { createContext, useCallback, useState } from 'react';

export const DEFAULT_GROUP_NAME = 'default';

const noop = () => {};

export interface ICallbacks {
  [id: string]: Function;
}

export interface ICallbacksTree {
  [group: string]: ICallbacks;
}

export interface SyncOptions {
  group?: string;
  omitIds?: Array<string>;
}

interface ICallbacksContext {
  addCallback: ({
    id,
    callback,
    group,
  }: {
    id: string;
    callback: Function;
    group?: string;
  }) => void;
  removeCallback: (id: string) => void;
  sync: (options?: SyncOptions) => void;
}

function getDefaultState(): ICallbacksContext {
  return {
    addCallback: noop,
    removeCallback: noop,
    sync: noop,
  };
}

export const CallbackSyncContext = createContext<ICallbacksContext>(
  getDefaultState()
);

// eslint-disable-next-line react/prop-types
export function CallbackSyncProvider({ children }: { children: any }) {
  const [callbacks, setCallbacks] = useState<ICallbacksTree>({});

  const addCallback = useCallback(
    ({ id, callback, group = DEFAULT_GROUP_NAME }) => {
      setCallbacks(_callbacks => {
        const copy = Object.assign({}, _callbacks);
        if (
          copy[group] &&
          typeof copy[group] === 'object' &&
          copy[group] !== null
        ) {
          copy[group][id] = callback;
        } else {
          copy[group] = {
            [id]: callback,
          };
        }
        return copy;
      });
    },
    [setCallbacks]
  );

  const removeCallback = useCallback(
    (id: string, group: string = DEFAULT_GROUP_NAME) => {
      setCallbacks(_callbacks => {
        const copy = Object.assign({}, _callbacks);
        delete copy[group][id];
        return copy;
      });
    },
    [setCallbacks]
  );

  const sync = useCallback(
    ({ group, omitIds = [] }) => {
      const groupCallbacks = callbacks[group] || {};
      Object.entries(groupCallbacks)
        .filter(([id]) => !omitIds.includes(id))
        .forEach(([_, callback]) => {
          callback();
        });
    },
    [callbacks]
  );

  return (
    <CallbackSyncContext.Provider value={{ addCallback, removeCallback, sync }}>
      {children}
    </CallbackSyncContext.Provider>
  );
}
