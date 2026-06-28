import { getRelativeTime } from '@/core/utils/moment';

export const formatNotificationRelativeTime = (createdTime?: number) => {
  if (!createdTime) return '';
  const relative = getRelativeTime(createdTime);
  return relative ? `${relative} trước` : '';
};
