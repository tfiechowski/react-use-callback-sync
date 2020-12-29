// eslint-disable-next-line
import { fireEvent, render } from '@testing-library/react';
import { renderHook } from '@testing-library/react-hooks';
import * as React from 'react';
import {
  CallbacksSyncContext,
  CallbacksSyncProvider,
  useCallbacksSync,
} from '../src';
import { ICallbacks } from '../src/Context';

function CallbacksRenderer({
  id,
  callback,
}: {
  id: string;
  callback: Function;
}) {
  useCallbacksSync({ id, callback });

  return <div />;
}

function ContextAccessor() {
  const [callbackToRemove, setCallbackToRemove] = React.useState<string>('');
  const { sync, removeCallback } = React.useContext(CallbacksSyncContext);

  function handleRemoveCallback() {
    removeCallback(callbackToRemove);
  }

  return (
    <div>
      <button data-testid="sync" onClick={sync} />
      <button data-testid="remove" onClick={handleRemoveCallback} />
      <input
        type="text"
        data-testid="callback-remove-id"
        value={callbackToRemove}
        onChange={event => setCallbackToRemove(event.target.value)}
      />
    </div>
  );
}

function Wrapper({ callbacks }: { callbacks: ICallbacks }) {
  return (
    <CallbacksSyncProvider>
      {Object.entries(callbacks).map(([id, callback]) => (
        <CallbacksRenderer key={id} id={id} callback={callback} />
      ))}

      <ContextAccessor />
    </CallbacksSyncProvider>
  );
}

describe('useCallbackSync', () => {
  it('calls callback on sync', async () => {
    const callback = jest.fn();
    const { result } = renderHook(() =>
      useCallbacksSync({ id: '1', callback: callback })
    );

    expect(callback).not.toHaveBeenCalled();

    await result.current();

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('doesnt break on empty callback list', async () => {
    render(<Wrapper callbacks={{}} />);
  });

  it('syncs callback between two components', async () => {
    const callback1 = jest.fn();
    const callback2 = jest.fn();
    const callbacks = {
      '1': callback1,
      '2': callback2,
    };
    const { getByTestId } = render(<Wrapper callbacks={callbacks} />);

    expect(callback1).not.toHaveBeenCalled();
    expect(callback2).not.toHaveBeenCalled();

    fireEvent.click(getByTestId('sync'));

    expect(callback1).toHaveBeenCalled();
    expect(callback2).toHaveBeenCalled();
  });

  it('not calling removed callback', async () => {
    const callback1 = jest.fn();
    const callback2 = jest.fn();
    const callbacks = {
      '1': callback1,
      '2': callback2,
    };
    const { getByTestId } = render(<Wrapper callbacks={callbacks} />);
    const input = getByTestId('callback-remove-id');

    expect(callback1).not.toHaveBeenCalled();
    expect(callback2).not.toHaveBeenCalled();

    fireEvent.click(getByTestId('sync'));

    expect(callback1).toHaveBeenCalledTimes(1);
    expect(callback2).toHaveBeenCalledTimes(1);

    fireEvent.change(input, { target: { value: '2' } });
    fireEvent.click(getByTestId('remove'));
    fireEvent.click(getByTestId('sync'));

    expect(callback1).toHaveBeenCalledTimes(2);
    expect(callback2).toHaveBeenCalledTimes(1);
  });
});
