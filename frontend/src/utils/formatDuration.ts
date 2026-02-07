export const formatDaysAsWeeks = (days: number): string => {
  if (days < 7) return `Day ${days}`;
  const weeks = Math.floor(days / 7);
  const remainingDays = days % 7;
  if (remainingDays === 0) return `Week ${weeks}`;
  return `Week ${weeks}, Day ${remainingDays}`;
};

export const formatDurationRange = (minDays: number, maxDays: number): string => {
  if (minDays < 7 && maxDays < 7) return `${minDays}-${maxDays} days`;
  const minWeeks = Math.floor(minDays / 7);
  const maxWeeks = Math.floor(maxDays / 7);
  if (minWeeks === maxWeeks) {
    return `${minWeeks} week${minWeeks > 1 ? 's' : ''} (${minDays}-${maxDays} days)`;
  }
  return `${minWeeks}-${maxWeeks} weeks (${minDays}-${maxDays} days)`;
};
