const nextConfig = {
  transpilePackages: ['resium'],
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [...(config.externals || []), 'cesium', 'resium'];
    } else {
      // Map `import X from 'cesium'` to `window.Cesium.X` at runtime
      config.externals = [...(config.externals || []), { cesium: 'Cesium' }];
    }

    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      url: false,
    };

    return config;
  },
};

export default nextConfig;