/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  async rewrites() {
    return [
      {
        source: '/gallery',
        destination: '/index.html',
      },
      {
        source: '/canvas',
        destination: '/index.html',
      },
    ];
  },
};

export default nextConfig;
