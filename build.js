#!/usr/bin/env node

import { execSync } from 'child_process';
import esbuild from 'esbuild';
import config from './esbuild.config.js';

async function build() {
  try {
    console.log('Generating Prisma client...');
    execSync('npx prisma generate', { stdio: 'inherit' });
    
    console.log('Building frontend with Vite...');
    execSync('npx vite build', { stdio: 'inherit' });
    
    console.log('Building backend with esbuild...');
    await esbuild.build(config);
    
    console.log('Build completed successfully!');
    console.log('Important: Deploy both dist/ and generated/prisma/ directories');
    console.log('Set NODE_ENV=production when running the built application');
    console.log('Verify that generated/prisma contains the query engine binaries');
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

build();