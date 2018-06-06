export function getHHMMSS(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  totalSeconds %= 3600;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (isNaN(hours) || isNaN(minutes) || isNaN(seconds) || !totalSeconds) {
    return '00:00:00';
  }
  return convertDecimal(hours) + ':' + convertDecimal(minutes) + ':' + convertDecimal(seconds);
}

export const convertDecimal = (time: number): string => time < 10 ? '0' + time : time.toString();
