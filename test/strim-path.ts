import { parse } from "url";
import { strimPath } from "../lib/helper/strim-path";

/**********************************************************************************************************************/
describe("strimPath()", () => {
  test("should strim path with base path", () => {
    const parsedUrl = parse("http://localhost:8080/test/who?q=b&a=b#haha");

    let strimedPath = strimPath(parsedUrl, "/test");

    expect(strimedPath).toEqual("/who?q=b&a=b#haha");

    strimedPath = strimPath(parsedUrl, "/");

    expect(strimedPath).toEqual("/test/who?q=b&a=b#haha");
  });
});
