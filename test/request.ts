// Import node.js libraries

// Import third party libraries
import * as superagent from "superagent";

// Import own libraries
import { Router } from "../src/router";

/**********************************************************************************************************************/
describe("Request", function() {
  describe("dde_getIp()", function() {
    test("应该返回客户端IP", async () => {
      const router = new Router();

      router.dde_common((request, response) => {
        let ip = request.dde_getIp();

        expect(ip).toEqual("::ffff:127.0.0.1");

        response.dde_send();
      });

      await router.dde_listen(7777);

      await superagent.get("http://localhost:7777");

      await router.dde_close();
    });
  });
});
