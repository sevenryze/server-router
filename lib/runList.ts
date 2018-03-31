// Import node.js libraries

// Import third-party libraries

// Import own libraries
import { Router, Task, Request } from "./router";

/**********************************************************************************************************************/
/**
 * Build the task list which is used by schedule to actually run.
 *
 * @param {Router} router - the matching router
 * @param {Request} request - the incoming request
 * @param {Task[]} runList - the pointer points to the runList array
 */
export function buildRunList(
  router: Router,
  request: Request,
  runList: Task[]
) {
  recurseBuildRunList(
    router,
    (<any>request).method.toLowerCase(),
    request.dde_parsedUrl.pathname,
    runList
  );
}

/**
 * Build the run list with recurse method.
 * Maybe we shouldn't use this method cause of intrinsic unsafe memory use.
 *
 * @param {Router} router - the matching router
 * @param {string} requestMethod - the http request method
 * @param {string} requestPathname - the matching pathname
 * @param {Task[]} runList - the pointer points to the runList array
 */
function recurseBuildRunList(
  router: Router,
  requestMethod: string,
  requestPathname: string,
  runList: Task[]
): void {
  let matchPath = router.dde_absolutePath;
  if (requestPathname.substring(0, matchPath.length) === matchPath) {
    for (let serialItem of router.dde_serialList) {
      // serialItem is a Router.
      if (serialItem instanceof Router) {
        recurseBuildRunList(
          serialItem,
          requestMethod,
          requestPathname,
          runList
        );
      } else {
        // serialItem is a task function.
        let task = serialItem;
        if (task.dde_mountHttpMethod === "common") {
          runList.push(task);
        } else if (
          requestPathname === router.dde_absolutePath &&
          (task.dde_mountHttpMethod === requestMethod ||
            task.dde_mountHttpMethod === "all")
        ) {
          runList.push(task);
        }
      }
    }
  }
}
