declare global {
  const describe: (name: string, fn: () => void) => void;
  const test: (name: string, fn: () => void) => void;
  const expect: (value: any) => {
    toBeUndefined: () => void;
    toBeDefined: () => void;
    toBe: (expected: any) => void;
    toContain: (expected: string) => void;
  };
}
export {};
