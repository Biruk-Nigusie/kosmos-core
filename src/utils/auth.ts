import { randomInt } from "node:crypto";
export const generateSecureCode = (): string => {
  return randomInt(100000, 1000000).toString();
};
