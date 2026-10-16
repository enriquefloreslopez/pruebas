import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Paquete autónomo para correr en Docker (servidor propio o equipo en el local).
  output: "standalone",
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
