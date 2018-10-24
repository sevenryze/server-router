import { createServer, Server } from "http";
import { AddressInfo } from "net";
import { parse } from "url";
import { ITask } from "./interface";
import { requestProto } from "./prototype/request";
import { responseProto } from "./prototype/response";
import { buildRunList } from "./runList";
import { schedule } from "./schedule";
export { serveStatic } from "serve-static";

export class Router {
  public serialList: Array<ITask | Router> = [];

  public mountPath: string = "";
  public absolutePath: string = ""; // Will not be decided until the final entry() be called.
  public mount = (path: string, router: Router): void => {
    if (
      typeof path !== "string" ||
      path === "" ||
      path === "/" ||
      path[0] !== "/" ||
      (path.length > 1 && path[path.length - 1] === "/")
    ) {
      throw new RouterError("Router.mount() requires non-'/', '/'-begin and non-end-'/' path");
    }
    if (!(router instanceof Router)) {
      throw new RouterError("Router.mount() requires a Router");
    }
    for (const storedItem of this.serialList) {
      if (storedItem instanceof Router) {
        if (path === (storedItem as Router).mountPath) {
          throw new RouterError("Router already on: " + path);
        }
      }
    }

    router.mountPath = path;
    this.serialList.push(router);
  };
  public all = (task: ITask): void => {
    this.addTask("all", task);
  };
  public get = (task: ITask): void => {
    this.addTask("get", task);
  };
  public post = (task: ITask): void => {
    this.addTask("post", task);
  };
  public put = (task: ITask): void => {
    this.addTask("put", task);
  };
  public delete = (task: ITask): void => {
    this.addTask("delete", task);
  };
  public common = (task: ITask): void => {
    this.addTask("common", task);
  };
  public listen = (port: number): Promise<this> => {
    if (typeof port !== "number") {
      throw new RouterError("Router.listen() requires a number port");
    }

    // Set the current router to root router.
    this.recurseSetAbsolutePath("root");

    this.internalServer = createServer(this.incomingRequestHandler as any);

    return new Promise((resolve, reject) => {
      this.internalServer.listen(port, (error: Error) => {
        if (error) {
          reject(error);
        }

        resolve(this);
      });
    });
  };

  public close = (): Promise<this> => {
    return new Promise((resolve, reject) => {
      this.internalServer.close((error: Error) => {
        if (error) {
          reject(error);
        }
        resolve(this);
      });
    });
  };

  public getListeningAddress = () => {
    return this.internalServer.address() as AddressInfo;
  };

  // This recurseSetAbsolutePathCounter will be equal to the number of all routers.
  private static recurseSetAbsolutePathCounter: number = 0;
  private internalServer: Server;

  private addTask = (httpMethod: string, task: ITask): void => {
    if (typeof task !== "function") {
      throw new RouterError("Router." + httpMethod + "() requires callable task function");
    }

    const taskItem: ITask = task.bind(null);
    taskItem.mountHttpMethod = httpMethod;
    this.serialList.push(taskItem);
  };
  private recurseSetAbsolutePath = (absolutePathPrefix: string): void => {
    Router.recurseSetAbsolutePathCounter++;

    // The current node is a root node.
    if (absolutePathPrefix === "root") {
      this.absolutePath = "/";
      this.mountPath = "root";
    } else {
      // The current node is a first layer node mounted on root node directly.
      if (absolutePathPrefix === "/") {
        this.absolutePath = this.mountPath;
      } else {
        // The current node is a normal node.
        this.absolutePath = absolutePathPrefix + this.mountPath;
      }
    }

    // Recurse calculate the absolute paths of all routers.
    for (const StoredItem of this.serialList) {
      if (StoredItem instanceof Router) {
        (StoredItem as Router).recurseSetAbsolutePath(this.absolutePath);
      }
    }
  };

  // This is actual handler of the incoming message.
  private incomingRequestHandler = (request: Request, response: Response): void => {
    // Protect the original URL from unintentional polluting.
    (request as any).originalUrl = request.url;

    // Store the url-related info.
    (request as any).parsedUrl = parse(request.url, true);
    (request as any).queryString = request.parsedUrl.query;

    (request as any).method = request.method;
    (request as any).headers = request.headers;

    // Point to each other.
    (request as any).response = response;
    (response as any).request = request;

    // Merge properties of our Request and Response prototypes
    // to the incoming request and response objects.
    Object.assign(request, requestProto);
    Object.assign(response, responseProto);

    // This taskList is the main ordered task list that the current request will call.
    // Important!
    (request as any).taskList = [];

    // Build the runList.
    buildRunList(this, request, request.taskList);

    // Run the tasks.
    schedule(request.taskList, request, response);
  };
}

// tslint:disable-next-line:max-classes-per-file
class RouterError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RouterError";
  }
}
