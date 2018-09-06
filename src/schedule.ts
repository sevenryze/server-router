// Import node.js libraries

// Import third part libraries

// Import own libraries
import { Task, Request, Response } from "./router";

/**********************************************************************************************************************/
/**
 * Actually run all matching tasks.
 *
 * @param runList The tasks list waiting for execution.
 * @param request The manicured request object.
 * @param response The manicured response object.
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
