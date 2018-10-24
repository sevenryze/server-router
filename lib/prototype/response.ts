import etag from "etag";
import fresh from "fresh";
import { IResponseProto } from "../interface";

export let responseProto: IResponseProto = {
  setHeader(keyValuePair: object) {
    // The Object.keys(object) returns an array that contains
    // the names of all enumerable own (non-inherited)
    // properties of @object.
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
      this.setHeader(key, value);
    }
    return this;
  },

  setStatus(code: number) {
    this.statusCode = code;
    return this;
  },

  send(body?: any) {
    // Allow for multi call.
    if (this.finished) {
      return this;
    }

    if (!body) {
      this.end();
      return this;
    } else {
      let chunk = body;
      const contentType = this.getHeader("Content-Type");
      const encoding = "utf8";
      let length: number;

      switch (typeof chunk) {
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
          if (Buffer.isBuffer(chunk)) {
            if (!contentType) {
              this.setHeader({ "Content-Type": "bin" });
            }
          } else {
            // Must be an Array or Object.
            if (!contentType) {
              this.setHeader({ "Content-Type": "json" });
            }
            chunk = JSON.stringify(chunk, null, 4);
          }
          break;
      }

      // Populate Content-Length.
      if (chunk) {
        if (!Buffer.isBuffer(chunk)) {
          chunk = new Buffer(chunk, encoding);
        }
        length = chunk.length;
        this.setHeader({ "Content-Length": length });
      }

      // Populate ETag.
      if (!this.getHeader("etag") && length) {
        const generatedEtag = etag(chunk, { weak: true });
        if (generatedEtag) {
          this.setHeader({ ETag: generatedEtag });
        }
      }

      // Check if the remote client cache is fresh.
      const freshness = fresh(this.request, this);
      if (freshness) {
        this.statusCode = 304;
      }

      // Strip irrelevant headers in case of no needing.
      if (this.statusCode === 204 || this.statusCode === 304) {
        this.removeHeader("Content-Type");
        this.removeHeader("Content-Length");
        this.removeHeader("Transfer-Encoding");
        chunk = "";
      }

      if (this.request.method === "HEAD") {
        // skip body for HEAD
        this.end();
      } else {
        // respond
        this.end(chunk, encoding);
      }
    }
    return this;
  }
};
