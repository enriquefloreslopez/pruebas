#!/usr/bin/env bash
# Prepara un equipo Linux de pocos recursos (1-2 GB de RAM) para correr la plataforma:
# crea memoria de intercambio (swap) si hace falta y limita los registros del sistema.
# Uso: sudo bash scripts/preparar-equipo.sh
set -euo pipefail

if [ "$(id -u)" -ne 0 ]; then
  echo "Corre este script con sudo." >&2
  exit 1
fi

ram_mb=$(awk '/MemTotal/ {print int($2 / 1024)}' /proc/meminfo)
swap_mb=$(awk '/SwapTotal/ {print int($2 / 1024)}' /proc/meminfo)
echo "RAM: ${ram_mb} MB · Swap actual: ${swap_mb} MB · Procesador: $(uname -m)"

case "$(uname -m)" in
  x86_64 | aarch64 | arm64) ;;
  *)
    echo "Este procesador ($(uname -m)) no es compatible: se necesita x64 o ARM de 64 bits." >&2
    exit 1
    ;;
esac

# Swap de 2 GB en equipos con menos de 3 GB de RAM: evita que una actualización o un pico tumbe el sistema.
if [ "$ram_mb" -lt 3072 ] && [ "$swap_mb" -lt 1024 ]; then
  echo "Creando swap de 2 GB en /swapfile…"
  fallocate -l 2G /swapfile || dd if=/dev/zero of=/swapfile bs=1M count=2048
  chmod 600 /swapfile
  mkswap /swapfile >/dev/null
  swapon /swapfile
  grep -q '^/swapfile ' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

# Usar el swap solo cuando de verdad haga falta (cuida las tarjetas SD y discos baratos).
echo 'vm.swappiness=10' > /etc/sysctl.d/99-citas.conf
sysctl -q -p /etc/sysctl.d/99-citas.conf

# Registros del sistema con tamaño máximo.
if [ -d /etc/systemd/journald.conf.d ] || mkdir -p /etc/systemd/journald.conf.d; then
  printf '[Journal]\nSystemMaxUse=100M\n' > /etc/systemd/journald.conf.d/99-citas.conf
  systemctl restart systemd-journald 2>/dev/null || true
fi

echo "Listo. Swap: $(awk '/SwapTotal/ {print int($2 / 1024)}' /proc/meminfo) MB"
if [ "$ram_mb" -lt 2048 ]; then
  echo "Con menos de 2 GB de RAM usa la imagen ya compilada (IMAGEN_APP en .env) en vez de compilar aquí."
fi
