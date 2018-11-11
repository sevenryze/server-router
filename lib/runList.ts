import { Url } from "url";
import { Router } from ".";
import { Debug } from "./helper/debugger";
import { strimPath } from "./helper/strim-path";
import { IRequest, ITask } from "./interface";

const debug = Debug(__filename);

/**
 * Build the task list which is used by schedule to actually run.
 *
 * @param router - the matching router
 * @param request - the incoming request
 * @param runList - the pointer points to the runList array
 */
export function buildRunList(router: Router, request: IRequest, runList: ITask[]) {
  recurseBuildRunList(router, request.de_method.toLowerCase(), request.de_parsedUrl, runList);
}

/**
 * Build the run list with recurse method.
 * Maybe we shouldn't use this method cause of intrinsic unsafe memory use.
 *
 * @param router - the matching router
 * @param method - the http request method
 * @param pathname - the http pathname
 * @param runList - the pointer points to the runList array
 */
function recurseBuildRunList(router: Router, method: string, parsedUrl: Url, runList: ITask[]): void {
  const matchPath = router.absolutePath;
  const pathname = parsedUrl.pathname;

  if (!pathname) {
    return;
  }

  if (pathname.substring(0, matchPath.length) === matchPath) {
    for (const serialItem of router.serialList) {
      // serialItem is a Router.
      if (serialItem instanceof Router) {
        const routerItem = serialItem;

        recurseBuildRunList(routerItem, method, parsedUrl, runList);
      }
      // serialItem is a task function.
      else {
        const taskItem = serialItem;

        if (
          taskItem.mountHttpMethod === "common" ||
          (pathname === router.absolutePath &&
            (taskItem.mountHttpMethod === method || taskItem.mountHttpMethod === "all"))
        ) {
          taskItem.strimPath = strimPath(parsedUrl, router.absolutePath);

          debug(`strimPath: ${taskItem.strimPath}, absolutePath: ${router.absolutePath}`);

          runList.push(taskItem);
        }
      }
    }
  }
}
