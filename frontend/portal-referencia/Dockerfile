FROM node:22-bullseye-slim

WORKDIR /app

COPY . .

RUN rm -rf node_modules frontend/portal-referencia/dist \
    && find . -name '*.tsbuildinfo' -not -path './node_modules/*' -delete 2>/dev/null || true

RUN npm install

RUN npm run build --workspace=frontend/portal-referencia \
    && test -f frontend/portal-referencia/dist/index.html \
    || (echo "!!! portal-referencia build did NOT produce dist/index.html"; find frontend/portal-referencia/dist -type f 2>/dev/null; exit 1)

WORKDIR /app/frontend/portal-referencia

CMD ["node", "start.mjs"]
