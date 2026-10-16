#!/usr/bin/env bash
# Prepara un equipo Linux de pocos recursos (1-2 GB de RAM) para correr la plataforma:
# revisa que el sistema sea de 64 bits, crea memoria de intercambio (swap) si hace falta,
# activa los límites de memoria en Raspberry Pi y limita los registros del sistema.
# Uso: sudo bash scripts/preparar-equipo.sh
#      bash scripts/preparar-equipo.sh --revisar   (solo revisa el equipo, no cambia nada)
set -euo pipefail

reiniciar=0
ram_mb=$(awk '/MemTotal/ {print int($2 / 1024)}' /proc/meminfo)
swap_mb=$(awk '/SwapTotal/ {print int($2 / 1024)}' /proc/meminfo)

# El kernel puede ser de 64 bits con el sistema de 32 (pasa en Raspberry Pi OS de 32 bits):
# uname -m dice aarch64, pero Docker bajaría imágenes de 32 bits que no existen para el túnel.
# Por eso se revisa el sistema (bits de usuario y arquitectura de paquetes), no solo el kernel.
kernel=$(uname -m)
bits=$(getconf LONG_BIT)
paquetes=$(dpkg --print-architecture 2>/dev/null || echo "?")
echo "RAM: ${ram_mb} MB · Swap: ${swap_mb} MB · Kernel: ${kernel} · Sistema: ${bits} bits (${paquetes})"

case "$kernel" in
  x86_64 | aarch64 | arm64) ;;
  *)
    echo "Procesador no compatible (${kernel}): se necesita x64 o ARM de 64 bits." >&2
    exit 1
    ;;
esac
if [ "$bits" != "64" ] || { [ "$paquetes" != "?" ] && [ "$paquetes" != "amd64" ] && [ "$paquetes" != "arm64" ]; }; then
  echo "El procesador es de 64 bits pero el sistema instalado es de 32 (${paquetes})." >&2
  echo "Reinstala la versión de 64 bits del sistema (en Raspberry Pi: «Raspberry Pi OS (64-bit)»)." >&2
  exit 1
fi

if [ "${1:-}" = "--revisar" ]; then
  echo "Equipo compatible."
  exit 0
fi

if [ "$(id -u)" -ne 0 ]; then
  echo "Corre este script con sudo." >&2
  exit 1
fi

# Swap de 2 GB en equipos con menos de 3 GB de RAM: evita que una actualización o un pico tumbe el sistema.
if [ "$ram_mb" -lt 3072 ] && [ "$swap_mb" -lt 1024 ]; then
  echo "Creando swap de 2 GB en /swapfile…"
  fallocate -l 2G /swapfile 2>/dev/null || dd if=/dev/zero of=/swapfile bs=1M count=2048 status=none
  chmod 600 /swapfile
  mkswap /swapfile >/dev/null
  swapon /swapfile
  grep -q '^/swapfile ' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

# Usar el swap solo cuando de verdad haga falta (cuida las tarjetas SD y discos baratos).
echo 'vm.swappiness=10' > /etc/sysctl.d/99-citas.conf
sysctl -q -p /etc/sysctl.d/99-citas.conf

# Sin el control de memoria del kernel, Docker ignora los límites de memoria de cada servicio.
# En Raspberry Pi suele venir apagado; se activa en la línea de arranque.
if ! grep -qw memory /sys/fs/cgroup/cgroup.controllers 2>/dev/null; then
  arranque=""
  for f in /boot/firmware/cmdline.txt /boot/cmdline.txt; do
    [ -f "$f" ] && arranque=$f && break
  done
  if [ -n "$arranque" ]; then
    if ! grep -q 'cgroup_memory=1' "$arranque"; then
      cp "$arranque" "${arranque}.respaldo"
      sed -i '1 s/$/ cgroup_enable=memory cgroup_memory=1/' "$arranque"
      echo "Control de memoria activado en ${arranque} (copia en ${arranque}.respaldo)."
      reiniciar=1
    fi
  else
    echo "Aviso: el kernel no tiene control de memoria; Docker ignorará los límites de memoria." >&2
  fi
fi

# Registros del sistema con tamaño máximo.
mkdir -p /etc/systemd/journald.conf.d
printf '[Journal]\nSystemMaxUse=100M\n' > /etc/systemd/journald.conf.d/99-citas.conf
systemctl restart systemd-journald 2>/dev/null || true

echo "Listo. Swap: $(awk '/SwapTotal/ {print int($2 / 1024)}' /proc/meminfo) MB"
if [ "$ram_mb" -lt 2048 ]; then
  echo "Con menos de 2 GB de RAM usa la imagen ya compilada (IMAGEN_APP en .env) en vez de compilar aquí."
fi
if [ "$reiniciar" -eq 1 ]; then
  echo "Reinicia el equipo (sudo reboot) antes de instalar la plataforma."
fi
