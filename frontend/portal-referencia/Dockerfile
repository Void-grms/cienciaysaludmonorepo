FROM node:22-bullseye-slim

WORKDIR /app

COPY . .

RUN rm -rf node_modules frontend/portal-referencia/dist \
    && find . -name '*.tsbuildinfo' -not -path './node_modules/*' -delete 2>/dev/null || true

RUN npm install

# Vite envs are baked at build time. Railway passes service env vars as
# build args when declared here.
ARG VITE_API_URL
ARG VITE_ENV
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_ENV=$VITE_ENV

RUN echo "=== vite build envs ===" \
    && echo "VITE_API_URL=$VITE_API_URL" \
    && echo "VITE_ENV=$VITE_ENV" \
    && if [ -z "$VITE_API_URL" ]; then echo "!! VITE_API_URL is empty at build time"; exit 1; fi \
    && npm run build --workspace=frontend/portal-referencia \
    && test -f frontend/portal-referencia/dist/index.html \
    || (echo "!!! portal-referencia build did NOT produce dist/index.html"; find frontend/portal-referencia/dist -type f 2>/dev/null; exit 1)

WORKDIR /app/frontend/portal-referencia

CMD ["node", "start.mjs"]
