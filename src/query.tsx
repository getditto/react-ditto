import {
  Ditto,
  Document,
  Store,
  PendingCursorOperation,
  LiveQueryEvent,
  LiveQuery,
} from "@dittolive/ditto";
import { useEffect, useState } from "react";
import { useDitto } from "./ditto-context";

type UseLiveQueryParam = (store: Store) => PendingCursorOperation;

export function useLiveQuery<T = Document>(
  param: UseLiveQueryParam
): {
  ditto: Ditto,
  documents: T[];
  liveQueryEvent: LiveQueryEvent | undefined;
  liveQuery: LiveQuery | undefined;
} {
  const ditto = useDitto();

  const [documents, setDocuments] = useState<T[]>([]);
  const [liveQueryEvent, setLiveQueryEvent] = useState<
    LiveQueryEvent | undefined
  >();
  const [liveQuery, setLiveQuery] = useState<LiveQuery | undefined>();

  useEffect(() => {
    let liveQuery: LiveQuery;
    if (ditto) {
      liveQuery = param(ditto.store).observe((docs, event) => {
        setDocuments(docs as unknown as Array<T>);
        setLiveQueryEvent(event);
      });
      setLiveQuery(liveQuery);
    }

    return (): void => {
      liveQuery?.stop();
    };
  }, [ditto]);

  return {
    ditto,
    documents,
    liveQueryEvent,
    liveQuery,
  };
}

export function useLiveQueryLazy<T = Document>(): {
  ditto: Ditto,
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
  const [pendingCursor, setPendingCursor] = useState<
    PendingCursorOperation | undefined
  >();

  useEffect(() => {
    const l = pendingCursor?.observe((docs, event) => {
      setDocuments(docs as unknown as Array<T>);
      setLiveQueryEvent(event);
    });
    setLiveQuery(l);
    return (): void => {
      l?.stop();
    };
  }, [pendingCursor]);

  function start(param: UseLiveQueryParam): void {
    if (ditto) {
      setPendingCursor(param(ditto.store));
    }
  }

  function stop(): void {
    liveQuery?.stop();
  }

  return {
    ditto,
    documents,
    liveQueryEvent,
    stop,
    start,
  };
}
