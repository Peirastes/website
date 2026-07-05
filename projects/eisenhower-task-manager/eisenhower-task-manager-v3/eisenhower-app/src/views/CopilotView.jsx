import React from 'react';

/**
 * CopilotView — embeds the standalone Copilot PWA (/chat) as an ETM tab so the
 * agent chat is available on desktop/tablet, not just the phone. Reuses the full
 * Copilot verbatim (streaming, hats, pipelines, model toggle, markdown, stop) via
 * a same-origin iframe; ?embed=1 tells the Copilot to drop its own outer chrome so
 * ETM frames it. Same origin → shared localStorage, so login persists across both.
 */
export const CopilotView = () => (
  <iframe
    src="/chat?embed=1"
    title="Peirastes Copilot"
    style={{ flex: 1, width: '100%', minHeight: 0, border: 'none', background: 'transparent' }}
  />
);
