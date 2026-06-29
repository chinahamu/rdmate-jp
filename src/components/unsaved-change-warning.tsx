'use client';

import { useEffect } from 'react';

type UnsavedChangeWarningProps = Readonly<{
  enabled?: boolean;
  message?: string;
}>;

export function UnsavedChangeWarning({
  enabled = true,
  message = '未保存の変更があります。',
}: UnsavedChangeWarningProps) {
  useEffect(() => {
    if (!enabled) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = message;
      return message;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [enabled, message]);

  return null;
}
