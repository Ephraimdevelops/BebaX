const nextConfig = {
  output: 'standalone',
  images: {
    unoptimized: true,
  },
  experimental: {
    // Remove if not using Server Components
    // Remove if not using Server Components
    serverComponentsExternalPackages: ['mongodb'],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack(config) {
    // Exclude mobile directories from webpack builds
    config.watchOptions = {
      ...config.watchOptions,
      poll: 2000,
      aggregateTimeout: 300,
      ignored: [
        '**/node_modules/**',
        '**/native/**',
        '**/bebax-mobile/**',
      ],
    };
    return config;
  },
  onDemandEntries: {
    maxInactiveAge: 10000,
    pagesBufferLength: 2,
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "ALLOWALL" },
          { key: "Content-Security-Policy", value: "frame-ancestors *;" },
          { key: "Access-Control-Allow-Origin", value: process.env.CORS_ORIGINS || "*" },
          { key: "Access-Control-Allow-Methods", value: "GET, POST, PUT, DELETE, OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "*" },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
