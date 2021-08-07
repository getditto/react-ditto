import { assert } from "chai";
import { add } from "./foo";
import { Ditto, init, IdentityDevelopment } from "@dittolive/ditto"

describe("Foo", () => {
  it("should add", async () => {
    await init({
      webAssemblyModule: "/base/node_modules/@dittolive/ditto/web/ditto.wasm"
    })
    const identity: IdentityDevelopment = {
      appName: "live.ditto.test",
      siteID: 33,
      type: "development"
    }
    const ditto = new Ditto(identity, "/foo")
    const id = await ditto.store.collection('tasks').insert({
      value: {
        "name": "foo"
      }
    })
    const doc = await ditto.store.collection('tasks').findByID(id).exec()
    assert.isNotNull(doc);
  });
});
