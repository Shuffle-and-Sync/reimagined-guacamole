#!/usr/bin/env node

import { execSync } from 'child_process';
import esbuild from 'esbuild';
import config from './esbuild.config.js';

async function build() {
  try {
    console.log('Building frontend with Vite...');
    execSync('npx vite build', { stdio: 'inherit' });
    
    console.log('Building backend with esbuild...');
    await esbuild.build(config);
    
    console.log('Build completed successfully!');
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

build();