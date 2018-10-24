import superagent from "superagent";
import { Router } from "../lib/router";

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

    await router.dde_listen(0);

    let address = router.dde_getListeningAddress();

    await superagent.get(`http://localhost:${address.port}`);

    await router.dde_close();
  });
});
