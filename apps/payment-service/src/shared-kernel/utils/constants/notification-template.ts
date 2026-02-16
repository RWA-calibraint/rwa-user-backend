export const NOTIFICATION_TEMPLATES = {
  payments: (amount: number) => `You have successfully paid "$${amount}".`,
  payments_notify_admin: (amount: number) =>
    `Received payment of [$${amount}] successfully`,
};
