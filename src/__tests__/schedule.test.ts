// Import node.js libraries

// Import third-party libraries

// Import own libraries
import { schedule } from "../schedule";

/**********************************************************************************************************************/
describe("schedule()", function() {
  test("should call the task functions one by one", function(done) {
    let array: number[] = [];

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

    schedule([task1, task2, task3], <any>{}, <any>{});
  });
});
