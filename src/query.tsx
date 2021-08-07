import {
  Ditto,
  Store,
  PendingCursorOperation,
  LiveQueryEvent,
  LiveQuery,
} from '@dittolive/ditto';
import { useEffect, useState } from 'react';
import { useDitto } from './ditto-context';

type UseLiveQueryParam = (store: Store) => PendingCursorOperation;

export function useLiveQuery<T = Document>(
  param: UseLiveQueryParam
): {
  documents: T[];
  liveQueryEvent: LiveQueryEvent | undefined;
  liveQuery: LiveQuery | undefined;
} {
  const ditto: Ditto = useDitto();

  const [documents, setDocuments] = useState<T[]>([]);
  const [liveQueryEvent, setLiveQueryEvent] = useState<
    LiveQueryEvent | undefined
  >();
  const [liveQuery, setLiveQuery] = useState<LiveQuery | undefined>();

  useEffect(() => {
    const l = param(ditto.store).observe((docs, event) => {
      setDocuments((docs as unknown) as Array<T>);
      setLiveQueryEvent(event);
    });
    setLiveQuery(l);
    return (): void => {
      l.stop();
    };
  }, [ditto.store, param]);

  return {
    documents,
    liveQueryEvent,
    liveQuery,
  };
}

export function useLiveQueryLazy<T = Document>(): {
  documents: T[];
  liveQueryEvent?: LiveQueryEvent | undefined;
  stop: () => void;
  start: (param: UseLiveQueryParam) => void;
} {
  const ditto = useDitto();

  const [documents, setDocuments] = useState<T[]>([]);
  const [liveQueryEvent, setLiveQueryEvent] = useState<
    LiveQueryEvent | undefined
  >();
  const [liveQuery, setLiveQuery] = useState<LiveQuery | undefined>();
  const [pendingCursor, setPendingCursor] = useState<PendingCursorOperation | undefined>();

  useEffect(() => {
    const l = pendingCursor?.observe((docs, event) => {
      setDocuments((docs as unknown) as Array<T>);
      setLiveQueryEvent(event);
    });
    setLiveQuery(l);
    return (): void => {
      l?.stop();
    };
  }, [pendingCursor]);

  function start(param: UseLiveQueryParam): void {
    setPendingCursor(param(ditto.store))
  }
  
  function stop(): void {
    liveQuery?.stop();
  }

  return {
    documents,
    liveQueryEvent,
    stop,
    start,
  };
}
