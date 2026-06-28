export type NotificationType = 'TICKET' | 'INFO' | (string & {});

export type AppNotification = {
  id: number;
  createdTime: number;
  title: string;
  type: NotificationType;
  isSeen: boolean;
  content: string;
};
