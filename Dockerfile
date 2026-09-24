# Build multi-stage: gera o frontend, gera o backend e depois monta a
# imagem final, que sobe o Express servindo a API e os arquivos do React.

# ---------- 1) build do frontend ----------
FROM node:22-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# ---------- 2) build do backend ----------
FROM node:22-alpine AS backend-build
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm install
COPY backend/ ./
RUN npm run build

# ---------- 3) imagem final, só com o necessário para rodar ----------
FROM node:22-alpine
WORKDIR /app

COPY backend/package*.json ./
RUN npm install --omit=dev

COPY --from=backend-build /app/backend/dist ./dist
COPY --from=backend-build /app/backend/sql ./sql
COPY --from=frontend-build /app/frontend/dist ./public

ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "dist/server.js"]
