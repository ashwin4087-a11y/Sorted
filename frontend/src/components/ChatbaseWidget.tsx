import { useEffect } from 'react';

const CHATBASE_AGENT_ID = 'UaAzV8Ps08YysGmFY15wa';
const CHATBASE_SCRIPT_ID = `chatbase-script-${CHATBASE_AGENT_ID}`;

/**
 * Mounts the Chatbase floating widget while the Dashboard is visible.
 * Cleans up the script and widget DOM elements when unmounted (e.g. on logout).
 * Prevents duplicate scripts and duplicate chat bubbles across re-renders.
 */
export function ChatbaseWidget() {
  useEffect(() => {
    // Already injected — Chatbase handles subsequent calls gracefully.
    if (document.getElementById(CHATBASE_SCRIPT_ID)) return;

    // Initialise the Chatbase stub (same pattern as the official snippet).
    if (!window.chatbase || (window.chatbase as any)('getState') !== 'initialized') {
      (window as any).chatbase = (...args: any[]) => {
        if (!(window as any).chatbase.q) (window as any).chatbase.q = [];
        (window as any).chatbase.q.push(args);
      };
      (window as any).chatbase = new Proxy((window as any).chatbase, {
        get(target, prop) {
          if (prop === 'q') return target.q;
          return (...args: any[]) => target(prop, ...args);
        },
      });
    }

    // Inject the remote script.
    const script = document.createElement('script');
    script.src = 'https://www.chatbase.co/embed.min.js';
    script.id = CHATBASE_SCRIPT_ID;
    (script as any).domain = 'www.chatbase.co';
    document.body.appendChild(script);

    // Cleanup: remove script + all Chatbase iframes/elements on unmount.
    return () => {
      const injected = document.getElementById(CHATBASE_SCRIPT_ID);
      if (injected) injected.remove();

      // Remove the floating bubble iframe and any other Chatbase DOM nodes.
      document
        .querySelectorAll(
          '[id*="chatbase"], [class*="chatbase"], iframe#chatbase-bubble-iframe, iframe#chatbase-message-iframe'
        )
        .forEach((el) => el.remove());

      // Clear the global so a future mount reinitialises cleanly.
      delete (window as any).chatbase;
    };
  }, []);

  // This component renders nothing — the widget is injected by the script.
  return null;
}

// Augment the Window type so TypeScript does not complain.
declare global {
  interface Window {
    chatbase?: any;
  }
}
