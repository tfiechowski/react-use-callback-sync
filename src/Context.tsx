import * as React from 'react';
import { omit, noop } from 'lodash';
import { createContext, useCallback, useState } from 'react';

export interface ICallbacks {
  [id: string]: Function;
}

interface ICallbacksContext {
  addCallback: (id: string, callback: Function) => void;
  removeCallback: (id: string) => void;
  sync: () => void;
}

function getDefaultState(): ICallbacksContext {
  return {
    addCallback: noop,
    removeCallback: noop,
    sync: noop,
  };
}

export const CallbacksSyncContext = createContext<ICallbacksContext>(
  getDefaultState()
);

// eslint-disable-next-line react/prop-types
export function CallbacksSyncProvider({ children }: { children: any }) {
  const [callbacks, setCallbacks] = useState<ICallbacks>({});

  const addCallback = useCallback(
    (id, callback) => {
      setCallbacks(_callbacks =>
        Object.assign({
          ..._callbacks,
          [id]: callback,
        })
      );
    },
    [setCallbacks]
  );

  const removeCallback = useCallback(
    id => {
      setCallbacks(_callbacks => Object.assign({}, omit(_callbacks, [id])));
    },
    [setCallbacks]
  );

  const sync = useCallback(() => {
    Object.values(callbacks).forEach(callback => callback());
  }, [callbacks]);

  return (
    <CallbacksSyncContext.Provider
      value={{ addCallback, removeCallback, sync }}
    >
      {children}
    </CallbacksSyncContext.Provider>
  );
}
