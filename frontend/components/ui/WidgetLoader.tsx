"use client";

import { useEffect, useState } from "react";

export function WidgetLoader() {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    console.log('Loading bariweb-widget...');
    // Dynamically import the widget only on the client side
    // @ts-ignore
    import('bariweb-widget')
      .then(() => {
        console.log('bariweb-widget loaded successfully');
        setIsLoaded(true);
      })
      .catch((err) => {
        console.error('bariweb-widget loading failed:', err);
      });
  }, []);

  if (!isLoaded) return null;

  return (
    <bw-widget 
      client-id="yj8x8HW5"
      style={{
        position: 'fixed',
        bottom: '24px',
        left: '24px',
        zIndex: 2147483647,
        pointerEvents: 'auto',
        '--bw-primary': 'var(--accent-lime, #c8ff00)',
        '--bw-primary-light': '#d4ff33',
        '--bw-primary-fg': '#05050a', 
        '--bw-primary-faded': 'rgba(200, 255, 0, 0.15)',
        '--bw-bg': '#0a0a0f',
        '--bw-fg': '#ffffff',
        '--bw-fg-muted': '#a1a1aa',
        '--bw-border': '#1f1f23',
        '--bw-bg-hover': '#121217',
        '--bw-bg-subtle': '#05050a',
        '--bw-radius': '1.5rem',
        '--bw-radius-sm': '0.75rem'
      } as any}
    ></bw-widget>
  );
}
