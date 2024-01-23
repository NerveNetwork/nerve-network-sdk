import { nodeResolve } from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import terser from '@rollup/plugin-terser'
import { babel } from '@rollup/plugin-babel'
import json from '@rollup/plugin-json'
import externals from "rollup-plugin-node-externals";

export default {
  input: './src/index.js',
  output: [
    {
      dir: 'dist/cjs',
      format: 'cjs',
      sourcemap: true,
      // plugins: [terser()]
    },
    {
      dir: 'dist/esm',
      format: 'esm',
      sourcemap: true,
      // plugins: [terser()]
    },
    {
      dir: 'dist/umd',
      format: 'umd',
      name: 'nerveswap-sdk',
      sourcemap: true,
      // plugins: [terser()]
    }
  ],
  treeshake: true,
  plugins: [
    nodeResolve(),
    externals({
      devDeps: false,
    }),
    commonjs(),
    /* json(),*/
    babel({
      babelHelpers: 'runtime',
      exclude: 'node_modules/**'
    }) 
  ]
}
