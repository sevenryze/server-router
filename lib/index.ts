import { createServer, IncomingMessage, Server, ServerResponse } from "http";
import { AddressInfo } from "net";
import staticServe from "serve-static";
import { Debug } from "./helper/debugger";
import { RouterError } from "./helper/router-error";
import { Request } from "./prototype/request";
import { Response } from "./prototype/response";
import { buildRunList } from "./runList";
import { schedule } from "./schedule";

const debug = Debug(__filename);

export type Request = Request;
export type Response = Response;

export interface ITask {
  (request: Request, response: Response, next: () => void): void;

  mountHttpMethod?: string;

  // strimPath = requestPath - absolutePath
  strimPath?: string;
}

export function serveStatic(root: string, options?: staticServe.ServeStaticOptions): ITask {
  const middleware = staticServe(root, options);

  return (request, response, next) => {
    request.innerRequest.url = request.trimmedUrl;

    middleware(request.innerRequest as any, response.innerResponse as any, next);
  };
}

export class Router {
  public serialList: Array<ITask | Router> = [];

  public mountPath: string = "";

  /**
   * This path is used by matching tasks.
   *
   * Will not be decided until the entry router's listen() got called.
   */
  public absolutePath: string = "";

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
      throw new RouterError("Router.listen() requires a number type port");
    }

    // Set the current router to root router.
    this.recurseSetAbsolutePath("root");

    this.internalServer = createServer(this.incomingRequestHandler);

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

        debug(`Server closed successfully`);
        resolve(this);
      });
    });
  };

  public getListeningAddress = () => {
    return this.internalServer.address() as AddressInfo;
  };

  // This recurseSetAbsolutePathCounter will be equal to the number of all routers.
  private static recurseSetAbsolutePathCounter: number = 0;
  private internalServer!: Server;

  private addTask = (httpMethod: string, task: ITask): void => {
    if (typeof task !== "function") {
      throw new RouterError("Router." + httpMethod + "() requires callable task function");
    }

    const taskItem: ITask = task.bind(null);
    taskItem.mountHttpMethod = httpMethod;
    this.serialList.push(taskItem);
  };

  private recurseSetAbsolutePath = (prefix: string): void => {
    Router.recurseSetAbsolutePathCounter++;

    // The current node is a root node.
    if (prefix === "root") {
      this.absolutePath = "/";
      this.mountPath = "root";
    } else {
      // The current node is a first layer node mounted on root node directly.
      if (prefix === "/") {
        this.absolutePath = this.mountPath;
      }
      // The current node is a normal node.
      else {
        this.absolutePath = prefix + this.mountPath;
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
  private incomingRequestHandler = (request: IncomingMessage, response: ServerResponse): void => {
    debug(`Get method: ${request.method} on url: ${request.url}`);

    const perfectRequest = new Request(request, response);
    const perfectResponse = new Response(response, request);
    perfectRequest.response = perfectResponse;
    perfectResponse.request = perfectRequest;

    // Build the runList.
    buildRunList(this, perfectRequest, perfectRequest.taskList);

    // Run the tasks.
    schedule(perfectRequest.taskList, perfectRequest, perfectResponse);
  };
}
