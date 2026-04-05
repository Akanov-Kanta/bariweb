# BariWeb Accessibility Widget

Modern AI-powered accessibility widget for websites.

## Features
- **AI-powered Chat**: Assistance in finding elements and filling forms.
- **Accessibility Tools**: Text scaling, monochrome mode, dark contrast, and more.
- **Natural Language Support**: Kazakh, Russian, and English.
- **Mobile Friendly**: Fully responsive design.

## Installation

### Via Script Tag
Add the following script to your HTML file:

```html
<script 
  src="https://unpkg.com/bariweb-widget@latest/dist/bariweb.iife.js" 
  client-id="YOUR_CLIENT_ID"
></script>
```

### Via NPM
Install the package:

```bash
npm install bariweb-widget
```

Then import it in your application:

```javascript
import 'bariweb-widget';
```

## Configuration

The widget uses `data-client-id` attribute on the script tag or `client-id` attribute on the `<bw-widget>` element to identify the client.

## License
Proprietary
