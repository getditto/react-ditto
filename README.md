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
<DittoProvider>
  {({loading, error, ditto}) => {
    if (loading) return <span>Loading Ditto...</span>
    if (error) return <span>There was an error loading Ditto. Error: {error.toString()}</span>
    if (ditto) return <App/>
  }}
</DittoProvider>
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
import { Identity } from '@dittolive/ditto';
import { DittoProvider } from '@dittolive/react-ditto';


const identity: Identity = {
  appName: "live.ditto.test",
  siteID: 234,
  type: "development",
};

/**
   * This step is required only for web browser-based react applications.
   * This tells the `DittoProvider` where it should load the .wasm file. This should match the location of the postinstall script
   **/
const initOptions = {
  webAssemblyModule: "/ditto.wasm"
}

ReactDOM.render(
  <React.StrictMode>
    <DittoProvider identity={identity} path="/foo" initOptions={initOptions}> 
      {({loading, error, ditto}) => {
        if (loading) return <p>Loading</p>
        if (error)  return <p>{error.message}</p>
        return <App/>
      }}
    </DittoProvider>
  </React.StrictMode>,
  document.getElementById('root')
);
```

3. In your `App` component, you can now use hooks like `useLiveQuery` to get your documents like so:

```tsx
import { usePendingCursorOperation } from "@dittolive/react-ditto";

export default function App() {
  
  const [isCompleted, setIsCompleted] = useState(false)
  
  const { documents, ditto } = usePendingCursorOperation({
    collection: 'tasks',
    query: 'isCompleted == $args.isCompleted'
    args: { isCompleted: isCompleted}
  });
  
  return (
    <ul>
      {documents.map(doc => (
        <li key={doc.value["_id"]}>
          {doc.value["body"]}
        </li>
      ))}
    </ul>
    <button onClick={() => {
      setIsCompleted(!isCompleted)
    }} >Toggle</button>
  )
}
```

## Building this library and running tests

* __Building:__ run `npm run build` or `yarn build`. 
* __Run Tests:__ run `npm test` or `yarn test`
* __Generating Documentation Website Files__ run `npm run docs:generate`

## Running example apps.

Each example project is in it's own directory underneath the [./examples](./examples) directory.
