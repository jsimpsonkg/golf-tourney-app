// Sum a side's strokes (or the pars) over a set of hole indices.
export const sumAt = (values: (number | null)[], holes: number[]) =>
  holes.reduce<number>((sum, i) => sum + (values[i] ?? 0), 0);

// Total strokes relative to par, over the holes played so far.
export const relToPar = (strokes: (number | null)[], pars: number[]) => {
  const diff = pars.reduce<number>(
    (acc, par, i) =>
      strokes[i] == null ? acc : acc + (strokes[i] as number) - par,
    0,
  );
  if (diff === 0) return "E";
  return diff > 0 ? `+${diff}` : `${diff}`;
};
