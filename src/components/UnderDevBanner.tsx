import React from 'react';

export function UnderDevBanner({ className }: { className?: string }) {
  return (
    <div
      className={`fixed top-4 right-4 z-50 p-3 rounded shadow-md bg-yellow-200 text-yellow-900 border border-yellow-300 ${className ?? ''}`}
    >
      🚧 This feature is under development.
    </div>
  );
}
