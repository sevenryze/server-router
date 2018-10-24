import { writeFileSync } from "fs";
import superagent from "superagent";
import { Router, serveStatic } from "../lib";

/**********************************************************************************************************************/
describe.only("Serve static files", () => {
  test.only("Should send file to client", async () => {
    // Write a sample file to filesystem.
    const textData = "this is test file!!!";
    writeFileSync(__dirname + "/test.txt", textData);

    const router = new Router();
    router.common(serveStatic(__dirname));
    await router.listen(0);

    const address = router.getListeningAddress();

    const response = await superagent.get(`http://localhost:${address.port}/test.txt`);
    expect(response.text).toEqual(textData);
    await router.close();
  });
});
