/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['cesium'],
  webpack: (config, { webpack }) => {
    // 1. Intercept and strip the strict "node:" URI prefix
    config.plugins.push(
      new webpack.NormalModuleReplacementPlugin(/^node:/, (resource) => {
        resource.request = resource.request.replace(/^node:/, '');
      })
    );

    // 2. Mathematically destroy the backend leaks so the browser doesn't panic
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      worker_threads: false,
      module: false, // <-- THIS IS THE NEW SHIELD
    };

    return config;
  },
};

export default nextConfig;