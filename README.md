# React Wrapper Library for Ditto

[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)
![example workflow](https://github.com/getditto/react-ditto/actions/workflows/ci.yml/badge.svg)

This is a React wrapper library for [Ditto](https://www.ditto.live).

Currently, this project works in web browsers, Node.JS and Electron environments.

If you have questions about this project or require any assistance, please get in touch via [support@ditto.com](mailto:support@ditto.com).

> **Ditto SDK v5**
>
> This library targets the **Ditto v5 SDK** (`@dittolive/ditto@^5.0.0`) and uses
> [DQL (Ditto Query Language)](https://docs.ditto.live/dql) exclusively. The v4
> query-builder hooks (`usePendingCursorOperation`, `useMutations`, etc.) and the
> identity hooks (`useOnlinePlaygroundIdentity`, etc.) have been removed. See the
> [Ditto v5 migration guide](https://docs.ditto.live/sdk/latest/migration-guides/web-js-v4)
> for the underlying SDK changes.

## Installation

Install this library alongside the Ditto SDK with npm or yarn:

```
npm install @dittolive/ditto @dittolive/react-ditto
```

```
yarn add @dittolive/ditto @dittolive/react-ditto
```

At the top level of your React app, wrap it with one of the context providers,
`DittoProvider` or `DittoLazyProvider`:

```tsx
<DittoProvider setup={createDittoInstance}>
  {({ loading, error }) => {
    if (loading) return <span>Loading Ditto...</span>
    if (error)
      return (
        <span>There was an error loading Ditto. Error: {error.toString()}</span>
      )
    return <App />
  }}
</DittoProvider>
```

At this point you're ready to build your Ditto app using the hooks provided by
the library. Read on to learn how to choose between `DittoProvider` and
`DittoLazyProvider`, how to open Ditto instances with the v5 API, and how to use
the `useQuery` and `useExecuteQuery` hooks.

## Choosing a Provider

The library includes two context providers that initialize the Ditto context
for your app: `DittoProvider` and `DittoLazyProvider`.

`DittoProvider` should be used when the set of Ditto instances used by your app
is known beforehand and can be created when the app is bootstrapped. In all
other cases, `DittoLazyProvider` can be used to lazily create Ditto instances
on demand when a child of the provider first requires one.

The API for both providers is identical except for the `setup` prop, which
returns `Ditto | Ditto[] | Promise<Ditto | Ditto[]>` for `DittoProvider` and
`Promise<Ditto | null>` for `DittoLazyProvider`.

Choosing one provider over the other has no effect on the remaining hooks — they
are used in exactly the same way regardless of provider.

### DittoProvider Example

```tsx
import { Ditto, DittoConfig } from '@dittolive/ditto'

const createDittoInstance = async () => {
  const ditto = await Ditto.open(
    new DittoConfig('my-database-id', { mode: 'smallPeersOnly' }, 'some-path'),
  )
  ditto.sync.start()
  return ditto
}

;<DittoProvider setup={createDittoInstance}>
  {({ loading, error }) => {
    if (loading) return <span>Loading Ditto...</span>
    if (error)
      return (
        <span>There was an error loading Ditto. Error: {error.toString()}</span>
      )
    return <App />
  }}
</DittoProvider>
```

### DittoLazyProvider Example

```tsx
import { Ditto, DittoConfig } from '@dittolive/ditto'

const createDittoInstance = async (path: string) => {
  const ditto = await Ditto.open(
    new DittoConfig('my-database-id', { mode: 'smallPeersOnly' }, path),
  )
  ditto.sync.start()
  return ditto
}

;<DittoLazyProvider setup={createDittoInstance}>
  {({ loading, error }) => {
    if (loading) return <span>Loading Ditto...</span>
    if (error)
      return (
        <span>There was an error loading Ditto. Error: {error.toString()}</span>
      )
    return <App />
  }}
</DittoLazyProvider>
```

When multiple instances are registered, hooks select one via the
`persistenceDirectory` option, which matches the persistence directory you set
on the instance's `DittoConfig`. When omitted, the first registered instance is
used.

## Opening Ditto instances

In v5, a Ditto instance is opened with `Ditto.open(config)` (async) or
`Ditto.openSync(config)`, where the config is a `DittoConfig` describing the
database ID, the connection mode, and an optional persistence directory.

### Offline / peer-to-peer

```ts
import { Ditto, DittoConfig } from '@dittolive/ditto'

const ditto = await Ditto.open(
  new DittoConfig('my-database-id', { mode: 'smallPeersOnly' }, '/path'),
)
ditto.sync.start()
```

### Online (connected to a Ditto server / Big Peer)

Server connections require an authentication expiration handler to be set
before sync is started — `ditto.sync.start()` throws otherwise. Copy the whole
connection URL from the Ditto portal (Connect via SDK → **URL**); do not build
it from the database ID.

```ts
import { Authenticator, Ditto, DittoConfig } from '@dittolive/ditto'

const ditto = await Ditto.open(
  new DittoConfig(
    'my-database-id',
    { mode: 'server', url: 'REPLACE_ME_WITH_YOUR_URL' },
    '/path',
  ),
)

await ditto.auth.setExpirationHandler(async (ditto) => {
  await ditto.auth.login('your-token', Authenticator.DEVELOPMENT_PROVIDER)
})

ditto.sync.start()
```

## Querying with `useQuery`

`useQuery` continuously fetches the results of a non-mutating DQL query by
registering a store observer and (unless `localOnly` is set) a sync
subscription. It returns the current items, loading state, and any error.

```tsx
import { useQuery } from '@dittolive/react-ditto'

type Task = { _id: string; body: string; isCompleted: boolean }

export default function App() {
  const { items, isLoading, error } = useQuery<Task>(
    'SELECT * FROM tasks WHERE isCompleted = :isCompleted',
    { queryArguments: { isCompleted: false } },
  )

  if (isLoading) return <p>Loading…</p>
  if (error) return <p>Error: {String(error)}</p>

  return (
    <ul>
      {items.map((task) => (
        <li key={task.value._id}>{task.value.body}</li>
      ))}
    </ul>
  )
}
```

## Mutating and on-demand queries with `useExecuteQuery`

`useExecuteQuery` returns an execution function that runs a DQL query on demand.
Use it for mutations (insert/update/delete) and ad-hoc queries triggered by user
actions. It does not set up a sync subscription, so pair mutations with a
`useQuery` for the same collection if you want them synced and observed.

```tsx
import { useExecuteQuery } from '@dittolive/react-ditto'

export default function AddTask() {
  const [insertTask] = useExecuteQuery<void, { value: { body: string } }>(
    'INSERT INTO tasks DOCUMENTS (:value)',
  )

  return (
    <button onClick={() => insertTask({ value: { body: 'Buy milk' } })}>
      Add Task
    </button>
  )
}
```

Query arguments can be supplied when setting up the hook and/or when calling the
execution function; when both are provided they are shallow-merged, with the
execution function's arguments taking precedence.

## Quick Start with `vite`

1. Install the library:

```
npm install @dittolive/ditto @dittolive/react-ditto
```

2. In `./src/index.tsx`, set up Ditto with the `DittoProvider`:

```tsx
// ... other imports from vite above
import { Ditto, DittoConfig } from '@dittolive/ditto'
import { DittoProvider } from '@dittolive/react-ditto'

/**
 * This configuration is optional for web browser-based React applications. It
 * tells the `DittoProvider` where to load the .wasm file. If no path is provided
 * (ie. initOptions is undefined), the wasm is loaded from our CDN. If you enable
 * this, make sure to serve `ditto.wasm` with the correct MIME type and CORS
 * headers. See
 * https://www.npmjs.com/package/@dittolive/ditto#browser-environments for
 * details.
 **/
const initOptions = {
  webAssemblyModule: '/ditto.wasm',
}

const RootComponent = () => (
  <DittoProvider
    setup={async () => {
      // Create a database at https://portal.ditto.live/ and copy its database
      // ID and connection URL from the settings page.
      const ditto = await Ditto.open(
        new DittoConfig(
          'your-database-id',
          { mode: 'smallPeersOnly' },
          'testing',
        ),
      )
      ditto.sync.start()
      return ditto
    }}
    /* initOptions={initOptions} */
  >
    {({ loading, error }) => {
      if (loading) return <p>Loading</p>
      if (error) return <p>{error.message}</p>
      return <App />
    }}
  </DittoProvider>
)

const root = ReactDOM.createRoot(document.getElementById('root'))
root.render(
  <React.StrictMode>
    <RootComponent />
  </React.StrictMode>,
)
```

3. In your `App` component, use `useQuery` to observe documents and
   `useExecuteQuery` to mutate them — see the examples above and the full
   [vite example app](./examples/vite-typescript-example).

## Working with online apps

Using the [Portal](http://portal.ditto.live) you can create apps that sync with
a Ditto server (Big Peer). Configure the instance with a `{ mode: 'server', url }`
connection and authenticate through `ditto.auth`:

- Set an expiration handler with `ditto.auth.setExpirationHandler(handler)`. The
  handler receives the Ditto instance and is invoked whenever (re)authentication
  is required.
- Inside the handler, call `ditto.auth.login(token, provider)`. Use
  `Authenticator.DEVELOPMENT_PROVIDER` for playground/development tokens, or your
  own provider string when you have configured authentication webhooks on the
  Portal.
- The expiration handler must be set before calling `ditto.sync.start()` for
  server connections.

The current authentication state is available via `ditto.auth.status`
(`{ isAuthenticated, userID }`).

## Building this library and running tests

- **Building:** run `npm run build`.
- **Type-check:** run `npm run types`.
- **Lint:** run `npm run lint`.
- **Run tests:** run `npm test`. The suite runs in headless Chrome via Karma and
  exercises the real Ditto WASM build.

## Running example apps

Each example project is in its own directory underneath the
[./examples](./examples) directory.
