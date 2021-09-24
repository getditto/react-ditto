import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import { DittoProvider } from "@dittolive/react-ditto";
import { Ditto, Identity } from "@dittolive/ditto";

const identity: Identity = {
  appName: "live.ditto.example",
  siteID: 1234,
  type: "development",
};

ReactDOM.render(
  <React.StrictMode>
    <DittoProvider
      setup={() => {
        const ditto = new Ditto(identity, '/foo');
        return ditto;
      }}
    >
      {({ loading, error }) => {
        if (loading) {
          return <span>Loading</span>
        }
        if (error) {
          return <span>{error.toString()}</span>
        }
        return <App />;
      }}
    </DittoProvider>
  </React.StrictMode>,
  document.getElementById("root")
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
