import { schedule } from "../lib/schedule";

/**********************************************************************************************************************/
describe("schedule()", () => {
  test("should call the task functions one by one", done => {
    const array: number[] = [];

    function task1(request: any, response: any, next: any) {
      array.push(1);
      return next();
    }

    function task2(request: any, response: any, next: any) {
      array.push(2);
      return next();
    }

    function task3(request: any, response: any) {
      array.push(3);

      expect(array).toEqual([1, 2, 3]);

      done();
    }

    schedule([task1, task2, task3], {} as any, {} as any);
  });
});
