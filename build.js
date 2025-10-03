#!/usr/bin/env node

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { resolve } from 'path';
import esbuild from 'esbuild';
import config from './esbuild.config.js';

/**
 * Comprehensive build script with full initialization
 * Ensures all components are properly initialized before building
 */

function logStep(message) {
  console.log(`\n🔧 ${message}`);
}

function logSuccess(message) {
  console.log(`✅ ${message}`);
}

function logWarning(message) {
  console.log(`⚠️  ${message}`);
}

function logError(message) {
  console.error(`❌ ${message}`);
}

async function build() {
  try {
    console.log('\n=== Build Initialization ===\n');
    
    // Step 1: Verify prerequisites
    logStep('Step 1: Verifying prerequisites...');
    try {
      execSync('node --version', { stdio: 'pipe' });
      execSync('npm --version', { stdio: 'pipe' });
      logSuccess('Node.js and npm are installed');
    } catch (error) {
      logError('Required tools are not installed');
      throw error;
    }

    // Step 2: Check for required files
    logStep('Step 2: Checking required files...');
    const requiredFiles = [
      'package.json',
      'tsconfig.json',
      'vite.config.ts',
      'esbuild.config.js',
      'prisma/schema.prisma'
    ];
    
    for (const file of requiredFiles) {
      if (!existsSync(resolve(process.cwd(), file))) {
        logError(`Required file missing: ${file}`);
        process.exit(1);
      }
    }
    logSuccess('All required files present');

    // Step 3: Verify dependencies are installed
    logStep('Step 3: Verifying dependencies...');
    if (!existsSync(resolve(process.cwd(), 'node_modules'))) {
      logWarning('node_modules not found, running npm install...');
      execSync('npm install', { stdio: 'inherit' });
    } else {
      logSuccess('Dependencies are installed');
    }

    // Step 4: Type checking
    logStep('Step 4: Running TypeScript type checking...');
    try {
      execSync('npx tsc --noEmit', { stdio: 'inherit' });
      logSuccess('Type checking passed');
    } catch (error) {
      logError('Type checking failed');
      throw error;
    }

    // Step 5: Generate Prisma client
    logStep('Step 5: Generating Prisma client...');
    execSync('npx prisma generate', { stdio: 'inherit' });
    
    // Verify Prisma client was generated
    if (!existsSync(resolve(process.cwd(), 'generated/prisma'))) {
      logError('Prisma client generation failed');
      process.exit(1);
    }
    logSuccess('Prisma client generated successfully');
    
    // Step 6: Build frontend
    logStep('Step 6: Building frontend with Vite...');
    execSync('npx vite build', { stdio: 'inherit' });
    
    // Verify frontend build output
    if (!existsSync(resolve(process.cwd(), 'dist/public'))) {
      logError('Frontend build failed - dist/public not found');
      process.exit(1);
    }
    logSuccess('Frontend built successfully');
    
    // Step 7: Build backend
    logStep('Step 7: Building backend with esbuild...');
    await esbuild.build(config);
    
    // Verify backend build output
    if (!existsSync(resolve(process.cwd(), 'dist/index.js'))) {
      logError('Backend build failed - dist/index.js not found');
      process.exit(1);
    }
    logSuccess('Backend built successfully');
    
    // Step 8: Post-build verification
    logStep('Step 8: Running post-build verification...');
    const buildArtifacts = [
      'dist/index.js',
      'dist/public/index.html',
      'generated/prisma/index.js',
      'generated/prisma/libquery_engine-debian-openssl-3.0.x.so.node'
    ];
    
    let allArtifactsPresent = true;
    for (const artifact of buildArtifacts) {
      const artifactPath = resolve(process.cwd(), artifact);
      if (!existsSync(artifactPath)) {
        logWarning(`Build artifact missing: ${artifact}`);
        allArtifactsPresent = false;
      }
    }
    
    if (allArtifactsPresent) {
      logSuccess('All build artifacts verified');
    } else {
      logWarning('Some build artifacts are missing - deployment may fail');
    }
    
    // Build summary
    console.log('\n=== Build Summary ===\n');
    logSuccess('Build completed successfully!');
    console.log('\n📦 Build Artifacts:');
    console.log('  - dist/index.js (backend)');
    console.log('  - dist/public/ (frontend)');
    console.log('  - generated/prisma/ (database client)');
    console.log('\n🚀 Deployment Instructions:');
    console.log('  1. Deploy dist/ directory');
    console.log('  2. Deploy generated/prisma/ directory');
    console.log('  3. Deploy node_modules/ (production dependencies)');
    console.log('  4. Set NODE_ENV=production');
    console.log('  5. Set PORT environment variable');
    console.log('  6. Ensure all required environment variables are configured');
    console.log('\n✓ Build initialization complete\n');
  } catch (error) {
    logError('Build failed');
    console.error(error);
    process.exit(1);
  }
}

build();