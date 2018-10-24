import debug from "debug";
import path from "path";

export function Debug(filename: string) {
  return debug(`server-router:${path.basename(filename, ".js")} ---> `);
}
