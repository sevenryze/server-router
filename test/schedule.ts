import { ITask } from "../lib/interface";
import { schedule } from "../lib/schedule";

/**********************************************************************************************************************/
describe("schedule()", () => {
  test("should call the task functions one by one", done => {
    const array: number[] = [];

    const task1: ITask = (request: any, response: any, next: any) => {
      array.push(1);
      expect(request.url).toEqual("/");
      return next();
    };
    task1.strimPath = "/";

    const task2: ITask = (request: any, response: any, next: any) => {
      array.push(2);
      expect(request.url).toEqual("/12");
      return next();
    };
    task2.strimPath = "/12";

    const task3: ITask = (request: any, response: any) => {
      array.push(3);

      expect(array).toEqual([1, 2, 3]);
      expect(request.url).toEqual("/123");

      done();
    };
    task3.strimPath = "/123";

    schedule([task1, task2, task3], {} as any, {} as any);
  });
});
