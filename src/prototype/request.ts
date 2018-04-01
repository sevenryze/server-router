// Import node.js libraries

// Import third party libraries
import * as requestIp from "request-ip";

// Import own libraries

/**********************************************************************************************************************/
export const requestProto: RequestProto = {
  dde_getIp: function() {
    return requestIp.getClientIp(this);
  }
};

export interface RequestProto {
  /**
   * Get the client ip.
   *
   * <pre>
   * Examples:
   *  request.dde_getIp();
   *  // => "127.0.0.1"
   * </pre>
   *
   * Notes:
   *  Be able to handle the proxy situation.
   */
  dde_getIp: () => string;
}
