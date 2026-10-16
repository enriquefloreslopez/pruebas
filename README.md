# CitaLista

Página web, alta en Google Maps y agenda en línea con confirmación por WhatsApp para negocios que trabajan con citas (estéticas, barberías, consultorios, talleres).

## Qué incluye

| Ruta | Qué es |
| --- | --- |
| `/` | Página de venta: problema, cómo funciona, precios con pago en Stripe, preguntas frecuentes y registro al boletín. |
| `/demo/estetica` | Demo de un negocio ficticio con servicios, agenda en línea, horarios, mapa y WhatsApp. Es lo que se enseña a los clientes potenciales. |
| `/gracias` | Página a la que llega el cliente después de pagar. |
| `/api/checkout` | Crea el pago en Stripe (pago único o suscripción mensual). |
| `/api/stripe/webhook` | Recibe de Stripe la confirmación de pago y te avisa por correo. |
| `/api/reservas` | Recibe las citas de la demo y avisa por correo al negocio y al cliente. |
| `/api/newsletter` | Guarda suscriptores del boletín en Resend. |

Para cambiar nombre, WhatsApp, planes y precios edita `src/lib/site.ts`. Los datos de la estética de ejemplo están en `src/lib/demo.ts`.

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

## Pendientes conocidos

- Las citas no se guardan en una base de datos: llegan por correo y WhatsApp, y no se bloquean horarios ya ocupados. Siguiente paso: agregar una base de datos (por ejemplo Neon o Supabase desde el Marketplace de Vercel).
- Los recordatorios automáticos por WhatsApp requieren la API de WhatsApp Business y aún no están integrados.

## Validación del negocio

Antes de invertir en más funciones, revisa `docs/guion-validacion.md` y habla con al menos 10 negocios.
