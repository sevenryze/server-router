// Import node.js libraries
import { createServer, Server } from "http";
import { parse, Url } from "url";

// Import third part libraries

// Import own libraries
import { buildRunList } from "./runList";
import { schedule } from "./schedule";
import { RequestProto, requestProto } from "./prototype/request";
import { ResponseProto, responseProto } from "./prototype/response";

/**********************************************************************************************************************/
export class Router {
  public dde_serialList: (Task | Router)[] = [];

  public dde_mountPath: string = "";
  public dde_absolutePath: string = ""; // Will not be decided until the final entry() be called.
  public dde_mount = (path: string, router: Router): void => {
    if (
      typeof path !== "string" ||
      path === "" ||
      path === "/" ||
      path[0] !== "/" ||
      (path.length > 1 && path[path.length - 1] === "/")
    ) {
      throw new RouterError(
        "Router.dde_mount() requires non-'/', '/'-begin and non-end-'/' path"
      );
    }
    if (!(router instanceof Router)) {
      throw new RouterError("Router.dde_mount() requires a Router");
    }
    for (let storedItem of this.dde_serialList) {
      if (storedItem instanceof Router) {
        if (path === (<Router>storedItem).dde_mountPath) {
          throw new RouterError("Router already on: " + path);
        }
      }
    }

    router.dde_mountPath = path;
    this.dde_serialList.push(router);
  };

  private dde_addTask = (httpMethod: string, task: Task): void => {
    if (typeof task !== "function") {
      throw new RouterError(
        "Router.dde_" + httpMethod + "() requires callable task function"
      );
    }

    let taskItem: Task = task.bind(null);
    taskItem.dde_mountHttpMethod = httpMethod;
    this.dde_serialList.push(taskItem);
  };
  public dde_all = (task: Task): void => {
    this.dde_addTask("all", task);
  };
  public dde_get = (task: Task): void => {
    this.dde_addTask("get", task);
  };
  public dde_post = (task: Task): void => {
    this.dde_addTask("post", task);
  };
  public dde_put = (task: Task): void => {
    this.dde_addTask("put", task);
  };
  public dde_delete = (task: Task): void => {
    this.dde_addTask("delete", task);
  };
  public dde_common = (task: Task): void => {
    this.dde_addTask("common", task);
  };

  // This recurseSetAbsolutePathCounter will be equal to the number of all routers.
  private static recurseSetAbsolutePathCounter: number = 0;
  private dde_recurseSetAbsolutePath = (absolutePathPrefix: string): void => {
    Router.recurseSetAbsolutePathCounter++;

    // The current node is a root node.
    if (absolutePathPrefix === "root") {
      this.dde_absolutePath = "/";
      this.dde_mountPath = "root";
    } else {
      // The current node is a first layer node mounted on root node directly.
      if (absolutePathPrefix === "/") {
        this.dde_absolutePath = this.dde_mountPath;
      } else {
        // The current node is a normal node.
        this.dde_absolutePath = absolutePathPrefix + this.dde_mountPath;
      }
    }

    // Recurse calculate the absolute paths of all routers.
    for (let StoredItem of this.dde_serialList) {
      if (StoredItem instanceof Router) {
        (<Router>StoredItem).dde_recurseSetAbsolutePath(this.dde_absolutePath);
      }
    }
  };
  private internalServer: Server;
  public dde_listen = (port: number): Promise<this> => {
    if (typeof port !== "number") {
      throw new RouterError("Router.dde_listen() requires a number port");
    }

    // Set the current router to root router.
    this.dde_recurseSetAbsolutePath("root");

    this.internalServer = createServer(<any>this.incomingRequestHandler);

    return new Promise((resolve, reject) => {
      this.internalServer.listen(port, (error: Error) => {
        if (error) reject(error);
        resolve(this);
      });
    });
  };

  public dde_close = (): Promise<this> => {
    return new Promise((resolve, reject) => {
      this.internalServer.close((error: Error) => {
        if (error) reject(error);
        resolve(this);
      });
    });
  };

  // This is actual handler of the incoming message.
  private incomingRequestHandler = (
    request: Request,
    response: Response
  ): void => {
    // Protect the original URL from unintentional polluting.
    (<any>request).dde_originalUrl = request.url;

    // Store the url-related info.
    (<any>request).dde_parsedUrl = parse(request.url, true);
    (<any>request).dde_queryString = request.dde_parsedUrl.query;

    (<any>request).dde_method = request.method;
    (<any>request).dde_headers = request.headers;

    // Point to each other.
    (<any>request).dde_response = response;
    (<any>response).dde_request = request;

    // Merge properties of our Request and Response prototypes
    // to the incoming request and response objects.
    Object.assign(request, requestProto);
    Object.assign(response, responseProto);

    // This taskList is the main ordered task list that the current request will call.
    // Important!
    (<any>request).dde_taskList = [];

    // Build the runList.
    buildRunList(this, request, request.dde_taskList);

    // Run the tasks.
    schedule(request.dde_taskList, request, response);
  };
}

class RouterError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RouterError";
  }
}

/**********************************************************************************************************************/
export interface Task {
  (request: Request, response: Response, next?: () => void): void;

  dde_mountHttpMethod?: string;
}

export interface Request extends RequestProto {
  /**
   * Original, unprocessed request URL
   */
  readonly dde_originalUrl: string;

  /**
   * Parsed HTTP URL
   *
   * <pre>
   * ┌─────────────────────────────────────────────────────────────────────────────────────────────┐
   * │                                            href                                             │
   * ├──────────┬──┬─────────────────────┬─────────────────────┬───────────────────────────┬───────┤
   * │ protocol │  │        auth         │        host         │           path            │ hash  │
   * │          │  │                     ├──────────────┬──────┼──────────┬────────────────┤       │
   * │          │  │                     │   hostname   │ port │ pathname │     search     │       │
   * │          │  │                     │              │      │          ├─┬──────────────┤       │
   * │          │  │                     │              │      │          │ │    query     │       │
   * "  https:   //    user   :   pass   @ sub.host.com : 8080   /p/a/t/h  ?  query=string   #hash "
   * │          │  │          │          │   hostname   │ port │          │                │       │
   * │          │  │          │          ├──────────────┴──────┤          │                │       │
   * │ protocol │  │ username │ password │        host         │          │                │       │
   * ├──────────┴──┼──────────┴──────────┼─────────────────────┤          │                │       │
   * │   origin    │                     │       origin        │ pathname │     search     │ hash  │
   * ├─────────────┴─────────────────────┴─────────────────────┴──────────┴────────────────┴───────┤
   * │                                            href                                             │
   * └─────────────────────────────────────────────────────────────────────────────────────────────┘
   *
   * (all spaces in the "" line should be ignored -- they are purely for formatting)
   * </pre>
   */
  readonly dde_parsedUrl: Url;
  /**
   * The object format query string key value pairs.
   */
  readonly dde_queryString: any;
  /**
   * Point to response object.
   */
  readonly dde_response: Response;
  /**
   * Request method
   */
  readonly dde_method: string;
  /**
   * Http headers, stored by object format.
   */
  readonly dde_headers: any;
  /**
   * The tasks for this request, line by serially.
   *
   * Can be used for further monitor or optimise.
   */
  readonly dde_taskList: Task[];

  /**
   * The app context variable for simply share state.
   *
   * Must be tmp_* format.
   *
   * Eg. request.tmp_body
   */
  [propName: string]: any;
}

export interface Response extends ResponseProto {
  /**
   * Point to request object.
   */
  readonly dde_request: Request;
}
