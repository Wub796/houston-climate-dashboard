const fs = require('fs-extra');

const cesiumSource = 'node_modules/cesium/Build/Cesium';
const cesiumDest = 'public/cesium';

fs.copySync(cesiumSource, cesiumDest, { overwrite: true });
console.log('Cesium assets copied to public/cesium');