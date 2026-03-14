FROM oven/bun:alpine AS builder

WORKDIR /app

COPY package.json bun.lock ./

RUN bun install --frozen-lockfile

COPY . .

FROM oven/bun:alpine

WORKDIR /app

COPY --from=builder /app .

EXPOSE 3000

CMD [ "bun", "run", "app.ts" ]
