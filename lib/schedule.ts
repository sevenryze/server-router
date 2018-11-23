import { ITask } from ".";
import { Request } from "./prototype/request";
import { Response } from "./prototype/response";

/**
 * Actually run all matching tasks.
 *
 * @param runList The tasks list waiting for execution.
 * @param request The manicured request object.
 * @param response The manicured response object.
 */
export function schedule(runList: ITask[], request: Request, response: Response): void {
  if (!Array.isArray(runList) || runList.length < 1 || !request || !response) {
    return;
  }

  let nextTaskIndex: number = 0;

  (function nextTask() {
    if (nextTaskIndex < runList.length) {
      process.nextTick(() => {
        const task = runList[nextTaskIndex++];

        request.trimmedUrl = task.strimPath;

        task(request, response, nextTask);
      });
    }
  })();
}
