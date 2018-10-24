import etag from "etag";
import fresh from "fresh";
import { ServerResponse } from "http";
import { Debug } from "../helper/debugger";
import { IResponse, IResponseProto } from "../interface";

const debug = Debug(__filename);

export let responseProto: IResponseProto = {
  dd_setHeader(keyValuePair) {
    for (const key of Object.keys(keyValuePair)) {
      let value = keyValuePair[key];

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

      ((this as unknown) as ServerResponse).setHeader(key, value);
    }

    return this;
  },

  dd_setStatus(code) {
    ((this as unknown) as ServerResponse).statusCode = code;
    return this;
  },

  dd_send(data) {
    const self = (this as unknown) as ServerResponse;

    // Allow for multi call.
    if (self.finished) {
      return this;
    }

    // skip body for HEAD request
    // skip empty body
    if (!data || (this as IResponse).request.method === "HEAD") {
      self.end();
      return this;
    }

    const encoding = "utf8";
    let length: number | undefined;

    const contentType = self.getHeader("Content-Type");
    switch (typeof data) {
      // String defaulting to text/plain.
      case "string":
        // in case have not set `Content-Type`.
        if (!contentType) {
          this.dd_setHeader({ "Content-Type": "text" });
        }
        break;

      // `typeof` an Array, Object, Buffer will be "object".
      case "object":
        // In case a Buffer here.
        if (Buffer.isBuffer(data)) {
          if (!contentType) {
            this.dd_setHeader({ "Content-Type": "bin" });
          }
        } else {
          // Must be an Array or Object.
          if (!contentType) {
            this.dd_setHeader({ "Content-Type": "json" });
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
      this.dd_setHeader({ "Content-Length": length });
    }

    // Populate ETag.
    if (length && !self.getHeader("etag")) {
      const generatedEtag = etag(data as Buffer, { weak: true });
      if (generatedEtag) {
        this.dd_setHeader({ ETag: generatedEtag });
      }
    }

    // Check if the remote client cache is fresh.
    const isFresh = fresh((this as IResponse).request.headers, ((this as unknown) as ServerResponse).getHeaders());
    debug(`Check freshness: ${isFresh}`);
    if (isFresh) {
      self.statusCode = 304;
    }

    // Strip irrelevant headers in case of no needing.
    if (self.statusCode === 204 || self.statusCode === 304) {
      self.removeHeader("Content-Type");
      self.removeHeader("Content-Length");
      self.removeHeader("Transfer-Encoding");
      data = undefined;
    }

    // Respond
    self.end(data, encoding);

    return this;
  }
};
