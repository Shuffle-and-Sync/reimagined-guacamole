FROM node:18

WORKDIR /app

# Set git configuration to use modern branch naming
RUN git config --global init.defaultBranch main

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies needed for build)
# Use --legacy-peer-deps to handle @sqlitecloud/drivers React Native peer deps
# (The package works fine in Node.js despite the peer dependency warnings)
RUN npm ci --legacy-peer-deps

# Copy application code
COPY . .

# Build the application with full initialization
# This ensures Prisma client generation, type checking, and all build steps
RUN npm run build

# Remove devDependencies to reduce image size (but keep production deps)
RUN npm prune --production --legacy-peer-deps

# Set production environment
ENV NODE_ENV=production

# Expose port 8080 for Cloud Run
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:8080/api/health || exit 1

# Start the application
CMD ["node", "dist/index.js"]