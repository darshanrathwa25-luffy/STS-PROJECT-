import React from 'react';

/** Attribution for code this site builds on. Keep it visible wherever the disk lab is described. */
export const Credits: React.FC = () => (
  <div className="text-[13px] leading-relaxed text-ink-muted space-y-1">
    <p>
      The Poincaré disk geometry is ported from{' '}
      <a
        href="https://github.com/ItsNickBarry/hyperbolic-canvas"
        target="_blank"
        rel="noopener noreferrer"
        className="underline decoration-rule-strong underline-offset-4 hover:text-ink"
      >
        hyperbolic-canvas
      </a>{' '}
      by Nick Barry, under the MIT licence.
    </p>
    <p>The colours follow Oliver Byrne's 1847 edition of Euclid's Elements.</p>
  </div>
);
