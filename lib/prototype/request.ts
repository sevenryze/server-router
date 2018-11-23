import { IncomingHttpHeaders, IncomingMessage, ServerResponse } from "http";
import requestIp from "request-ip";
import { parse, Url } from "url";
import { ITask } from "..";
import { Response } from "./response";

export class Request {
  public response?: Response;

  public readonly originalUrl: string;

  /**
   * The url portion trimmed relative to mount path.
   */
  public trimmedUrl?: string;

  /**
   * Parsed HTTP URL
   *
   * See: https://nodejs.org/dist/latest-v11.x/docs/api/url.html
   */
  public readonly parsedUrl: Url;

  /**
   * Request method
   */
  public readonly method: string;

  /**
   * Http headers, stored by object format.
   *
   * Header names are lower-cased.
   */
  public readonly headers: IncomingHttpHeaders;

  /**
   * The tasks for this request, line by serially.
   *
   * Can be used for further monitor or optimise.
   */
  public readonly taskList: ITask[] = [];

  /**
   * Get the client ip.
   *
   * Examples:
   * ```
   *  request.ip;
   *  // => "127.0.0.1"
   * ```
   * Notes:
   *  The function could be able to handle the proxy situation.
   */
  public ip: string;

  constructor(public readonly innerRequest: IncomingMessage, public readonly innerResponse: ServerResponse) {
    this.ip = requestIp.getClientIp(innerRequest);

    // Protect the original URL from unintentional polluting.
    this.originalUrl = innerRequest.url!;

    // Store the url-related info.
    this.parsedUrl = parse(innerRequest.url!, true);

    this.method = innerRequest.method!;
    this.headers = innerRequest.headers;
  }
}
