FROM node:22-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
ARG VITE_API_URL=""
ENV VITE_API_URL=${VITE_API_URL}
RUN npm run build

FROM node:22-alpine
WORKDIR /app/backend

COPY backend/package*.json ./
RUN npm ci

COPY backend/ ./
COPY --from=frontend-builder /app/frontend/dist /app/frontend/dist

ENV PORT=3000
EXPOSE $PORT

CMD ["node", "--import", "tsx", "src/server.ts"]
