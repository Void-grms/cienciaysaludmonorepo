FROM node:22-bullseye-slim

WORKDIR /app

COPY . .

RUN rm -rf node_modules frontend/portal-paciente/dist \
    && find . -name '*.tsbuildinfo' -not -path './node_modules/*' -delete 2>/dev/null || true

RUN npm install

RUN npm run build --workspace=frontend/portal-paciente \
    && test -f frontend/portal-paciente/dist/index.html \
    || (echo "!!! portal-paciente build did NOT produce dist/index.html"; find frontend/portal-paciente/dist -type f 2>/dev/null; exit 1)

WORKDIR /app/frontend/portal-paciente

CMD ["node", "start.mjs"]
