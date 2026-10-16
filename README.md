# CitaLista

Plataforma para conseguir clientes a negocios locales que trabajan con citas: el cliente final ve horarios libres y aparta en línea, y el negocio recibe la cita en vivo en su panel. Empieza con barberías en Salamanca, pero sirve para cualquier giro.

## Qué incluye

| Ruta | Qué es |
| --- | --- |
| `/` | Portada para el cliente final, con ciudades y categorías. |
| `/[ciudad]/[categoria]` | Lista de negocios (ej. `/salamanca/barberias`) con precios y preguntas frecuentes, preparada para Google y asistentes de IA. |
| `/n/[negocio]` | Página del negocio con servicios, horario, mapa y apartado de citas con horarios libres en vivo. |
| `/panel/[negocio]?k=…` | Panel privado del negocio: citas del día en vivo, confirmar, atendida, no llegó. |
| `/admin?k=…` | Resultados del piloto: citas por canal (TikTok, Instagram, QR…) y por negocio, y links de cada panel. |
| `/admin/setup/[negocio]?k=…` | Setup de cada negocio nuevo: revisión automática, ficha oficial para copiar, pasos de Google, Bing, Apple y redes, QR de reseñas y pruebas en asistentes de IA. |
| `/llms.txt` | Resumen del sitio para asistentes de IA. |
| `/para-negocios` | Página de venta para negocios, con planes y pago en Stripe. |
| `/api/citas`, `/api/disponibilidad`, `/api/panel`, `/api/admin` | Agenda: apartar, horarios libres, panel y administración. |
| `/api/checkout`, `/api/stripe/webhook` | Cobros con Stripe. |
| `/api/newsletter` | Suscriptores del boletín en Resend. |

## Agregar un negocio o un giro nuevo

Todo vive en `src/data/catalogo.ts`:

- **Negocio:** agrégalo a `negocios` con sus servicios, precios, horario y `capacidad` (cuántas citas atiende a la vez). Pide permiso al dueño antes de publicarlo.
- **Giro nuevo** (dentistas, talleres…): agrégalo a `categorias`.
- **Ciudad nueva:** agrégala a `ciudades`.

Los negocios con `demo: true` se muestran como "Ejemplo" y no se indexan en Google.

## Setup de un negocio nuevo (SEO e IA)

Desde `/admin` entra a **Setup SEO e IA** de cada negocio y sigue las secciones en orden. Los perfiles que captures (Google Maps, reseñas, Bing, redes) se publican solos en la página del negocio como datos estructurados (`sameAs`), y el link de reseñas activa el botón **Pedir reseña** en la agenda cuando una cita queda atendida. El avance se guarda en la tabla `setup`.

## Medir de dónde llegan las citas

Comparte el link del negocio con `?ref=` según el canal, por ejemplo `/n/mi-barberia?ref=tiktok` o `?ref=qr`. El panel de administración agrupa las citas por ese canal.

Para cambiar nombre, WhatsApp, planes y precios de venta edita `src/lib/site.ts`.

## Correr en tu computadora

```bash
npm install
cp .env.example .env.local   # y llena los valores
npm run dev                  # abre http://localhost:3000
```

El sitio funciona aunque falten las llaves: las citas se confirman por WhatsApp, y los botones de pago y de boletín muestran un aviso de que aún no están configurados.

## Publicar en Vercel

1. Entra a [vercel.com/new](https://vercel.com/new) e importa este repositorio de GitHub.
2. En **Environment Variables** agrega las variables de `.env.example`.
3. Pulsa **Deploy**. Cada push a la rama principal publica una nueva versión.

## Configurar Stripe (cobros)

1. Crea tu cuenta en [stripe.com](https://stripe.com) y activa los pagos en México.
2. Copia la llave secreta (**Developers > API keys**) en `STRIPE_SECRET_KEY`. Empieza con `sk_test_...` para probar con la tarjeta `4242 4242 4242 4242`.
3. En **Developers > Webhooks** crea un endpoint con la URL `https://TU-DOMINIO/api/stripe/webhook` y el evento `checkout.session.completed`. Copia el *Signing secret* en `STRIPE_WEBHOOK_SECRET`.
4. Los precios se definen en `src/lib/site.ts`; no hace falta crear productos en Stripe.

## Configurar Resend (correos y boletín)

1. Crea tu cuenta en [resend.com](https://resend.com) y copia la API key en `RESEND_API_KEY`.
2. Verifica tu dominio en **Domains** y pon un remitente de ese dominio en `RESEND_FROM_EMAIL`. Sin dominio verificado, Resend solo te entrega correos a ti.
3. Para el boletín, crea un segmento en **Audience** y pon su ID en `RESEND_SEGMENT_ID`. Desde ahí mismo envías los boletines con **Broadcasts**.

## Base de datos

Las citas se guardan en Postgres. En Vercel: **Storage → Create Database → Neon**, conéctala al proyecto y Vercel agrega `DATABASE_URL` solo. La tabla se crea sola en la primera cita. Sin base de datos, el sitio funciona y el apartado se cambia a WhatsApp.

## Pendientes conocidos

- El panel se actualiza cada 15 segundos; los avisos por WhatsApp automáticos requieren la API de WhatsApp Business.

## Validación del negocio

Antes de invertir en más funciones, revisa `docs/guion-validacion.md` y habla con al menos 10 negocios.
