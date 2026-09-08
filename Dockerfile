FROM node:22-bookworm-slim AS web
WORKDIR /app
COPY frontend/package.json frontend/yarn.lock ./frontend/
RUN cd frontend && corepack yarn install --frozen-lockfile
COPY frontend ./frontend
RUN cd frontend && npm run build
FROM node:22-bookworm-slim
ENV NODE_ENV=production PORT=3000 DATA_DIR=/app/data
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY src ./src
COPY app-core ./app-core
COPY public ./public
COPY index.js ./
COPY --from=web /app/frontend/build ./frontend/build
RUN mkdir -p /app/data && chown -R node:node /app
USER node
EXPOSE 3000
CMD ["node","index.js"]
