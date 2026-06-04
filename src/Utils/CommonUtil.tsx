import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';

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

export const getGreeting = () => {
  const hour = new Date().getHours();

  if (hour < 12) {
    return 'Good Morning';
  } else if (hour < 17) {
    return 'Good Afternoon';
  } else {
    return 'Good Evening';
  }
};

export const today= () => {
  const date = new Date();

  const day = date.toLocaleString('en-GB', { day: '2-digit' });
  const month = date.toLocaleString('en-GB', { month: 'short' });
  const year = date.toLocaleString('en-GB', { year: '2-digit' });

  return `${day} ${month}, ${year}`;
};

dayjs.extend(customParseFormat);

export const formatDate = (
  date: string,
  inputFormat?: string,
  outputFormat?: string
): string => {
  if (!date) return '';

  const parsedDate = inputFormat
    ? dayjs(date, inputFormat)
    : dayjs(date);

  return parsedDate.format(outputFormat);
};