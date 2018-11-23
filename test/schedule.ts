import { ITask } from "../lib";
import { schedule } from "../lib/schedule";

/**********************************************************************************************************************/
describe("schedule()", () => {
  test("should call the task functions one by one", done => {
    const array: number[] = [];

    const task1: ITask = (request, response, next) => {
      array.push(1);
      expect(request.trimmedUrl).toEqual("/");
      return next();
    };
    task1.strimPath = "/";

    const task2: ITask = (request, response, next) => {
      array.push(2);
      expect(request.trimmedUrl).toEqual("/12");
      return next();
    };
    task2.strimPath = "/12";

    const task3: ITask = (request, response) => {
      array.push(3);

      expect(array).toEqual([1, 2, 3]);
      expect(request.trimmedUrl).toEqual("/123");

      done();
    };
    task3.strimPath = "/123";

    schedule([task1, task2, task3], {} as any, {} as any);
  });
});
