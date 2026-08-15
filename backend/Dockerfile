FROM mcr.microsoft.com/playwright/python:v1.49.0-noble

# Install Node.js 20.x
RUN apt-get update && apt-get install -y curl && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy backend source files
COPY . .

# Install Node.js dependencies
RUN npm install --only=production

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Install Playwright Chromium browser binary
RUN npx playwright install chromium

# Make start script executable
RUN chmod +x start.sh

EXPOSE 10000

# Launch both services in single instance
CMD ["./start.sh"]
