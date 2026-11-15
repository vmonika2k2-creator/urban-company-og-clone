import React from 'react';

export default function Tooltip({ message }) {
  return <div className="coolcare-tooltip" role="status" aria-live="polite">{message}</div>;
}
