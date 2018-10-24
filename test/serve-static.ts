import { readFileSync } from "fs";
import path from "path";
import superagent from "superagent";
import { Router, serveStatic } from "../lib";

/**********************************************************************************************************************/
describe("serveStatic", () => {
  test("Should send file to client", async () => {
    const textData = readFileSync(__dirname + "/asset/test.txt", {
      encoding: "utf8"
    });

    const router = new Router();

    router.common(serveStatic(__dirname + "/asset"));

    await router.listen(0);

    const address = router.getListeningAddress();

    const response = await superagent.get(`http://localhost:${address.port}/test.txt`);

    expect(response.text).toEqual(textData);

    await router.close();
  });

  test("Should support multiple folders search", async () => {
    const router = new Router();

    const textData = readFileSync(__dirname + "/asset/test.txt", {
      encoding: "utf8"
    });

    router.common(serveStatic(__dirname + "/asset/folder1"));
    router.common(serveStatic(__dirname + "/asset/folder2"));

    router.common((_, res) => {
      res.dd_send();
    });

    await router.listen(0);

    const address = router.getListeningAddress();

    const response = await superagent.get(`http://localhost:${address.port}/test2.txt`);

    expect(response.text).toEqual(textData);

    await router.close();
  });

  test("Should nested path search", async () => {
    const router = new Router();

    const textData = readFileSync(__dirname + "/asset/test.txt", {
      encoding: "utf8"
    });

    router.common(serveStatic(__dirname + "/asset"));

    router.common((_, res) => {
      res.dd_send();
    });

    await router.listen(0);

    const address = router.getListeningAddress();

    let response = await superagent.get(`http://localhost:${address.port}/folder2/test2.txt`);
    expect(response.text).toEqual(textData);

    response = await superagent.get(`http://localhost:${address.port}/folder1/test1.txt`);
    expect(response.text).toEqual(textData);

    response = await superagent.get(`http://localhost:${address.port}/test.txt`);
    expect(response.text).toEqual(textData);

    await router.close();
  });

  test.only("Should vitual path prefix", async () => {
    const root = new Router();
    const router = new Router();

    const textData = readFileSync(__dirname + "/asset/test.txt", {
      encoding: "utf8"
    });

    root.mount("/static", router);
    router.common(serveStatic(__dirname + "/asset"));
    root.common((_, res) => {
      console.log(`Nothing matched`);
      res.dd_send();
    });

    await router.listen(0);

    const address = router.getListeningAddress();

    const response = await superagent.get(`http://localhost:${address.port}/static/folder2/test2.txt`);
    await router.close();

    expect(response.text).toEqual(textData);
  });
});
