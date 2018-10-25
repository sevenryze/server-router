import { IncomingMessage } from "http";
import { Url } from "url";

export interface ITask {
  (request: IRequest, response: IResponse, next: () => void): void;

  mountHttpMethod?: string;

  // strimPath = requestPath - absolutePath
  strimPath?: string;
}

// Should hidden underlaying node api from users.
// So we don't extend IncomingMessage interface from node.
export interface IRequest extends IRequestProto {
  /**
   * Original, unprocessed request URL
   */
  readonly  de_originalUrl: string;
  /**
   * Parsed HTTP URL
   *
   * See: https://nodejs.org/dist/latest-v11.x/docs/api/url.html
   */
  readonly  de_parsedUrl: Url;
  /**
   * Point to response object.
   */
  readonly  de_response: IResponse;
  /**
   * Request method
   */
  readonly  de_method: string;
  /**
   * Http headers, stored by object format.
   *
   * Header names are lower-cased.
   */
  readonly  de_headers: IncomingMessage["headers"];
  /**
   * The tasks for this request, line by serially.
   *
   * Can be used for further monitor or optimise.
   */
  readonly  de_taskList: ITask[];

  /**
   * The app context variable for simply share state.
   * e.g. `request.share.something`
   */
   de_share: {
    [propName: string]: any;
  };
}

export interface IResponse extends IResponseProto {
  /**
   * Point to request object.
   */
  readonly  de_request: IRequest;
}

export interface IRequestProto {
  /**
   * Get the client ip.
   *
   * Examples:
   * ```
   *  request. de_getIp();
   *  // => "127.0.0.1"
   * ```
   * Notes:
   *  The function could be able to handle the proxy situation.
   */
   de_getIp: () => string;
}

export interface IResponseProto {
  /**
   * Set header field `key` to its `value`. If the `Content-Type` header
   * field be set, this method will automatically turn it to the extensional form,
   * eg. "html" to the standard mime form "text/html" and,
   * add the charset if it can be matched in mime-db package.
   *
   * Examples:
   *
   * ```
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
   * ```
   *
   * @param object Object used to set the headers, such as { Accept: "text/plain", "X-API-Key": "xmt" }.
   * @returns Return this `response` object for chain-able.
   */
   de_setHeader: (
    object: {
      [i: string]: any;
    }
  ) => this;

  /**
   * Set status `code` of this response.
   *
   * Examples:
   * ```
   *  response.setStatus(404);
   * ```
   * @param code Status code number such as "404".
   * @returns Return this `response` object for chain-able.
   */
   de_setStatus: (code: number) => this;

  /**
   * Send a response to the remote client, and
   * this method will terminate the underlying session.
   *
   * Examples:
   * ```
   *  response.send(new Buffer("some buffer"));
   *  response.send({ some: "json" });
   *  response.send("<p>some html</p>");
   * ```
   *
   * @param body The response body, such as:
   *  1. A string - `"some string"`.
   *  1. A object - `{ some: "object" }`.
   *  1. A buffer - `new Buffer{"some buffer"}`.
   * @returns Return this `response` object for chain-able.
   */
   de_send: (data?: string | Buffer | object) => this;
}
