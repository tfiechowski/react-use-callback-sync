// eslint-disable-next-line
import { fireEvent, render } from '@testing-library/react';
import { renderHook } from '@testing-library/react-hooks';
import * as React from 'react';
import { CallbackSyncProvider, useCallbackSync } from '../src';
import { ICallbacksTree } from '../src/Context';

function CallbacksRenderer({
  id,
  callback,
  group,
  immediate,
}: {
  id: string;
  callback: Function;
  group: string;
  immediate: boolean;
}) {
  const { removeCallback, sync } = useCallbackSync({ id, callback, group });

  return (
    <div>
      <button
        data-testid={`sync-${group}-${id}`}
        onClick={() => sync(immediate)}
      />
      <button
        data-testid={`remove-${group}-${id}`}
        onClick={() => removeCallback()}
      />
    </div>
  );
}

function Wrapper({
  callbacksTree,
  immediate = true,
}: {
  callbacksTree: ICallbacksTree;
  immediate?: boolean;
}) {
  return (
    <CallbackSyncProvider>
      {Object.entries(callbacksTree).map(([group, callbacks]) =>
        Object.entries(callbacks as Object).map(([id, callback]) => (
          <CallbacksRenderer
            key={id}
            id={id}
            group={group}
            callback={callback}
            immediate={immediate}
          />
        ))
      )}
    </CallbackSyncProvider>
  );
}

describe('useCallbackSync', () => {
  it.each`
    group        | name
    ${undefined} | ${'default'}
    ${'custom'}  | ${'custom'}
  `('calls callback on sync for $name group', async ({ group }) => {
    const callback = jest.fn();
    const wrapper = ({ children }: { children: any }) => (
      <CallbackSyncProvider>{children}</CallbackSyncProvider>
    );
    const { result } = renderHook(
      () => useCallbackSync({ id: '1', callback, group }),
      { wrapper }
    );

    expect(callback).not.toHaveBeenCalled();

    await result.current.sync();

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('calls callback on sync', async () => {
    const callback = jest.fn();
    const wrapper = ({ children }: { children: any }) => (
      <CallbackSyncProvider>{children}</CallbackSyncProvider>
    );
    const { result } = renderHook(
      () => useCallbackSync({ id: '1', callback }),
      { wrapper }
    );

    expect(callback).not.toHaveBeenCalled();

    await result.current.sync();

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('should wait for callback to finish before syncing the group', async () => {
    jest.useFakeTimers();
    const callback1 = jest.fn();
    const callback1B = jest.fn();
    const callback2 = jest.fn();

    const handleWaiter = () => {
      return new Promise(resolve => {
        callback1();

        setTimeout(() => {
          callback1B();
          resolve(null);
        }, 3000);
      });
    };
    const callbacks = {
      default: {
        '1': handleWaiter,
        '2': callback2,
      },
    };
    const { getByTestId } = render(
      <Wrapper immediate={false} callbacksTree={callbacks} />
    );

    expect(callback1).not.toHaveBeenCalled();
    expect(callback1B).not.toHaveBeenCalled();
    expect(callback2).not.toHaveBeenCalled();

    await fireEvent.click(getByTestId('sync-default-1'));

    expect(callback1).toHaveBeenCalledTimes(1);
    expect(callback1B).not.toHaveBeenCalled();
    expect(callback2).not.toHaveBeenCalled();

    await jest.advanceTimersByTime(4000);

    expect(callback1).toHaveBeenCalledTimes(1);
    expect(callback1B).toHaveBeenCalledTimes(1);
    expect(callback2).toHaveBeenCalledTimes(1);
  });

  it('doesnt break on empty callback list', async () => {
    render(<Wrapper callbacksTree={{}} />);
  });

  it('syncs callback between two components', async () => {
    const callback1 = jest.fn();
    const callback2 = jest.fn();
    const callbacks = {
      default: {
        '1': callback1,
        '2': callback2,
      },
    };
    const { getByTestId } = render(<Wrapper callbacksTree={callbacks} />);

    expect(callback1).not.toHaveBeenCalled();
    expect(callback2).not.toHaveBeenCalled();

    await fireEvent.click(getByTestId('sync-default-1'));

    expect(callback1).toHaveBeenCalled();
    expect(callback2).toHaveBeenCalled();
  });

  it('not calling removed callback', async () => {
    const callback1 = jest.fn();
    const callback2 = jest.fn();
    const callbacks = {
      default: {
        '1': callback1,
        '2': callback2,
      },
    };
    const { getByTestId } = render(<Wrapper callbacksTree={callbacks} />);

    expect(callback1).not.toHaveBeenCalled();
    expect(callback2).not.toHaveBeenCalled();

    await fireEvent.click(getByTestId('sync-default-1'));

    expect(callback1).toHaveBeenCalledTimes(1);
    expect(callback2).toHaveBeenCalledTimes(1);

    await fireEvent.click(getByTestId('remove-default-2'));
    await fireEvent.click(getByTestId('sync-default-1'));

    expect(callback1).toHaveBeenCalledTimes(2);
    expect(callback2).toHaveBeenCalledTimes(1);
  });

  it('only calls callback from specified group', () => {
    const callback1 = jest.fn();
    const callback2 = jest.fn();
    const callbacks = {
      default: {
        '1': callback1,
      },
      extra: {
        '2': callback2,
      },
    };
    const { getByTestId } = render(<Wrapper callbacksTree={callbacks} />);

    expect(callback1).not.toHaveBeenCalled();
    expect(callback2).not.toHaveBeenCalled();

    fireEvent.click(getByTestId('sync-default-1'));

    expect(callback1).toHaveBeenCalledTimes(1);
    expect(callback2).toHaveBeenCalledTimes(0);

    fireEvent.click(getByTestId('sync-extra-2'));

    expect(callback1).toHaveBeenCalledTimes(1);
    expect(callback2).toHaveBeenCalledTimes(1);
  });
});
