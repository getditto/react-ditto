import React from 'react';
import ReactDOM from 'react-dom';
import 'bootstrap/dist/css/bootstrap.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

import { IdentityDevelopment, Ditto } from '@dittolive/ditto';
import { DittoProvider } from '@dittolive/react-ditto';


const identity: IdentityDevelopment = {
  appName: "live.ditto.test",
  siteID: 234,
  type: "development",
};

const initOptions = {
  webAssemblyModule: "/ditto.wasm"
}

ReactDOM.render(
  <React.StrictMode>
    <DittoProvider setup={async () => {
      const ditto = new Ditto(identity)
      return ditto
    }} initOptions={initOptions}> 
      {({loading, error}) => {
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
