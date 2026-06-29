import { useEffect } from 'react';

// Transient notification that auto-dismisses. Exercises appear/disappear waiting
// in tests (toast is removed from the DOM after `duration` ms).
export default function Toast({ message, duration = 3000, onDismiss }) {
  useEffect(() => {
    if (!message) return undefined;
    const timer = setTimeout(onDismiss, duration);
    return () => clearTimeout(timer);
  }, [message, duration, onDismiss]);

  if (!message) return null;

  return (
    <div className="toast" role="status" data-testid="toast">
      {message}
    </div>
  );
}
