import { Router } from ".";
import { Debug } from "./helper/debugger";
import { IRequest, ITask } from "./interface";

const debug = Debug(__filename);

/**
 * Build the task list which is used by schedule to actually run.
 *
 * @param {Router} router - the matching router
 * @param {IRequest} request - the incoming request
 * @param {ITask[]} runList - the pointer points to the runList array
 */
export function buildRunList(router: Router, request: IRequest, runList: ITask[]) {
  recurseBuildRunList(router, request.dd_method.toLowerCase(), request.dd_parsedUrl.pathname!, runList);
}

/**
 * Build the run list with recurse method.
 * Maybe we shouldn't use this method cause of intrinsic unsafe memory use.
 *
 * @param {Router} router - the matching router
 * @param {string} requestMethod - the http request method
 * @param {string} requestPathname - the matching pathname
 * @param {ITask[]} runList - the pointer points to the runList array
 */
function recurseBuildRunList(router: Router, requestMethod: string, requestPathname: string, runList: ITask[]): void {
  const matchPath = router.absolutePath;
  if (requestPathname.substring(0, matchPath.length) === matchPath) {
    for (const serialItem of router.serialList) {
      // serialItem is a Router.
      if (serialItem instanceof Router) {
        recurseBuildRunList(serialItem, requestMethod, requestPathname, runList);
      } else {
        // serialItem is a task function.
        const task = serialItem;

        if (
          task.mountHttpMethod === "common" ||
          (requestPathname === router.absolutePath &&
            (task.mountHttpMethod === requestMethod || task.mountHttpMethod === "all"))
        ) {
          task.strimPath = requestPathname.substring(router.absolutePath === "/" ? 0 : router.absolutePath.length);

          debug(
            `strimPath: ${task.strimPath}, requestPathname: ${requestPathname}, absolutePath: ${router.absolutePath}`
          );

          runList.push(task);
        }
      }
    }
  }
}
