import requestIp from "request-ip";
import { IRequestProto } from "../interface";

export const requestProto: IRequestProto = {
  getIp() {
    return requestIp.getClientIp(this);
  }
};
