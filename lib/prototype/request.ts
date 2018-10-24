import { IncomingMessage } from "http";
import requestIp from "request-ip";
import { IRequestProto } from "../interface";

export const requestProto: IRequestProto = {
  dd_getIp() {
    return requestIp.getClientIp((this as unknown) as IncomingMessage);
  }
};
