FROM node:22-bullseye-slim

WORKDIR /app

# Copy entire workspace (.dockerignore should exclude node_modules / dist / build artifacts)
COPY . .

# Wipe any cached build artifacts that may have come through
RUN rm -rf packages/contracts/dist \
           node_modules/@lis/contracts \
           backend/dist \
           backend/tsconfig.build.tsbuildinfo \
    && find . -name '*.tsbuildinfo' -not -path './node_modules/*' -delete 2>/dev/null || true

# Install all workspace dependencies
RUN npm install

# Build the contracts package
RUN npm run build --workspace=packages/contracts \
    && echo "=== packages/contracts/dist ===" \
    && ls -la packages/contracts/dist

# Replace the workspace symlink with a physical copy so backend resolves @lis/contracts cleanly
RUN rm -rf node_modules/@lis/contracts \
    && mkdir -p node_modules/@lis \
    && cp -rL packages/contracts node_modules/@lis/contracts \
    && echo "=== node_modules/@lis/contracts/dist ===" \
    && ls -la node_modules/@lis/contracts/dist

# Build the backend
RUN npm run build --workspace=backend \
    && echo "=== backend/dist tree ===" \
    && find backend/dist -maxdepth 3 -type f | head -40

# Fail fast if main.js wasn't emitted
RUN test -f backend/dist/main.js \
    || (echo "!!! backend/dist/main.js was NOT produced"; find backend/dist -type f; exit 1)

# Generate Prisma client
WORKDIR /app/backend
RUN npx prisma generate

# Default runtime command: apply schema then start
CMD ["sh", "-c", "npx prisma db push --skip-generate && node dist/main"]
