# React Ditto Example with Vite and TypeScript

This example demonstrates how to use Ditto with React, TypeScript, and Vite.

> [!NOTE]
> At least Ditto v4.10.0 is required for this example to work.

## Ditto Authentication Setup

For detailed information about Ditto authentication, refer to the [Ditto Authentication Documentation](https://docs.ditto.live/key-concepts/authentication-and-authorization).

### Configuring the Application

To use Online mode with Ditto Cloud authentication, you need to configure the following constants in `src/AppContainer.tsx`:

1. **DITTO_APP_ID**: Your Ditto application ID
2. **DITTO_AUTH_URL**: The authentication endpoint URL
3. **DITTO_WEBSOCKET_URL**: The WebSocket endpoint URL

All these values can be found in your Ditto portal on your app's settings page.

### Using Online Mode

When you select "Online" from the identity dropdown in the application:

1. An authentication panel will appear at the bottom of the screen
2. Enter the following credentials:
   - **Provider**: The authentication provider name configured in your Ditto app (e.g., "development", "jwt", etc.)
   - **Token**: The authentication token or credentials for your chosen provider

## Available Scripts

**Note: on newer versions of Node, you may run into `ERR_OSSL_EVP_UNSUPPORTED` errors. You may pass the command-line option of `--openssl-legacy-provider` to work around this. Refer to [Node v17 release notes](https://nodejs.org/es/blog/release/v17.0.0/#openssl-3-0).**

In the project directory, you can run:

### `yarn dev`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `yarn test`

Launches the test runner in the interactive watch mode.

### `yarn build`

Builds the app for production to the `dist` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

### `yarn type-check`

Runs the TypeScript type checker

### `yarn lint`

Runs `eslint` to find and fix any configured linting issues

## Learn More

To learn about Ditto, check out the [Ditto documentation](https://docs.ditto.live/).

You can learn more in the [Vite documentation](https://vite.dev/guide/).

To learn React, check out the [React documentation](https://react.dev/).
