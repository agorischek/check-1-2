export function add(a: number, b: number): number {
  const unused = 42; // This will cause a lint error
  return a + b;
}

export function multiply(a: number, b: number): number {
  return a * b;
}


