import { Url } from "url";

/**
 * Strim url with the `base` string.
 *
 * @param parsedUrl The parsed url object
 * @param base The base string being strimed
 */
export function strimPath(parsedUrl: Url, base: string) {
  let pathAndHash = parsedUrl.path!;

  if (parsedUrl.hash) {
    pathAndHash = pathAndHash.concat(parsedUrl.hash);
  }

  return pathAndHash.substring(base === "/" ? 0 : base.length);
}
