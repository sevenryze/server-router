import superagent from "superagent";
import { Router } from "../lib";

/**********************************************************************************************************************/
describe("Request", () => {
  describe("#ip", () => {
    test("应该返回客户端IP", async () => {
      const router = new Router();

      router.common((request, response) => {
        const ip = request.ip;

        expect(ip).toEqual("::ffff:127.0.0.1");

        response.send();
      });

      await router.listen(0);

      const address = router.getListeningAddress();

      await superagent.get(`http://localhost:${address.port}`);

      await router.close();
    });
  });
});
