import { Url } from "url";

export interface ITask {
  (request: IRequest, response: IResponse, next?: () => void): void;

  mountHttpMethod?: string;
}

export interface IRequest extends IRequestProto {
  /**
   * Original, unprocessed request URL
   */
  readonly originalUrl: string;

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
  readonly parsedUrl: Url;
  /**
   * The object format query string key value pairs.
   */
  readonly queryString: any;
  /**
   * Point to response object.
   */
  readonly response: IResponse;
  /**
   * Request method
   */
  readonly method: string;
  /**
   * Http headers, stored by object format.
   */
  readonly headers: any;
  /**
   * The tasks for this request, line by serially.
   *
   * Can be used for further monitor or optimise.
   */
  readonly taskList: ITask[];

  /**
   * The app context variable for simply share state.
   *
   * Must be tmp_* format.
   *
   * Eg. request.tmp_body
   */
  [propName: string]: any;
}

export interface IResponse extends IResponseProto {
  /**
   * Point to request object.
   */
  readonly request: IRequest;
}

export interface IRequestProto {
  /**
   * Get the client ip.
   *
   * <pre>
   * Examples:
   *  request.getIp();
   *  // => "127.0.0.1"
   * </pre>
   *
   * Notes:
   *  Be able to handle the proxy situation.
   */
  getIp: () => string;
}

export interface IResponseProto {
  /**
   * Set header field `key` to its `value`. If the `Content-Type` header
   * field be set, this method will automatically turn it to the extensional form,
   * eg. "html" to the standard mime form "text/html" and,
   * add the charset if it can be matched in mime-db package.
   *
   * Examples:
   * <pre>
   *  response.setHeader({ "Accept": "text/plain", "X-API-Key": "xmt" });
   *  // => Accept: "text/plain"
   *  // => X-API-Key: "xmt"
   *
   *  response.setHeader({ "Content-Type": "json" });
   *  // => Content-Type: "application/json; charset=utf-8"
   *
   *  response.setHeader({ "Content-Type": "html" });
   *  // => Content-Type: "text/html; charset=utf-8"
   *
   *  response.setHeader({ "Content-Type": "bin" });
   *  // => Content-Type: "application/octet-stream"
   *  </pre>
   *
   * Params:
   *  @keyValuePair(Object):
   *      Object that is used to set the headers,
   *      such as { Accept: "text/plain", "X-API-Key": "xmt" }.
   *
   * Returns:
   *  (ServerResponse):
   *      Return this `response` object for chain-able.
   */
  setHeader: (object: object) => this;

  /**
   * Set status `code` of this response.
   *
   * Examples:
   *  response.setStatus(404);
   *
   * Params:
   *  @code(Number):
   *      Http status code number such as "404".
   *
   * Returns:
   *  (ServerResponse):
   *      Return this `response` object for chain-able.
   */
  setStatus: (code: number) => this;

  /**
   * Send a response to the remote client, and
   * this method will terminate the underlying session.
   *
   * Examples:
   *  response.send(new Buffer("some buffer"));
   *  response.send({ some: "json" });
   *  response.send("<p>some html</p>");
   *
   * Params:
   *  @body(String|Object|Buffer):
   *      A string such as `"some string"`.
   *      A object such as `{ some: "object" }`.
   *      A buffer such as `new Buffer{"some buffer"}`.
   *
   * Returns:
   *  (ServerResponse):
   *      Return this `response` object for chain-able.
   */
  send: (body?: any) => this;
}
