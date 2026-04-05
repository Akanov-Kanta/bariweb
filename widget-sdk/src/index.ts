import { client } from './lib/api/client.gen.js';

// Function to get the client ID from the DOM
const getClientId = () => {
    // 1. Try to get it from the <bw-widget> element attribute
    const widget = document.querySelector('bw-widget');
    const widgetId = widget?.getAttribute('client-id');
    if (widgetId) return widgetId;

    // 2. Fallback to current script or script with bariweb.js in the name
    const currentScript = document.currentScript as HTMLScriptElement || document.querySelector('script[src*="bariweb"]');
    let id = currentScript?.getAttribute('data-client-id');
    
    if (!id) {
        // 3. Last resort: just find ANY script with the data-client-id attribute
        const anyScript = document.querySelector('script[data-client-id]');
        id = anyScript?.getAttribute('data-client-id') || '';
    }

    return (id as string) || (window as any).__BARIWEB_CLIENT_ID__ || '';
};

const initialClientId = getClientId();

// Expose globally so ChatController's fetch can access it (legacy support)
(window as any).__BARIWEB_CLIENT_ID__ = initialClientId;

// Configure the global API client
client.setConfig({
    baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:8000',
});

// Intercept requests to inject the X-Client-ID header on SDK calls
client.interceptors.request.use((request) => {
    // Look up the ID dynamically for each request in case it was set after initialization
    const currentId = getClientId();
    request.headers.set('X-Client-ID', currentId);
    return request;
});

import './widget.js';


