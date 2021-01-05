import { useCallback, useContext, useEffect, useRef } from 'react';
import { CallbackSyncContext, DEFAULT_GROUP_NAME } from './Context';

function uniqueId() {
  return Math.random()
    .toString(36)
    .substr(2, 9);
}

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
  const { addCallback, removeCallback, sync } = useContext(CallbackSyncContext);

  const handleRemoveCallback = useCallback(() => {
    removeCallback(callbackId.current);
  }, [removeCallback]);

  useEffect(() => {
    addCallback({ id: callbackId.current, callback, group });

    return () => handleRemoveCallback();
  }, [callback, addCallback, group, handleRemoveCallback]);

  return {
    sync: async (immediate: boolean = false) => {
      if (immediate) {
        sync({ group });
      } else {
        await callback();
        sync({ group, omitIds: [callbackId.current] });
      }
    },
    removeCallback: handleRemoveCallback,
  };
}
