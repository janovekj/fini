export const isFunction = (arg: any): arg is Function =>
  typeof arg === "function";

export const isString = (arg: any): arg is string => typeof arg === "string";

export const isObject = (arg: any): arg is object => typeof arg === "object";
