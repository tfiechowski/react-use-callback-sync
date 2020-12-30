import { uniqueId } from 'lodash';
import { useCallback, useContext, useEffect, useRef } from 'react';
import { CallbacksSyncContext } from './Context';

export function useCallbacksSync({
  id = uniqueId(),
  callback,
}: {
  id: string;
  callback: Function;
}) {
  const callbackId = useRef(id);
  const { addCallback, removeCallback, sync } = useContext(
    CallbacksSyncContext
  );

  const handleRemoveCallback = useCallback(() => {
    removeCallback(callbackId.current);
  }, [removeCallback]);

  useEffect(() => {
    addCallback(callbackId.current, callback);

    return () => handleRemoveCallback();
  }, [callback, addCallback]);

  return {
    sync: async () => {
      await callback();
      await sync();
    },
  };
}
