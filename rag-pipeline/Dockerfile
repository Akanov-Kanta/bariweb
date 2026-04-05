FROM mcr.microsoft.com/playwright/python:v1.40.0-jammy

WORKDIR /app

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# ALEMPLUS REQUIREMENT: Playwright browsers must be available
RUN playwright install chromium

# Copy application code
COPY . .

# Create logs directory
RUN mkdir -p /applogs && touch /applogs/app.logs

# ALEMPLUS REQUIREMENT: Port 80
EXPOSE 80

# Command to run the application, logging to file
CMD ["sh", "-c", "uvicorn api.app:create_app --factory --host 0.0.0.0 --port 80 > /applogs/app.logs 2>&1"]
