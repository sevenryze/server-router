import superagent from "superagent";
import { Router } from "../lib";

/**********************************************************************************************************************/
describe("Response", () => {
  describe("send()", () => {
    test("should sent json", async () => {
      const router = new Router();
      router.common((req, res) => {
        res.dd_send({
          json: "hello!"
        });
      });

      await router.listen(0);

      const address = router.getListeningAddress();

      const response = await superagent.get(`http://localhost:${address.port}`);

      expect(response.type).toBe("application/json");
      expect(response.body.json).toBe("hello!");

      await router.close();
    });

    test("should sent text", async () => {
      const router = new Router();
      router.common((req, res) => {
        res.dd_send("hello text!");
      });

      await router.listen(0);
      const address = router.getListeningAddress();

      const response = await superagent.get(`http://localhost:${address.port}`);

      expect(response.type).toBe("text/plain");
      expect(response.text).toBe("hello text!");

      await router.close();
    });

    test("should sent binary data", async () => {
      const router = new Router();
      router.common((req, res) => {
        res.dd_send(Buffer.from("sevenryze"));
      });
      await router.listen(0);
      const address = router.getListeningAddress();

      const response = await superagent.get(`http://localhost:${address.port}`);

      expect(response.type).toBe("application/octet-stream");

      await router.close();
    });

    test("should sent html", async () => {
      const router = new Router();
      router.common((_, res) => {
        res.dd_setHeader({ "content-type": "html" });
        res.dd_send("<p>hello</p>");
      });
      await router.listen(0);
      const address = router.getListeningAddress();

      const response = await superagent.get(`http://localhost:${address.port}`);

      expect(response.type).toBe("text/html");

      await router.close();
    });

    test("should allow call this method multi times", async () => {
      const router = new Router();
      router.common((_, res) => {
        res.dd_send({
          json: "hello 1!"
        });
        res.dd_send({
          json: "hello 2!"
        });
        res.dd_send({
          json: "hello 3!"
        });
      });
      await router.listen(0);
      const address = router.getListeningAddress();

      const response = await superagent.get(`http://localhost:${address.port}`);

      expect(response.type).toBe("application/json");
      expect(response.body.json).toBe("hello 1!");

      await router.close();
    });
  });

  describe("dd_setHeader", () => {
    test("should set the response headers", async () => {
      const router = new Router();
      router.common((_, res) => {
        res.dd_setHeader({
          "set-cookie": 123,
          "x-powered-by": "XmT"
        });
        res.dd_send();
      });
      await router.listen(0);
      const address = router.getListeningAddress();

      const response = await superagent.get(`http://localhost:${address.port}`);

      const headers = response.header;
      expect(headers["x-powered-by"]).toBe("XmT");
      expect(headers["set-cookie"][0]).toBe("123");

      await router.close();
    });

    test("should set content-type to `application/json; charset=utf-8` when send `json`", async () => {
      const router = new Router();
      router.common((_, res) => {
        res.dd_setHeader({
          "content-type": "json",
          "x-powered-by": "XmT"
        });
        res.dd_send();
      });
      await router.listen(0);
      const address = router.getListeningAddress();

      const response = await superagent.get(`http://localhost:${address.port}`);

      const headers = response.header;
      expect(headers["content-type"]).toBe("application/json; charset=utf-8");

      await router.close();
    });

    test("should set content-type to `text/html; charset=utf-8` when send `html`", async () => {
      const router = new Router();
      router.common((req, res) => {
        res.dd_setHeader({
          "content-type": "html"
        });
        res.dd_send();
      });
      await router.listen(0);
      const address = router.getListeningAddress();

      const response = await superagent.get(`http://localhost:${address.port}`);

      const headers = response.header;
      expect(headers["content-type"]).toBe("text/html; charset=utf-8");

      await router.close();
    });

    test("should set content-type to `text/plain; charset=utf-8` when send `text`", async () => {
      const router = new Router();
      router.common((_, res) => {
        res.dd_setHeader({
          "content-type": "text"
        });
        res.dd_send();
      });
      await router.listen(0);
      const address = router.getListeningAddress();

      const response = await superagent.get(`http://localhost:${address.port}`);

      const headers = response.header;
      expect(headers["content-type"]).toBe("text/plain; charset=utf-8");

      await router.close();
    });

    test("should set content-type to `application/octet-stream` when send `bin`", async () => {
      const router = new Router();
      router.common((req, res) => {
        res.dd_setHeader({
          "content-type": "bin"
        });
        res.dd_send();
      });
      await router.listen(0);
      const address = router.getListeningAddress();

      const response = await superagent.get(`http://localhost:${address.port}`);

      const headers = response.header;
      expect(headers["content-type"]).toBe("application/octet-stream");

      await router.close();
    });
  });

  describe("setStatus", () => {
    test("should set the response status code", async () => {
      const router = new Router();
      router.common((req, res) => {
        res.dd_setStatus(717).dd_send();
      });
      await router.listen(0);

      const address = router.getListeningAddress();

      const response = await superagent.get(`http://localhost:${address.port}`).ok(() => true);

      const statusCode = response.status;
      expect(statusCode).toBe(717);

      await router.close();
    });
  });
});
