// Import node.js libraries

// Import third party libraries
import * as superagent from "superagent";

// Import own libraries
import {Router} from "../lib/router";

/**********************************************************************************************************************/
describe("Response", () => {
    describe("dde_send()", () => {
        test("should sent json", async () => {
            const router = new Router();
            router.dde_common(function (request, response) {
                response.dde_send({
                    "json": "hello!"
                });
            });

            await router.dde_listen(7777);

            let response = await superagent.get("http://localhost:7777");
            expect(response.type).toBe("application/json");
            expect(response.body.json).toBe("hello!");

            await router.dde_close();
        });

        test("should sent text", async () => {
            const router = new Router();
            router.dde_common(function (request, response) {
                response.dde_send("hello text!");
            });

            await router.dde_listen(7777);

            let response = await superagent.get("http://localhost:7777");
            expect(response.type).toBe("text/plain");
            expect(response.text).toBe("hello text!");

            await router.dde_close();
        });

        test("should sent binary data", async () => {
            const router = new Router();
            router.dde_common(function (request, response) {
                response.dde_send(new Buffer("sevenryze"));
            });
            await router.dde_listen(7777);

            let response = await superagent.get("http://localhost:7777");
            expect(response.type).toBe("application/octet-stream");

            await router.dde_close();
        });

        test("should sent html", async () => {
            const router = new Router();
            router.dde_common(function (request, response) {
                response.dde_setHeader({"content-type": "html"});
                response.dde_send("<p>hello</p>");
            });
            await router.dde_listen(7777);

            let response = await superagent.get("http://localhost:7777");
            expect(response.type).toBe("text/html");

            await router.dde_close();
        });

        test("should allow call this method multi times", async () => {
            const router = new Router();
            router.dde_common(function (request, response) {
                response.dde_send({
                    "json": "hello 1!"
                });
                response.dde_send({
                    "json": "hello 2!"
                });
                response.dde_send({
                    "json": "hello 3!"
                });
            });
            await router.dde_listen(7777);

            let response = await   superagent.get("http://localhost:7777");
            expect(response.type).toBe("application/json");
            expect(response.body.json).toBe("hello 1!");

            await router.dde_close();
        });
    });

    describe("dde_setHeader", () => {
        test("should set the response headers", async () => {
            const router = new Router();
            router.dde_common(function (request, response) {
                response.dde_setHeader({
                    "x-powered-by": "XmT",
                    "set-cookie": 123
                });
                response.dde_send();
            });
            await router.dde_listen(7777);

            let response = await superagent.get("http://localhost:7777");
            let headers = response.header;
            expect(headers["x-powered-by"]).toBe("XmT");
            expect(headers["set-cookie"][0]).toBe("123");

            await router.dde_close();
        });

        test("should set content-type to `application/json; charset=utf-8` when send `json`", async () => {
            const router = new Router();
            router.dde_common(function (request, response) {
                response.dde_setHeader({
                    "content-type": "json",
                    "x-powered-by": "XmT"
                });
                response.dde_send();
            });
            await router.dde_listen(7777);

            let response = await superagent.get("http://localhost:7777");
            let headers = response.header;
            expect(headers["content-type"]).toBe("application/json; charset=utf-8");

            await router.dde_close();
        });

        test("should set content-type to `text/html; charset=utf-8` when send `html`", async () => {
            const router = new Router();
            router.dde_common(function (request, response) {
                response.dde_setHeader({
                    "content-type": "html"
                });
                response.dde_send();
            });
            await router.dde_listen(7777);

            let response = await superagent.get("http://localhost:7777");
            let headers = response.header;
            expect(headers["content-type"]).toBe("text/html; charset=utf-8");

            await router.dde_close();
        });

        test("should set content-type to `text/plain; charset=utf-8` when send `text`", async () => {
            const router = new Router();
            router.dde_common(function (request, response) {
                response.dde_setHeader({
                    "content-type": "text"
                });
                response.dde_send();
            });
            await router.dde_listen(7777);

            let response = await superagent.get("http://localhost:7777");
            let headers = response.header;
            expect(headers["content-type"]).toBe("text/plain; charset=utf-8");

            await router.dde_close();
        });

        test("should set content-type to `application/octet-stream` when send `bin`", async () => {
            const router = new Router();
            router.dde_common(function (request, response) {
                response.dde_setHeader({
                    "content-type": "bin"
                });
                response.dde_send();
            });
            await router.dde_listen(7777);

            let response = await superagent.get("http://localhost:7777");
            let headers = response.header;
            expect(headers["content-type"]).toBe("application/octet-stream");

            await router.dde_close();
        });
    });

    describe("dde_setStatus", () => {
        test("should set the response status code", async () => {
            const router = new Router();
            router.dde_common(function (request, response) {
                response.dde_setStatus(717).dde_send();
            });
            await router.dde_listen(7777);

            let response = await superagent.get("http://localhost:7777").ok(() => true);
            let statusCode = response.status;
            expect(statusCode).toBe(717);

            await router.dde_close();
        });
    });
});