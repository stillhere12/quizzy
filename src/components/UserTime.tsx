'use client';
import { useEffect, useState } from 'react';

export default function UserTime() {
  const [userTimeZone, setUserTimeZone] = useState<string | null>(
    Intl.DateTimeFormat().resolvedOptions().timeZone
  );
  // error because it was empty string now corrected..
  const utcDate = new Date();
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: userTimeZone || undefined,
    dateStyle: 'full',
    timeStyle: 'long',
  });
  const localTime = formatter.format(utcDate);
  useEffect(() => {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    setUserTimeZone(timezone);
  }, []);
  if (!userTimeZone) return <p>Loading...</p>;
  return (
    <div>
      <p>Timezone: {userTimeZone}</p>
      <p>Local Time: {localTime}</p>
    </div>
  );
}
