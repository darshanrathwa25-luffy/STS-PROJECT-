import React from 'react';
import { palette } from '../../theme/palette';

/** Wordmark glyph: a triangle whose three sides are Byrne's three primaries. */
export const ByrneMark: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 22" className={className} aria-hidden="true">
    <path d="M2 20 L12 2.7" stroke={palette.blue} strokeWidth="2.6" strokeLinecap="round" />
    <path d="M12 2.7 L22 20" stroke={palette.red} strokeWidth="2.6" strokeLinecap="round" />
    <path d="M22 20 L2 20" stroke={palette.yellow} strokeWidth="2.6" strokeLinecap="round" />
  </svg>
);
