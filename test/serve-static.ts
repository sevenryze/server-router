// Import node.js libraries
import { writeFileSync } from "fs";

// Import third party libraries
import * as superagent from "superagent";

// Import own libraries
import { Router, serveStatic } from "../index";

/**********************************************************************************************************************/
describe("Serve static files", () => {
  test("Should send file to client", async () => {
    // Write a sample file to filesystem.
    const textData = "this is test file!!!";
    writeFileSync(__dirname + "/test.txt", textData);

    const router = new Router();
    router.dde_common(serveStatic(__dirname));
    await router.dde_listen(7777);

    let response = await superagent.get("http://localhost:7777/test.txt");
    expect(response.text).toEqual(textData);
    await router.dde_close();
  });
});
