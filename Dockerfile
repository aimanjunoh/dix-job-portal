FROM node:20-slim

WORKDIR /app

# Install build dependencies for better-sqlite3
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package.json package-lock.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Build frontend
RUN npm run build

# Remove dev dependencies to save space
RUN npm prune --omit=dev && npm install tsx better-sqlite3 bcryptjs express express-session cors

# Expose port
ENV PORT=3001
ENV NODE_ENV=production
EXPOSE 3001

# Start the server
CMD ["npx", "tsx", "server/index.ts"]
