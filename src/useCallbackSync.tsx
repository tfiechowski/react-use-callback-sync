import { uniqueId } from 'lodash';
import { useContext, useEffect, useRef } from 'react';
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

  useEffect(() => {
    addCallback(callbackId.current, callback);

    return () => removeCallback(callbackId.current);
  }, [callback]);

  return async () => {
    await callback();
    await sync();
  };
}
