import { defineConfig } from '@hey-api/openapi-ts';

export default defineConfig({
  input: 'https://aidyn-backend.gitlabapp.alem.ai/openapi.json',
  output: 'src/lib/api',
  plugins: [
    '@hey-api/typescript',
    '@hey-api/client-fetch',
    {
      name: '@hey-api/sdk',
      operations: {
        strategy: 'byTags',
      },
    },
  ],
});