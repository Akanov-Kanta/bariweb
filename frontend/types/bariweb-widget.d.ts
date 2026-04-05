import type React from 'react';

declare module 'bariweb-widget';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'bw-widget': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        'client-id'?: string;
      };
    }
  }
  namespace React {
    namespace JSX {
      interface IntrinsicElements {
        'bw-widget': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
          'client-id'?: string;
        };
      }
    }
  }
}
