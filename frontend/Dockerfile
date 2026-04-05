# Build stage
FROM node:20-slim AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm install

# Copy application code
COPY . .

# Set production environment variables
ENV NEXT_PUBLIC_API_URL=https://aidyn-backend.gitlabapp.alem.ai
ENV NODE_ENV=production

# Build the project
RUN npm run build

# Production stage (Lightweight Nginx)
FROM nginx:alpine

# Copy built static files to nginx
COPY --from=builder /app/out /usr/share/nginx/html

# Replace default nginx config to handle SPA routing if needed
# (Assuming 'output: export' in next.config.ts)

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
