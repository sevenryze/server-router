import etag from "etag";
import fresh from "fresh";

/**********************************************************************************************************************/
export let responseProto: ResponseProto = {
  dde_setHeader: function(keyValuePair: object) {
    // The Object.keys(object) returns an array that contains
    // the names of all enumerable own (non-inherited)
    // properties of @object.
    for (let key of Object.keys(keyValuePair)) {
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

  dde_setStatus: function(code: number) {
    this.statusCode = code;
    return this;
  },

  dde_send: function(body?: any) {
    // Allow for multi call.
    if (this.finished) {
      return this;
    }

    if (!body) {
      this.end();
      return this;
    } else {
      let chunk = body;
      let contentType = this.getHeader("Content-Type");
      let encoding = "utf8";
      let length: number;

      switch (typeof chunk) {
        // String defaulting to text/plain.
        case "string":
          // in case have not set `Content-Type`.
          if (!contentType) {
            this.dde_setHeader({ "Content-Type": "text" });
          }
          break;

        // `typeof` an Array, Object, Buffer will be "object".
        case "object":
          // In case a Buffer here.
          if (Buffer.isBuffer(chunk)) {
            if (!contentType) {
              this.dde_setHeader({ "Content-Type": "bin" });
            }
          } else {
            // Must be an Array or Object.
            if (!contentType) {
              this.dde_setHeader({ "Content-Type": "json" });
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
        this.dde_setHeader({ "Content-Length": length });
      }

      // Populate ETag.
      if (!this.getHeader("etag") && length) {
        let generatedEtag = etag(chunk, { weak: true });
        if (generatedEtag) {
          this.dde_setHeader({ ETag: generatedEtag });
        }
      }

      // Check if the remote client cache is fresh.
      let freshness = fresh(this.dde_request, this);
      if (freshness) this.statusCode = 304;

      // Strip irrelevant headers in case of no needing.
      if (this.statusCode === 204 || this.statusCode === 304) {
        this.removeHeader("Content-Type");
        this.removeHeader("Content-Length");
        this.removeHeader("Transfer-Encoding");
        chunk = "";
      }

      if (this.dde_request.method === "HEAD") {
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

export interface ResponseProto {
  /**
   * Set header field `key` to its `value`. If the `Content-Type` header
   * field be set, this method will automatically turn it to the extensional form,
   * eg. "html" to the standard mime form "text/html" and,
   * add the charset if it can be matched in mime-db package.
   *
   * Examples:
   * <pre>
   *  response.dde_setHeader({ "Accept": "text/plain", "X-API-Key": "xmt" });
   *  // => Accept: "text/plain"
   *  // => X-API-Key: "xmt"
   *
   *  response.dde_setHeader({ "Content-Type": "json" });
   *  // => Content-Type: "application/json; charset=utf-8"
   *
   *  response.dde_setHeader({ "Content-Type": "html" });
   *  // => Content-Type: "text/html; charset=utf-8"
   *
   *  response.dde_setHeader({ "Content-Type": "bin" });
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
  dde_setHeader: (object: object) => this;

  /**
   * Set status `code` of this response.
   *
   * Examples:
   *  response.dde_setStatus(404);
   *
   * Params:
   *  @code(Number):
   *      Http status code number such as "404".
   *
   * Returns:
   *  (ServerResponse):
   *      Return this `response` object for chain-able.
   */
  dde_setStatus: (code: number) => this;

  /**
   * Send a response to the remote client, and
   * this method will terminate the underlying session.
   *
   * Examples:
   *  response.dde_send(new Buffer("some buffer"));
   *  response.dde_send({ some: "json" });
   *  response.dde_send("<p>some html</p>");
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
  dde_send: (body?: any) => this;
}
