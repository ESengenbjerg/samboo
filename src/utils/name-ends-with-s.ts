export function nameEndsWithS(name: string): string {
  return /[sxz]$/i.test(name) ? name : `${name}s`;
}
