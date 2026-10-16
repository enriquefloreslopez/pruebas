# Alojamiento de la plataforma

La plataforma viene empaquetada con Docker: la app, la base de datos PostgreSQL, el túnel de Cloudflare y los respaldos diarios. El mismo paquete sirve para los tres escenarios.

| Escenario | Para qué | Notas |
| --- | --- | --- |
| **Servidor en tu casa** (nube propia) | Todos los negocios en una sola instalación | Recomendado para el piloto. Necesita no-break y respaldos fuera de casa. |
| **Servidor rentado** (VPS) | Lo mismo, pero sin depender de tu luz ni tu internet | El paso natural cuando haya varios negocios pagando. Mismos archivos. |
| **Equipo en el local** | Un negocio que quiere su agenda dentro de su red | La página de citas sale a internet; la agenda solo abre en el local. |

## Lo que necesitas

- Una computadora con **Ubuntu** que quede encendida siempre (una mini PC sirve).
- **Docker** con Compose: <https://docs.docker.com/engine/install/ubuntu/>
- Un **dominio administrado en Cloudflare** (plan gratis) para el túnel.
- Un **no-break** para el equipo y el módem.

## Consumo de recursos

Medido con el paquete funcionando y los límites de memoria puestos:

| Momento | App | Base de datos | Total |
| --- | --- | --- | --- |
| En reposo | ~39 MB | ~27 MB | **~67 MB** |
| 6,000 visitas con 50 a la vez | ~65 MB | ~35 MB | **~100 MB** |

Cada servicio tiene un tope de memoria (app 320 MB, base de datos 256 MB, túnel 128 MB, respaldos 64 MB) y los registros de Docker se limitan a 10 MB por servicio. El túnel de Cloudflare y el sistema operativo suman aparte.

**Compilar sí pesa (~1.5 GB por un par de minutos).** En equipos de 1-2 GB usa la imagen ya compilada:

1. En GitHub: **Actions → Imagen Docker → Run workflow**, con tu dirección pública. Compila para x64 y ARM64.
2. En el equipo, pon en `.env`: `IMAGEN_APP=ghcr.io/<tu-usuario>/<tu-repo>:nube`
3. Si el repositorio es privado, inicia sesión una vez: `docker login ghcr.io` (usuario de GitHub y un token con permiso `read:packages`).
4. Instala o actualiza con: `docker compose pull && docker compose up -d --no-build`

### Equipos compatibles

| Equipo | ¿Sirve? |
| --- | --- |
| Linux x64 / ARM64 (mini PC, Raspberry Pi 4/5 con sistema de 64 bits) | ✅ |
| Windows x64 con Docker Desktop | ✅ (configura inicio automático y sin suspensión) |
| x86 de 32 bits o ARM de 32 bits | ❌ |

Con 1 GB de RAM funciona usando la imagen compilada y swap; con 2 GB va cómodo.

### Preparar un equipo pequeño

```bash
sudo bash scripts/preparar-equipo.sh
```

Revisa que el procesador sea compatible, crea 2 GB de swap si hay menos de 3 GB de RAM, hace que el sistema use el swap solo cuando haga falta (cuida tarjetas SD y discos baratos) y limita los registros del sistema a 100 MB.

## 1. Crear el túnel de Cloudflare

El túnel publica el sitio sin abrir puertos del módem.

1. Entra a <https://one.dash.cloudflare.com/> → **Networks → Tunnels → Create a tunnel** (tipo *Cloudflared*).
2. Copia el **token** que aparece en *Install connector*. Va en `CLOUDFLARE_TUNNEL_TOKEN`.
3. En **Public Hostname** agrega tu dirección (ej. `citas.tudominio.com`) con servicio `HTTP` → `app:3000`.

## 2. Instalar

```bash
git clone <tu repositorio> citas && cd citas
cp .env.docker.example .env
nano .env        # llena los valores (ver abajo)
docker compose up -d --build
```

Para generar contraseñas y llaves al azar:

```bash
openssl rand -hex 24
```

Todo vuelve a arrancar solo si el equipo se reinicia.

### Valores del `.env`

- `NEXT_PUBLIC_SITE_URL`: la dirección pública del túnel.
- `POSTGRES_PASSWORD`, `PANEL_SECRET`, `ADMIN_KEY`: textos al azar (solo letras y números en la contraseña).
- `CLOUDFLARE_TUNNEL_TOKEN`: el token del paso 1.
- Stripe y Resend: las mismas llaves que en Vercel.

## 3. Actualizar

```bash
git pull
docker compose up -d --build                         # equipo normal
docker compose pull && docker compose up -d --no-build   # con IMAGEN_APP
```

## 4. Respaldos

- El servicio `respaldos` guarda una copia diaria en la carpeta `respaldos/` y conserva los últimos 14 días.
- **Copia esa carpeta fuera del equipo** al menos cada semana (USB, Google Drive, otro equipo). Si el disco se daña, ahí están las citas.
- Restaurar un respaldo:

```bash
gunzip -c respaldos/citas-AAAA-MM-DD.sql.gz | docker compose exec -T db psql -U citas citas
```

## Equipo dentro de un negocio (opción local)

En el **Setup** del negocio elige *Alojamiento → Equipo en el local*: ahí está la lista de pasos y las líneas exactas para su `.env`:

```bash
SOLO_NEGOCIO=slug-del-negocio   # el sitio muestra solo este negocio
PANEL_SOLO_LOCAL=true           # agenda y administración solo desde la red del local
APP_BIND=0.0.0.0                # los equipos del local abren http://IP-DEL-EQUIPO:3000
```

- Todo lo que entra desde internet pasa por Cloudflare; con `PANEL_SOLO_LOCAL=true` la agenda responde «solo abre desde la red del local» a esas visitas.
- **No abras el puerto 3000 en el módem.** El único acceso desde internet debe ser el túnel.
- Riesgos: si en el local se va la luz o el internet, o apagan el equipo, nadie puede apartar. El dueño no verá su agenda fuera del local.

## Migrar a un servidor rentado

1. Haz un respaldo y cópialo al servidor nuevo.
2. Instala igual (pasos 2 y 3) con el mismo `.env`.
3. Restaura el respaldo.
4. En Cloudflare, el túnel nuevo usa la misma dirección pública; apaga el anterior.
