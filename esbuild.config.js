import esbuild from 'esbuild';
import path from 'path';

// Plugin to externalize node_modules packages (simplified)
const externalizeNodeModulesPlugin = {
  name: 'externalize-node-modules',
  setup(build) {
    build.onResolve({ filter: /.*/ }, (args) => {
      // Skip project aliases - let them be resolved by esbuild's alias feature
      if (args.path.startsWith('@shared') || args.path.startsWith('@assets')) {
        return; // Let esbuild handle these
      }
      
      // Externalize Node.js built-ins
      if (args.path.startsWith('node:')) {
        return { path: args.path, external: true };
      }
      
      // Externalize real node_modules packages (normal and scoped)
      if (args.path.match(/^[^@./]/) || // matches normal package names like 'express'
          args.path.match(/^@[^/]+\/[^/]+/)) { // matches scoped packages like @prisma/client
        return { path: args.path, external: true };
      }
      
      // Externalize relative paths to generated directories
      if (args.path.includes('generated/prisma')) {
        return { path: args.path, external: true };
      }
    });
  }
};

const config = {
  entryPoints: ['server/index.ts'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  outdir: 'dist',
  packages: 'external',
  plugins: [externalizeNodeModulesPlugin],
  // Use esbuild's built-in alias feature for project aliases
  alias: {
    '@shared': path.resolve(import.meta.dirname, 'shared'),
    '@assets': path.resolve(import.meta.dirname, 'attached_assets'),
  },
  // Handle .node files and other binary modules
  loader: {
    '.node': 'copy'
  },
  // Ensure proper module resolution for ES modules
  banner: {
    js: `
import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
global.__filename = __filename;
global.__dirname = __dirname;
    `.trim()
  },
  // Handle Node.js globals properly
  define: {
    'global': 'globalThis',
  },
  // Minimize only external references
  minify: false,
  // Keep names for better debugging
  keepNames: true,
  // Target Node.js
  target: 'node18',
  // Ignore these patterns when bundling
  external: [
    'node:*',
    '@prisma/client',
    '@prisma/client/*',
    '@prisma/client/runtime/library',
    '@prisma/client/runtime/query_engine*',
    '@prisma/engines',
    '@prisma/engines-version',
    'prisma/libquery_engine*',
    'generated/prisma/**'
  ]
};

export default config;

// Run the build if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  esbuild.build(config).catch(() => process.exit(1));
}