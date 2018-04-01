// Import node.js libraries

// Import third-party libraries
import * as superagent from "superagent";

// Import own libraries
import { Router } from "../src/router";

/**********************************************************************************************************************/
describe("Router", () => {
  test("should call the task functions one by one", async () => {
    const router = new Router();

    let array: number[] = [];

    router.dde_common(function(request, response, next) {
      array.push(1);
      return next();
    });
    router.dde_common(function(request, response, next) {
      array.push(2);
      return next();
    });
    router.dde_common(function(request, response) {
      array.push(3);
      expect(array).toEqual([1, 2, 3]);
      response.dde_send();
    });

    await router.dde_listen(7777);

    await superagent.get("http://localhost:7777");

    await router.dde_close();
  });
});
