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
      
      // Externalize the entire vite.ts file and anything vite-related
      if (args.path === './vite' || args.path === './vite.js' || args.path.endsWith('/vite.ts') ||
          args.path.endsWith('/vite.js') || args.path === './server/vite' || args.path === 'server/vite' ||
          args.path === './static-server' && args.importer.includes('vite')) {
        return { path: args.path, external: true };
      }
      
      // Externalize vite and vite-related paths specifically
      if (args.path.includes('vite.config') || args.path === 'vite' || 
          args.path.startsWith('@vitejs/') || args.path.startsWith('@replit/vite-') ||
          args.path === '../vite.config.js' || args.path.endsWith('vite.config.js') ||
          args.path.endsWith('vite.config.ts')) {
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
    '@shared': path.resolve(process.cwd(), 'shared'),
    '@assets': path.resolve(process.cwd(), 'attached_assets'),
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
  // Handle Node.js globals properly
  external: [
    'node:*',
    // Vite and related dependencies - completely external
    'vite',
    'vite/*',
    '@vitejs/*', 
    '@replit/vite-*',
    '../vite.config.js',
    './vite.js', 
    './vite',
    // Prisma related
    '@prisma/client',
    '@prisma/client/*',
    '@prisma/client/runtime/library',
    '@prisma/client/runtime/query_engine*',
    '@prisma/engines',
    '@prisma/engines-version',
    'prisma/libquery_engine*',
    'generated/prisma/*'
  ]
};

export default config;

// Run the build if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  esbuild.build(config).catch(() => process.exit(1));
}