'use client';
interface LocalTimeProps {
  timestamp: Date;
}
// claude helped alot here....
export default function LocalTime({ timestamp }: LocalTimeProps) {
  // Convert to date if string next js serialize it is when user clicked on start server time
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  // get user's timezone
  const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  // Format as required
  const formatted = date.toLocaleString('en-US', {
    timeZone: userTimeZone,
    dateStyle: 'medium',
    timeStyle: 'short',
  });
  return <span suppressHydrationWarning>{formatted}</span>;
}
