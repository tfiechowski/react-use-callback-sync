import * as React from 'react';
import { noop, unset, setWith } from 'lodash';
import { createContext, useCallback, useState } from 'react';

export const DEFAULT_GROUP_NAME = 'default';

export interface ICallbacks {
  [id: string]: Function;
}

export interface ICallbacksTree {
  [group: string]: ICallbacks;
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
  sync: (group?: string) => void;
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
      setCallbacks(_callbacks =>
        setWith(
          Object.assign({}, _callbacks),
          `${group}.${id}`,
          callback,
          Object
        )
      );
    },
    [setCallbacks]
  );

  const removeCallback = useCallback(
    (id: string, group: string = DEFAULT_GROUP_NAME) => {
      setCallbacks(_callbacks => {
        const copy = Object.assign({}, _callbacks);
        unset(copy, `${group}.${id}`);
        return copy;
      });
    },
    [setCallbacks]
  );

  const sync = useCallback(
    (group = DEFAULT_GROUP_NAME) => {
      const groupCallbacks = callbacks[group] || {};
      Object.values(groupCallbacks).forEach(callback => {
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
