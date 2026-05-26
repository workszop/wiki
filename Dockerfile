FROM node:20-alpine
WORKDIR /app

# native module build tools (needed for better-sqlite3)
RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm ci

COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

RUN mkdir -p /data

EXPOSE 3000
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV DB_PATH=/data/wiki.db

CMD ["npm", "start"]
