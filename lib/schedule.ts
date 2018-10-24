import { IRequest, IResponse, ITask } from "./interface";

/**
 * Actually run all matching tasks.
 *
 * @param runList The tasks list waiting for execution.
 * @param request The manicured request object.
 * @param response The manicured response object.
 */
export function schedule(runList: ITask[], request: IRequest, response: IResponse): void {
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
