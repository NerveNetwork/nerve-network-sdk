import { defineConfig } from 'rollup'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import terser from '@rollup/plugin-terser'
import { babel } from '@rollup/plugin-babel'
import json from '@rollup/plugin-json'
import externals from 'rollup-plugin-node-externals'
import globals from 'rollup-plugin-node-globals'
import builtins from 'rollup-plugin-node-builtins'
import nodePolyfills from 'rollup-plugin-polyfill-node';
import { wasm } from '@rollup/plugin-wasm';

const config = defineConfig([
  {
    input: './src/index.js',
    output: [
      {
        dir: 'dist/cjs',
        format: 'cjs',
        sourcemap: true
        // plugins: [terser()]
      },
      {
        dir: 'dist/esm',
        format: 'esm',
        sourcemap: true
        // plugins: [terser()]
      }
    ],
    treeshake: true,
    plugins: [
      nodeResolve(),
      externals({
        devDeps: false
      }),
      commonjs(),
      /* json(), */
      babel({
        /* babelHelpers: 'runtime',
        exclude: 'node_modules/**' */
      })
    ]
  },
  {
    input: './src/index.js',
    output: [
      {
        dir: 'dist/umd',
        format: 'umd',
        name: 'nerveswap',
      }
    ],
    plugins: [
      nodeResolve({ preferBuiltins: true, mainFields: ['browser'] }),
      commonjs(),
      babel({
        /* babelHelpers: 'runtime',
        include: 'node_modules/**' */
        // exclude: 'node_modules/**'
      }),
      nodePolyfills(),
      wasm(),
      json(),
      // globals(),
      // builtins(),
      terser()
    ]
  }
])

/* export default {
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
      name: 'nerveswap',
      sourcemap: true,
      plugins: [terser()]
    }
  ],
  treeshake: true,
  plugins: [
    nodeResolve(),
    externals({
      devDeps: false,
    }),
    commonjs(),
    // json(),
    babel({
      babelHelpers: 'runtime',
      exclude: 'node_modules/**'
    }) 
  ]
} */

export default config
