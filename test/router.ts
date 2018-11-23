import superagent from "superagent";
import { Router } from "../lib";

/**********************************************************************************************************************/
describe("Router", () => {
  test("should call the task functions one by one", async () => {
    const router = new Router();

    const array: number[] = [];

    router.common((request, response, next) => {
      array.push(1);
      return next();
    });
    router.common((request, response, next) => {
      array.push(2);
      return next();
    });
    router.common((request, response) => {
      array.push(3);
      expect(array).toEqual([1, 2, 3]);
      response.send();
    });

    await router.listen(0);

    const address = router.getListeningAddress();

    await superagent.get(`http://localhost:${address.port}/`);

    await router.close();
  });

  test("should give the share context object across tasks", async () => {
    const router = new Router();

    router.common((request, response, next, share) => {
      share.text = 1;
      return next();
    });
    router.common((request, response, next, share) => {
      share.text2 = 2;
      return next();
    });
    router.common((request, response, next, share) => {
      share.text3 = 3;
      expect(share).toStrictEqual({
        text: 1,
        text2: 2,
        text3: 3,
      });
      response.send();
    });

    await router.listen(0);

    const address = router.getListeningAddress();

    await superagent.get(`http://localhost:${address.port}/`);

    await router.close();
  });
});
