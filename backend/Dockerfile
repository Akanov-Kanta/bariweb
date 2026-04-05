# --- Build Frontend ---
FROM node:20-slim AS frontend-builder
WORKDIR /build-frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ .
ENV NEXT_PUBLIC_API_URL=/ 
RUN npm run build

# --- Build Python Backend ---
FROM python:3.11-slim
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy backend and rag requirements
COPY backend/requirements.txt ./backend_reqs.txt
COPY rag-pipeline/requirements.txt ./rag_reqs.txt
RUN pip install --no-cache-dir -r backend_reqs.txt && pip install --no-cache-dir -r rag_reqs.txt

# Copy everything
COPY . .

# Copy built frontend to backend static folder
COPY --from=frontend-builder /build-frontend/out ./backend/static

# Create logs directory
RUN mkdir -p /applogs && touch /applogs/app.logs

# Command to run both (Backend on 80, RAG on 8001)
EXPOSE 80
EXPOSE 8001
CMD ["sh", "-c", "uvicorn backend.app.main:app --host 0.0.0.0 --port 80 > /applogs/app.logs 2>&1 & uvicorn rag-pipeline.api.app:create_app --factory --host 0.0.0.0 --port 8001"]
