export const getTimeAgo = (minutesAgo: number): string => {

  if (minutesAgo < 1) {
    return 'Just now';
  }

  if (minutesAgo < 60) {
    return `${minutesAgo} min ago`;
  }

  const hours = Math.floor(minutesAgo / 60);

  if (hours < 24) {
    return `${hours} hr ago`;
  }

  const days = Math.floor(hours / 24);

  return `${days} day ago`;
};

export const ASSIGNED = 'ASSIGNED';
export const ON_THE_WAY = 'ON_THE_WAY';
export const DELIVERED = 'DELIVERED';