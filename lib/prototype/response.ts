import etag from "etag";
import fresh from "fresh";
import { IncomingHttpHeaders, IncomingMessage, ServerResponse } from "http";
import { Debug } from "../helper/debugger";
import { Request } from "./request";

const debug = Debug(__filename);

export class Response {
  public request?: Request;

  /**
   * Set header field `key` to its `value`.
   *
   * If the `Content-Type` header field be set, this method will
   * automatically turn it to the extensional form,
   * eg. "html" to the standard mime form "text/html" and,
   * add the charset if it can be matched in mime-db package.
   *
   * Examples:
   *
   * ```ts
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
  public setHeader = (keyValuePair: { [p in keyof IncomingHttpHeaders]: string | string[] | number }) => {
    // Allow for multi call.
    if (this.innerResponse.finished || !this.request) {
      return this;
    }

    Object.entries(keyValuePair).forEach(([key, value]) => {
      if (!value) {
        return;
      }

      if (key.toLowerCase() === "content-type") {
        switch (value) {
          case "json":
            value = "application/json; charset=utf-8";
            break;
          case "html":
            value = "text/html; charset=utf-8";
            break;
          case "text":
            value = "text/plain; charset=utf-8";
            break;
          case "bin":
            value = "application/octet-stream";
            break;
        }
      }

      this.innerResponse.setHeader(key, value);
    });

    return this;
  };

  /**
   * Set status `code` of this response.
   *
   * Examples:
   * ```ts
   *  response.setStatus(404);
   * ```
   * @param code Status code number such as "404".
   * @returns Return this `response` object for chain-able.
   */
  public setStatus = (code: number) => {
    // Allow for multi call.
    if (this.innerResponse.finished || !this.request) {
      return this;
    }

    this.innerResponse.statusCode = code;
    return this;
  };

  /**
   * Send a response to the remote client, and
   * this method will terminate the underlying session.
   *
   * Examples:
   * ```ts
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
  public send = (data?: string | Buffer | object) => {
    // Allow for multi call.
    if (this.innerResponse.finished || !this.request) {
      return this;
    }

    // skip body for HEAD request
    // skip empty body
    if (!data || this.request.method === "HEAD") {
      this.innerResponse.end();
      return this;
    }

    const encoding = "utf8";
    let length: number | undefined;

    const contentType = this.innerResponse.getHeader("Content-Type");
    switch (typeof data) {
      // String defaulting to text/plain.
      case "string":
        // in case have not set `Content-Type`.
        if (!contentType) {
          this.setHeader({ "Content-Type": "text" });
        }
        break;

      // `typeof` an Array, Object, Buffer will be "object".
      case "object":
        // In case a Buffer here.
        if (Buffer.isBuffer(data)) {
          if (!contentType) {
            this.setHeader({ "Content-Type": "bin" });
          }
        } else {
          // Must be an Array or Object.
          if (!contentType) {
            this.setHeader({ "Content-Type": "json" });
          }

          try {
            data = JSON.stringify(data);
          } catch {
            data = undefined;
          }
        }
        break;
    }

    // Populate Content-Length.
    if (data) {
      if (!Buffer.isBuffer(data)) {
        data = Buffer.from(data, encoding);
      }

      length = (data as Buffer).length;
      this.setHeader({ "Content-Length": length });
    }

    // Populate ETag.
    if (length && !this.innerResponse.getHeader("etag")) {
      const generatedEtag = etag(data as Buffer, { weak: true });
      if (generatedEtag) {
        this.setHeader({ ETag: generatedEtag });
      }
    }

    // Check if the remote client cache is fresh.
    const isFresh = fresh(this.request.headers, this.innerResponse.getHeaders());
    debug(`Check freshness: ${isFresh}`);
    if (isFresh) {
      this.innerResponse.statusCode = 304;
    }

    // Strip irrelevant headers in case of no needing.
    if (this.innerResponse.statusCode === 204 || this.innerResponse.statusCode === 304) {
      this.innerResponse.removeHeader("Content-Type");
      this.innerResponse.removeHeader("Content-Length");
      this.innerResponse.removeHeader("Transfer-Encoding");
      data = undefined;
    }

    // Respond
    this.innerResponse.end(data, encoding);

    return this;
  };

  constructor(public readonly innerResponse: ServerResponse, public readonly innerRequest: IncomingMessage) {}
}
