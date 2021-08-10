import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

import { DittoProvider } from '@dittolive/react-ditto';

const identity = {
  appName: "live.ditto.test",
  siteID: 234,
  type: "development",
};

const initOptions = {
  webAssemblyModule: "/ditto.wasm"
}

ReactDOM.render(
  <React.StrictMode>
    <DittoProvider identity={identity} path="/foo" initOptions={initOptions}> 
      {({loading, error, ditto}) => {
        if (loading) return <h1>Loading</h1>
        if (error)  return <h1>{error.message}</h1>
        return <App/>
      }}
    </DittoProvider>
  </React.StrictMode>,
  document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
