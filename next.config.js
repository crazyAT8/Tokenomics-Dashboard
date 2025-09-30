/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  images: {
    domains: ['assets.coingecko.com'],
  },
  env: {
    COINGECKO_API_URL: 'https://api.coingecko.com/api/v3',
  },
}

module.exports = nextConfig
