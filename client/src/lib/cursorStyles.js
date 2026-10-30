const STYLE_ELEMENT_ID = 'ct-yjs-cursor-styles';

export function updateCursorStyles(awareness) {
  if (typeof document === 'undefined') return;

  let styleEl = document.getElementById(STYLE_ELEMENT_ID);
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = STYLE_ELEMENT_ID;
    document.head.appendChild(styleEl);
  }

  const states = awareness.getStates();
  let css = `
    .yRemoteSelectionHead {
      position: absolute !important;
      box-sizing: border-box !important;
      height: 100% !important;
      border-left: 2px solid;
    }
    .yRemoteSelectionHead::after {
      position: absolute !important;
      top: -1.4em !important;
      left: -2px !important;
      font-size: 11px !important;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
      font-weight: 500 !important;
      line-height: normal !important;
      padding: 1px 5px !important;
      border-radius: 3px !important;
      white-space: nowrap !important;
      pointer-events: none !important;
      user-select: none !important;
      z-index: 50 !important;
      box-shadow: 0 1px 4px rgba(0,0,0,0.3) !important;
    }
  `;

  states.forEach((state, clientID) => {
    if (clientID === awareness.clientID) return;
    if (!state || !state.user) return;

    const { name, color } = state.user;
    const safeColor = color || '#38bdf8';
    const safeName = (name || 'Anonymous').replace(/"/g, '\\"');

    const bgOpacityColor =
      safeColor.startsWith('#') && safeColor.length === 7
        ? `${safeColor}33`
        : 'rgba(56, 189, 248, 0.2)';

    css += `
      .yRemoteSelection-${clientID} {
        background-color: ${bgOpacityColor} !important;
      }
      .yRemoteSelectionHead-${clientID} {
        border-left-color: ${safeColor} !important;
      }
      .yRemoteSelectionHead-${clientID}::after {
        content: "${safeName}" !important;
        background-color: ${safeColor} !important;
        color: #ffffff !important;
      }
    `;
  });

  styleEl.textContent = css;
}

export function cleanupCursorStyles() {
  if (typeof document === 'undefined') return;
  const styleEl = document.getElementById(STYLE_ELEMENT_ID);
  if (styleEl) {
    styleEl.remove();
  }
}
