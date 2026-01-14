import type { NextConfig } from "next";
const withPWA = require("next-pwa")({
  dest: "public",
  disable: true, // 프로세스 안정화될 때까지 잠정 비활성화 (보안 우선)
  register: false,
  skipWaiting: true,
  runtimeCaching: []
});

const nextConfig: NextConfig = {
  /* config options here */
  turbopack: {},
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate'
          },
          {
            key: 'Pragma',
            value: 'no-cache'
          },
          {
            key: 'Expires',
            value: '0'
          }
        ],
      },
    ]
  },
};

export default withPWA(nextConfig);
