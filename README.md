# Table of Content

<!-- prettier-ignore-start -->

<!-- @import "[TOC]" {cmd="toc" depthFrom=1 depthTo=6 orderedList=false} -->

<!-- code_chunk_output -->

* [Table of Content](#table-of-content)
* [Tool Story](#tool-story)
* [Big Picture, as I said](#big-picture-as-i-said)
* [How to use](#how-to-use)
* [API](#api)
	* [`serveStatic`](#servestatic)
	* [`Router()`](#router)
	* [`dde_mount(path, router)`](#dde_mountpath-router)
	* [`dde_METHOD(task)`](#dde_methodtask)
	* [Helpers on `Request`](#helpers-on-request)
		* [`request.dde_originalUrl`: string](#requestdde_originalurl-string)
		* [`request.dde_parsedUrl`: Url](#requestdde_parsedurl-url)
		* [`request.dde_queryString`: object](#requestdde_querystring-object)
		* [`request.dde_response`: Respond](#requestdde_response-respond)
		* [`request.dde_method`: string](#requestdde_method-string)
		* [`request.dde_headers`: object](#requestdde_headers-object)
		* [`request.dde_taskList`: Task[]](#requestdde_tasklist-task)
		* [`request.tmp_*`: any](#requesttmp_-any)
		* [`request.dde_getIp()`: () => string](#requestdde_getip-string)
	* [Helpers on `Response`](#helpers-on-response)
		* [`response.dde_request`: Request](#responsedde_request-request)
		* [`response.dde_setHeader(object)`: (object) => Respond](#responsedde_setheaderobject-object-respond)
		* [`response.dde_setStatus(code)`: (code: number) => Response](#responsedde_setstatuscode-code-number-response)
		* [`response.dde_send(body)`: (body?) => Response](#responsedde_sendbody-body-response)
	* [`dde_listen(port)`](#dde_listenport)
	* [`dde_close()`](#dde_close)
	* [`dde_getListeningAddress()`](#dde_getlisteningaddress)
* [Build and Test](#build-and-test)
	* [Build](#build)
	* [Test](#test)
* [Code of Conduct](#code-of-conduct)
* [Contributor](#contributor)

<!-- /code_chunk_output -->

<!-- prettier-ignore-end -->

# Tool Story

This is project _BaiQi_ of DeepDigEst Inc., which _maybe_ ⏰ simplify the backend app development workflow.

Our server guys have made lots of discussions about to which logic-glue framework we should adopt and decided to choose node.js, the flighty yet powerful VM.

Since then, we have talked about which language system we should fit into, it's all about easy maintenance and quick training for the new stuff, the plain js, traceurjs, babeljs and so on. Finally, we made a united agree on that it must be typescript - microsoft's typed javascript. Yes, microsoft is great again cause she said she loves oss and linux? 😊

This server framework is aimed at the goal - "simple, fast, debug-faced and stable". It's used for holding the big application logic layer of our backend system. For now we have done a few awesome features like tasks switching, debug information recording and request-response object initializing.

In the future, we will give our best to get continual improvements. Maybe there should be some thing like _Roadmap_ or _big picture_? 😢 I hate to write doc, you know, my boss would never pay for the doc working, which is the most terrible thing, IMO.

Good luck for this project!

# Big Picture, as I said

The HTTP Request - by the simple view point - is consist of below parts:

1.  HTTP method: GET, PUT, POST or DELETE.
2.  HTTP path: /api/v1/hello?foo=bar&a=b
3.  HTTP payload: the body of http request.

The whole of system is intrinsically a pre-config system, and all we need to do is just writing the right configure file according to the app logic. But, you should use the _code as config_ principal instead of using the normal json configuration.

In terminology, we call that step - making the `Task Process Tree(TPT)`, and every node or leaf of that tree becomes the `Router Node`.

We define that every time when you meet a `/` symbol in the path string, the layers of TPT should increase one. This is the most important convention we should use.

A single router node has three important properties:

1.  the _matching path_ - used to matching http path, and
2.  the _matching method_ - used to matching http method.
3.  the _tasks_ - used to processing the matched http request, could be a single task or a chain of tasks.

We think, for app logic developers, the first two parts shall fully qualify a http request and the third part is about how to explain our logic code.

The tasks can make different process in terms of the `Request` object passed into, or call the `next()` function to pass the control to next matching tasks, exactly as the `express` framework.🤡

For brevity, whole system consists of routers, and single router consists of matching path, method and tasks.

The most important claim, **_do not_** resort the skip-level mounting, in which you mount the non direct descendant. Think like this:

```js
// Do not use this!
router.dde_mount("/api/v1, router_v1");
```

For specific http request, system will give us an integrated TPT. And this TPT will be the key for future performance monitor, optimization and task testing.

# How to use

Use `npm` to install `@sevenryze/server`, then import the only exported class.

```
import { Router } from "@sevenryze/server"
// Or commonjs
const { Router } = require("@sevenryze/server");

let router = new Router();
```

# API

## `serveStatic`

The static files serve utility shameless borrowed from node module `serve-static`.
See more info: https://github.com/expressjs/serve-static

## `Router()`

`Router` class, used for initializing the router object.

```
let router = new Router();

// You can now use router to compose the whole system.
```

## `dde_mount(path, router)`

- `path`: the path mounted by sub-router.
- `router`: the sub-router.

Mount different `Router` hierarchically to compose the whole response chain.

```
router_root.dde_mount("/v1", router_v1);

router_v1.dde_mount("/user", router_user);
```

## `dde_METHOD(task)`

- `task: (request, response, next) => void`: The task function will get three parameters - `request`, `response`, `next`, corresponding the Request, Respond of http request and the control passing function `next()` respectively.

Register the task processing function into router. We support a few common `http method`:

1.  `GET` request - `dde_get()`.
2.  `POST` request - `dde_post()`.
3.  `PUT` request - `dde_put()`.
4.  `DELETE` request - `dde_delete()`.
5.  Match all methods on the same router - `dde_all`.
6.  Match all methods on the same and descendant routers - `dde_common()`.

Note: Generally, on every place where you need to call the `next()` to pass the control, you should use the form `return next();` to eliminate the side-effect.
Want to know why? see my blog, if there are... 🤡

```
// sync task
router.dde_get( (request, response, next) => {
    // Do something.

    response.dde_send();
    return next();
});

// async task
router.dde_get(async (request, response, next) => {
    // Do something.

    return next();
})
```

## Helpers on `Request`

### `request.dde_originalUrl`: string

Original, unprocessed request url.

### `request.dde_parsedUrl`: Url

The parsed http url, see https://nodejs.org/dist/latest-v9.x/docs/api/url.html#url_url_strings_and_url_objects for more info.

### `request.dde_queryString`: object

The query string key-value pairs parsed into object format.

### `request.dde_response`: Respond

Point to the accompanied Response object.

### `request.dde_method`: string

The request http method.

### `request.dde_headers`: object

The http headers parsed into object format.

### `request.dde_taskList`: Task[]

The tasks waiting for this request.

### `request.tmp_*`: any

The app context variable for simply share state between tasks. Must be the `tmp_*` format.

### `request.dde_getIp()`: () => string

Get the client ip and be able to handle behind proxy case.

```js
request.dde_getIp();
// => "127.0.0.1"
```

## Helpers on `Response`

### `response.dde_request`: Request

Points to the accompanied request object.

### `response.dde_setHeader(object)`: (object) => Respond

- object <string> - Object used to set the headers, such as { Accept: "text/plain", "X-API-Key": "dde" }.

Set header `key` to its `value`. If the `Content-Type` field is going to be set, this method will automatically turn the value to extensional form, eg."html" to the standard mime forms "text/html", and add the charset if it can be matched in mime-db package.

Return the this object, aka. Respond to make chain-able calls available.

```js
response.dde_setHeader({ Accept: "text/plain", "X-API-Key": "xmt" });
// => Accept: "text/plain"
// => X-API-Key: "xmt"
response.dde_setHeader({ "Content-Type": "json" });
// => Content-Type: "application/json; charset=utf-8"
response.dde_setHeader({ "Content-Type": "html" });
// => Content-Type: "text/html; charset=utf-8"
response.dde_setHeader({ "Content-Type": "bin" });
// => Content-Type: "application/octet-stream"
```

### `response.dde_setStatus(code)`: (code: number) => Response

- code <number> - Http status code number such as "404"

Set the status `code` of the response.

Return this object for chain-able calls.

```JavaScript
response.dde_setStatus(404);
```

### `response.dde_send(body)`: (body?) => Response

- body <string | object | buffer> - Can be a string such as `"some string"`, an object such as `{some: "haha"}` and a buffer such as `new Buffer("some buffer")`.

Send response to the remote client, and this method will terminate the underlying socket session.

```JavaScript
response.dde_send(new Buffer("some buffer"));
response.dde_send({ some: "json" });
response.dde_send("<p>some html</p>");
```

## `dde_listen(port)`

- port: The port listening to.

Listen the specific port.

If there are under tests case or would like to get a temp port, you should use number `0` as the argument.

If port is omitted or is 0, the operating system will assign an arbitrary unused port, which can be retrieved by using Router.dde_getListeningAddress().port after the 'listening' event has been emitted.

```
router.dde_listen(7777);
```

## `dde_close()`

Close the server.

```
router.dde_close();
```

## `dde_getListeningAddress()`

Get the bounding server address info.

# Build and Test

## Build

Use typescript to compile. For more information, you should check the tsconfig.ts file.

```js
npm run build
```

## Test

We use a well-known combination test set - `jest` by facebook. You are to use npm test script to test all, like:

```
npm run test
```

And if you need to generate test coverage, use:

```
npm run test-coverage
```

# Code of Conduct

1.  You are not rambo. Remember that, together, we are a team.
2.  Please invite someone to review your code, again, you are not immortal.
3.  Never blame other workmate for the quality of code set, you should know that boss already fined the poor guy.

# Contributor

- Seven Ryze - XmT Inc.
- Cris - XmT Inc.
- Becky - XmT Inc.
- ~~Rangeragent - XmT Inc.~~
