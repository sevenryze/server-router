import { readFileSync } from "fs";
import superagent from "superagent";
import { Router, serveStatic } from "../lib";

/**********************************************************************************************************************/
describe("serveStatic", () => {
  test("Should bypass no matched path", async () => {
    const router = new Router();

    router.common(serveStatic(__dirname + "/asset"));
    router.common((_, res) => {
      console.log(`Nothing matched`);
      res.dd_send();
    });

    await router.listen(0);

    const address = router.getListeningAddress();

    const response = await superagent.get(`http://localhost:${address.port}/something/haha?a=b`);
    await router.close();

    expect(response.text).toBeFalsy();
  });

  test("Should send file to client", async () => {
    const textData = readFileSync(__dirname + "/asset/test.txt", {
      encoding: "utf8"
    });

    const router = new Router();

    router.common(serveStatic(__dirname + "/asset"));

    await router.listen(0);

    const address = router.getListeningAddress();

    const response = await superagent.get(`http://localhost:${address.port}/test.txt`);
    await router.close();

    expect(response.text).toEqual(textData);
  });

  test("Should support multiple folders search", async () => {
    const router = new Router();

    const textData = readFileSync(__dirname + "/asset/test.txt", {
      encoding: "utf8"
    });

    router.common(serveStatic(__dirname + "/asset/folder1"));
    router.common(serveStatic(__dirname + "/asset/folder2"));

    await router.listen(0);

    const address = router.getListeningAddress();

    const response = await superagent.get(`http://localhost:${address.port}/test2.txt`);
    await router.close();

    expect(response.text).toEqual(textData);
  });

  test("Should nested path search", async () => {
    const router = new Router();

    const textData = readFileSync(__dirname + "/asset/test.txt", {
      encoding: "utf8"
    });

    router.common(serveStatic(__dirname + "/asset"));

    await router.listen(0);

    const address = router.getListeningAddress();

    const response = await superagent.get(`http://localhost:${address.port}/folder2/test2.txt`);
    const response2 = await superagent.get(`http://localhost:${address.port}/folder1/test1.txt`);
    const response3 = await superagent.get(`http://localhost:${address.port}/test.txt`);
    await router.close();

    expect(response.text).toEqual(textData);
    expect(response2.text).toEqual(textData);
    expect(response3.text).toEqual(textData);
  });

  test("Should virtual path prefix", async () => {
    const root = new Router();
    const staticFiles = new Router();

    const textData = readFileSync(__dirname + "/asset/test.txt", {
      encoding: "utf8"
    });

    root.mount("/static", staticFiles);
    staticFiles.common(serveStatic(__dirname + "/asset"));
    root.common((_, res) => {
      console.log(`Nothing matched`);
      res.dd_send();
    });

    await root.listen(0);

    const address = root.getListeningAddress();

    const response = await superagent.get(`http://localhost:${address.port}/static/folder2/test2.txt`);
    await root.close();

    expect(response.text).toEqual(textData);
  });
});
