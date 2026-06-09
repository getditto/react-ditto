# React + Ditto v5 Example (Vite)

A minimal task list app showing how to use `@dittolive/react-ditto` with the
Ditto v5 SDK and DQL. It demonstrates:

- Opening Ditto instances with `Ditto.open(new DittoConfig(...))` for both an
  offline (`smallPeersOnly`) instance and an online (`server`) instance.
- Authenticating a server connection via `ditto.auth.setExpirationHandler` /
  `ditto.auth.login`.
- Reading data with `useQuery` and mutating it with `useExecuteQuery`.

This project was bootstrapped with [Vite](https://vite.dev/).

## Configuration

The offline ("Development") instance works out of the box. To use the online
("Online") instance, open `src/AppContainer.tsx` and replace the
`REPLACE_ME_WITH_YOUR_*` placeholders with the database ID, connection URL, and
playground token from your database's settings page in the
[Ditto portal](https://portal.ditto.live). Copy the whole connection URL from
"Connect via SDK → URL".

## Available Scripts

In the project directory, you can run:

### `npm run dev`

Runs the app in development mode. Open
[http://localhost:3000](http://localhost:3000) to view it in the browser. The
page reloads on edits.

### `npm test`

Runs the test suite once with [Vitest](https://vitest.dev/). Use
`npm run test:watch` for watch mode.

### `npm run build`

Builds the app for production to the `dist` folder.

### `npm run type-check`

Runs the TypeScript type checker.

### `npm run lint`

Runs `eslint` to find and fix any configured linting issues.

## Learn More

- [Ditto documentation](https://docs.ditto.live)
- [DQL reference](https://docs.ditto.live/dql)
- [Vite documentation](https://vite.dev/guide/)
