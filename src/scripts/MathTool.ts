export const mod = (n: number, m: number): number => ((n % m) + m) % m;

export const randRange = (min: number, max: number): number => {
  if (max == null) {
    max = min;
    min = 0;
  }
  return Math.floor(Math.random() * (max - min)) + min;
};
