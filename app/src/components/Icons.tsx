import type { ViewId } from '../app/types';

interface IconProps {
  name: ViewId;
}

export function WorkflowIcon({ name }: IconProps) {
  if (name === 'investigate') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="10.5" cy="10.5" r="5.5" />
        <path d="m15 15 4.5 4.5M8.5 10.5h4M10.5 8.5v4" />
      </svg>
    );
  }

  if (name === 'challenge') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M3 18 8 12l4 3 8-10M3 21h18" />
        <path d="M16 5h4v4" />
      </svg>
    );
  }

  if (name === 'validate') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="5" y="3" width="14" height="18" rx="1" />
        <path d="M8.5 8h7M8.5 12h7M8.5 16h3" />
        <path d="m13.5 16 1.5 1.5 3-3" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 4h16v13H8l-4 3V4Z" />
      <path d="M8 9h8M8 13h6" />
    </svg>
  );
}
