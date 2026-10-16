# Imagen de producción de la plataforma (servidor propio o equipo en el local).

FROM node:22-alpine AS dependencias
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS compilacion
WORKDIR /app
COPY --from=dependencias /app/node_modules ./node_modules
COPY . .
# Las variables NEXT_PUBLIC_ se escriben en el código del navegador al compilar.
ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_WHATSAPP_NUMBER
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
    NEXT_PUBLIC_WHATSAPP_NUMBER=$NEXT_PUBLIC_WHATSAPP_NUMBER \
    NEXT_TELEMETRY_DISABLED=1
RUN mkdir -p public && npm run build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0
RUN addgroup -S app && adduser -S app -G app
COPY --from=compilacion --chown=app:app /app/.next/standalone ./
COPY --from=compilacion --chown=app:app /app/.next/static ./.next/static
COPY --from=compilacion --chown=app:app /app/public ./public
USER app
EXPOSE 3000
CMD ["node", "server.js"]
