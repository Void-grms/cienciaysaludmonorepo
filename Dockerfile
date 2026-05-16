FROM node:22-bullseye-slim

WORKDIR /app

COPY . .

# Wipe any cached build artifacts that may have come through
RUN rm -rf node_modules \
           packages/contracts/dist \
           backend/dist \
           backend/tsconfig.build.tsbuildinfo \
           frontend/portal-admin/dist \
           frontend/portal-paciente/dist \
           frontend/portal-referencia/dist \
    && find . -name '*.tsbuildinfo' -not -path './node_modules/*' -delete 2>/dev/null || true

# Install all workspace dependencies
RUN npm install

# Build the contracts package
RUN npm run build --workspace=packages/contracts \
    && echo "=== packages/contracts/dist ===" \
    && ls -la packages/contracts/dist

# Replace workspace symlink with a physical copy so backend resolves @lis/contracts cleanly
RUN rm -rf node_modules/@lis/contracts \
    && mkdir -p node_modules/@lis \
    && cp -rL packages/contracts node_modules/@lis/contracts

# Build the backend
RUN npm run build --workspace=backend \
    && test -f backend/dist/main.js \
    || (echo "!!! backend/dist/main.js was NOT produced"; find backend/dist -type f; exit 1)

# Vite envs are baked at build time. Railway forwards service env vars as
# Docker build args when the names match. Empty defaults so backend builds
# (no VITE_API_URL on backend service) don't fail.
ARG VITE_API_URL=""
ARG VITE_ENV=""
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_ENV=$VITE_ENV
RUN echo "=== vite build envs ===" \
    && echo "VITE_API_URL=$VITE_API_URL" \
    && echo "VITE_ENV=$VITE_ENV"

# Build all three frontends. Each frontend service deploy uses its own
# VITE_API_URL value above; the dispatcher only serves the matching dist.
RUN npm run build --workspace=frontend/portal-admin \
    && test -f frontend/portal-admin/dist/index.html
RUN npm run build --workspace=frontend/portal-paciente \
    && test -f frontend/portal-paciente/dist/index.html
RUN npm run build --workspace=frontend/portal-referencia \
    && test -f frontend/portal-referencia/dist/index.html

# Generate Prisma client (so backend image runtime has it)
RUN cd backend && npx prisma generate

# Runtime: dispatcher picks the right service based on RAILWAY_SERVICE_NAME
CMD ["node", "start.mjs"]
