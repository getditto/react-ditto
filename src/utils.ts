export function isString (obj: unknown): obj is string {
  return (Object.prototype.toString.call(obj) === '[object String]');
}