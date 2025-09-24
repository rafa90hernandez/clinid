/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        // tudo que começar com /api vai para o serviço da API no compose
        source: '/api/:path*',
        destination: 'http://api:3001/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
