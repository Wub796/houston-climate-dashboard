/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['resium', 'cesium'],
  webpack: (config, { isServer }) => {
    config.externals = config.externals || [];

    if (isServer) {
      config.externals.push('cesium', 'resium');
    }

    // Fix Cesium's import.meta usage without babel-loader
    config.module.rules.push({
      test: /\.js$/,
      include: /node_modules\/cesium/,
      type: 'javascript/auto',
    });

    config.module.rules.push({
      test: /node_modules\/cesium/,
      resolve: { fullySpecified: false },
    });

    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      url: false,
    };

    return config;
  },
  // No output: 'standalone' — Vercel handles this itself
};

export default nextConfig;