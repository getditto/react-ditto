import React from "react";
import { IdentityDevelopment } from "@dittolive/ditto";
import { DittoProvider } from "@dittolive/react-ditto";
import Tasks from "./Tasks";

function App() {  
  const identity: IdentityDevelopment = {
    appName: "live.ditto.test",
    siteID: 234,
    type: "development",
  };
  
  const initOptions = {
    webAssemblyModule: "/ditto.wasm"
  }

  return (
    <DittoProvider identity={identity} path="/foo" initOptions={initOptions}> 
      {({loading, error, ditto}) => {
        if (loading) return <h1>Loading</h1>
        if (error)  return <h1>{error.message}</h1>
        return <Tasks/>
      }}
    </DittoProvider>
  );
}

export default App;
