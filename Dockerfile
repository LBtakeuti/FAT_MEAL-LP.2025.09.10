FROM node:20-slim

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends curl ca-certificates \
    && rm -rf /var/lib/apt/lists/* \
    && npm install -g pnpm@9

EXPOSE 3010

CMD ["sh", "-c", "pnpm install --fetch-timeout 100000 && pnpm exec next dev -p 3010 -H 0.0.0.0"]
