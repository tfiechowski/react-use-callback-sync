import { uniqueId } from 'lodash';
import { useCallback, useContext, useEffect, useRef } from 'react';
import { CallbacksSyncContext, DEFAULT_GROUP_NAME } from './Context';

export function useCallbackSync({
  id = uniqueId(),
  callback,
  group = DEFAULT_GROUP_NAME,
}: {
  id: string;
  callback: Function;
  group?: string;
}) {
  const callbackId = useRef(id);
  const { addCallback, removeCallback, sync } = useContext(
    CallbacksSyncContext
  );

  const handleRemoveCallback = useCallback(() => {
    removeCallback(callbackId.current);
  }, [removeCallback]);

  useEffect(() => {
    addCallback({ id: callbackId.current, callback, group });

    return () => handleRemoveCallback();
  }, [callback, addCallback, group, handleRemoveCallback]);

  return {
    sync: async () => {
      await sync(group);
    },
    removeCallback: handleRemoveCallback,
  };
}
