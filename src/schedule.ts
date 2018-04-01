// Import node.js libraries

// Import third part libraries

// Import own libraries
import { Task, Request, Response } from "./router";

/**********************************************************************************************************************/
/**
 * Actually run the matching tasks.
 *
 * @param {Task[]} runList - the tasks waiting for execution.
 * @param {Request} request - the manicured request object.
 * @param {Response} response - the manicured response object.
 */
export function schedule(
  runList: Task[],
  request: Request,
  response: Response
): void {
  if (!Array.isArray(runList) || runList.length < 1 || !request || !response) {
    return;
  }

  let nextTaskIndex: number = 0;

  (function nextTask() {
    if (nextTaskIndex < runList.length) {
      process.nextTick(() => {
        runList[nextTaskIndex++](request, response, nextTask);
      });
    }
  })();
}
