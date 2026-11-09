const RATINGS = [
  'Little Baby Snejok',
  'Snejok Jr.',
  'Snejok',
  'SnowMan Snejok',
  'Mr.Snejok',
  'Great Mr.Snejok',
  'The Greatest Mr.Snejok',
  'The Greatest SnowMan of the World',
  'SnowGOD',
  'GOD of SnowDash!',
];

export function getRating(levelIndex: number): string {
  const i = Math.max(0, Math.min(levelIndex, RATINGS.length - 1));
  return RATINGS[i];
}
