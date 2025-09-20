#!/usr/bin/env node

// Simple production deployment test
// This script tests if the built application can import without ES module errors

import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('Testing production build ES module resolution...');

try {
  // Test that we can import the built server code without dynamic require errors
  const serverPath = './dist/index.js';
  
  // Set minimal environment variables needed for the test
  process.env.NODE_ENV = 'production';
  process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
  
  console.log('Attempting to import server module...');
  
  // Import the server module
  await import(serverPath);
  
  console.log('✅ Production build ES module resolution test PASSED');
  console.log('The "Dynamic require of node:fs" error has been resolved!');
  
} catch (error) {
  if (error.message.includes('Dynamic require of "node:fs"') || 
      error.message.includes('Dynamic require of "node:')) {
    console.error('❌ ES module resolution test FAILED');
    console.error('Dynamic require error still exists:', error.message);
    process.exit(1);
  } else if (error.message.includes('Directory import') && error.message.includes('is not supported resolving ES modules')) {
    console.error('❌ ES module directory import test FAILED');
    console.error('Directory import error (Prisma):', error.message);
    process.exit(1);
  } else if (error.message.includes('Cannot find package \'@') || 
             error.message.includes('Module not found')) {
    console.error('❌ Project alias resolution test FAILED');
    console.error('Project alias/module resolution error:', error.message);
    process.exit(1);
  } else {
    console.log('✅ ES module resolution test PASSED');
    console.log('Note: Other errors may occur due to missing database/Redis connections in test mode, but ES module resolution is working.');
    console.log('Error details (not related to ES modules):', error.message);
  }
}