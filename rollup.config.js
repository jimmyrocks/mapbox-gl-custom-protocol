// rollup.config.js

import merge from 'deepmerge';
import sourcemaps from 'rollup-plugin-sourcemaps';
import { terser } from "rollup-plugin-terser";
import typescript from '@rollup/plugin-typescript';
import fs from 'fs';

const name = JSON.parse(fs.readFileSync('package.json')).name;
const env = process.env.NODE_ENV  || 'development';

const baseConfig = {
  input: './src/index.ts',
  output: {
    name: 'CustomProtocol'
  },
  treeshake: env === 'production',
  plugins: [typescript()]
};

const configs = [{
  environments: ['production'],
  output: {
    format: 'esm',
    file: `./dist/${name}.esm.js`
  }
},{
  environments: ['development', 'production'],
  output: {
    format: 'umd',
    file: `./dist/${name}.js`
  }
}, {
  environments: ['production'],
  output: {
    format: 'umd',
    file: `./dist/${name}.min.js`,
    sourcemap: true
  },
  plugins: [sourcemaps(), terser()]
}]
  .filter(config => config.environments === undefined || config.environments.indexOf(env) > -1)
  .map(config => {delete config.environments; return config;})
  .map(config => merge(baseConfig, config));

console.log(configs);

export default configs;