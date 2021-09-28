# React Wrapper Library for Ditto

[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)
![example workflow](https://github.com/getditto/react-ditto/actions/workflows/ci.yml/badge.svg)

This is a React wrapper library for [Ditto](https://www.ditto.live).

Currently, this project works in a web browser environment. This project will soon have support for [NodeJS](https://nodejs.org/en/), and [Electron](https://www.electronjs.org/) and React Native environments. If you're interested in react native please send us an email at [contact@ditto.live](contact@ditto.live)

## Installation

1. Install this library with npm or yarn:

```
npm install @dittolive/ditto @dittolive/react-ditto
```

or with yarn

```
yarn add @dittolive/ditto @dittolive/react-ditto
```

2. At the top level of your react app, wrap it with the `DittoProvider` component like so:

```tsx
<DittoProvider setup={createDittoInstance}>
  {({ loading, error, ditto }) => {
    if (loading) return <span>Loading Ditto...</span>;
    if (error)
      return (
        <span>There was an error loading Ditto. Error: {error.toString()}</span>
      );
    if (ditto) return <App />;
  }}
</DittoProvider>
```

Ditto instances are created by providing an `Identity` object to the Ditto constructor. Identities can be of several different types,
and can be created manually as JS objects, or using the identity hooks (`useDevelopmentIdentity`, `useOnlineIdentity`), which also makes it easier to configure authentication for your
apps:

```ts
const { create, isAuthenticationRequired, authenticate } = useOnlineIdentity()

const createDittoInstance = () => {
  // Example of how to create an online instance with authentication enabled
  const dittoOnline = new Ditto(
    create({
      // If you're using the Ditto cloud this ID should be the app ID shown on your app settings page, on the portal.
      appID: uuidv4(),
      enableDittoCloudSync: true,
    }),
    '/path-online',
  )
  return dittoOnline
}
```

## Quick Start with `create-react-app`

This is a quick guide on using Ditto with `create-react-app` builds.

1. Install this library with npm or yarn

```
npm install @dittolive/ditto @dittolive/react-ditto
```

or with yarn

```
yarn add @dittolive/ditto @dittolive/react-ditto
```

2. In `./src/index.js` or if you're using typescript `./src/index.tsx` setup Ditto with the `DittoProvider` like so:

```tsx
import { DittoProvider, useDevelopmentIdentity } from '@dittolive/react-ditto'

/**
 * This configuration is optional for web browser-based react applications.
 * This tells the `DittoProvider` where it should load the .wasm file. If no path is provided (ie. initOptions is undefined),
 * the wasm will be loaded from our CDN.
 **/
const initOptions = {
  webAssemblyModule: "/ditto.wasm",
}

/** Example of a React root component setting up a single ditto instance that uses a development connection */
const RootComponent = () => {
  const { create } = useDevelopmentIdentity()
  
  return (
    <DittoProvider 
      setup={() => new Ditto(create({ appName: 'my app', siteID: 1234 }, '/foo'))} 
      /*initOptions={initOptions} */
    >
      {({ loading, error, ditto }) => {
        if (loading) return <p>Loading</p>;
        if (error) return <p>{error.message}</p>;
        return <App />;
      }}
    </DittoProvider>
  )
}



ReactDOM.render(
  <React.StrictMode>
    <RootComponent />
  </React.StrictMode>,
  document.getElementById("root")
);
```

3. In your `App` component, you can now use hooks like `useLiveQuery` to get your documents like so:

```tsx
import { usePendingCursorOperation, useMutations } from "@dittolive/react-ditto";

export default function App() {

  const { documents, ditto } = usePendingCursorOperation({
    collection: 'tasks',
  });

  const { updateByID, insert } = useMutations()

  return (
    <ul>
      {documents.map(doc => (
        <li key={doc._id}>
          {doc.body}
        </li>
      ))}
    </ul>
  )
}
```

## Working with Online apps

Using the [Portal](http://portal.ditto.live) you can create apps that sync to the cloud. These apps must be created with an `Online` identity type, for which the `useOnlineIdentity` hook can be used. The `useOnlineIdentity` hook help you create online Ditto instances that sync with the cloud, following these steps:

```tsx
/** Example of a React root component setting up a single ditto instance that uses a development connection */
const RootComponent = () => {
  const { create, isAuthenticationRequired, authenticate, tokenExpiresInSeconds } = useOnlineIdentity()
  
  return (
    <>
        <DittoProvider 
          setup={() => new Ditto(create({ appID: 'your-app-id' }, '/my-online-path'))} 
          /*initOptions={initOptions} */
        >
          {({ loading, error, ditto }) => {
            if (loading) return <p>Loading</p>;
            if (error) return <p>{error.message}</p>;
            return <App />;
          }}
        </DittoProvider>
        {isAuthenticationRequired && (
          <div>
            <div>You need to authenticate!</div>
            <button onClick={() => authenticate('some token', 'provider')}>Authenticate</button>
          </div>
        )}
    </>
  )
}

```

For Online apps, the `useOnlineIdentity` hook returns the following set of properties that can be used to manage authentication for your app:

* `create`: Creates an `OnlineIdentity` object preconfigured such that the hook can manage the authentication flow using the exposed `authenticate` function.
* `isAuthenticationRequired`: Will be true if your Ditto instance is requiring the current user to authenticate with the app. You can configure authentication webhooks on the [Portal](http://portal.ditto.live), from your app settings area, in order to provide your own set of validation services for your app.
* `tokenExpiresInSeconds`: Number of second in which your current token expires.
* `authenticate`: Function that can be used to make an authentication request for your app. Requires you to provide the token and the provider name (taken from the list of the configured token validation providers) that you want to validate the token against.

## Building this library and running tests

- **Building:** run `npm run build` or `yarn build`.
- **Run Tests:** run `npm test` or `yarn test`
- **Generating Documentation Website Files** run `npm run docs:generate`

## Running example apps.

Each example project is in it's own directory underneath the [./examples](./examples) directory.
