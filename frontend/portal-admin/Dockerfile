FROM node:22-bullseye-slim

WORKDIR /app

COPY . .

RUN rm -rf node_modules frontend/portal-admin/dist \
    && find . -name '*.tsbuildinfo' -not -path './node_modules/*' -delete 2>/dev/null || true

RUN npm install

RUN npm run build --workspace=frontend/portal-admin \
    && test -f frontend/portal-admin/dist/index.html \
    || (echo "!!! portal-admin build did NOT produce dist/index.html"; find frontend/portal-admin/dist -type f 2>/dev/null; exit 1)

WORKDIR /app/frontend/portal-admin

CMD ["node", "start.mjs"]
