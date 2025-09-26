#!/usr/bin/env tsx

/**
 * Environment Variable Validation CLI Tool
 * 
 * Usage:
 *   npm run env:validate
 *   tsx scripts/validate-env.ts
 *   tsx scripts/validate-env.ts --fix
 *   tsx scripts/validate-env.ts --help
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { existsSync } from 'fs';
import { validateEnvironmentVariables, getEnvironmentVariableDefinitions } from '../server/env-validation';

// Load environment variables
const envPath = resolve(process.cwd(), '.env.local');
if (existsSync(envPath)) {
  config({ path: envPath });
}

const COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

function colorize(text: string, color: keyof typeof COLORS): string {
  return `${COLORS[color]}${text}${COLORS.reset}`;
}

function printHeader() {
  console.log(colorize('\n🔧 Environment Variable Validation Tool', 'cyan'));
  console.log(colorize('='.repeat(45), 'cyan'));
}

function printEnvironmentInfo() {
  const nodeEnv = process.env.NODE_ENV || 'development';
  console.log(`\n📋 Environment: ${colorize(nodeEnv, 'yellow')}`);
  
  const envFile = existsSync(envPath) ? '.env.local' : 'No .env file found';
  console.log(`📁 Config file: ${envFile}`);
}

function printValidationResults() {
  const result = validateEnvironmentVariables();
  
  console.log(`\n📊 Validation Results:`);
  console.log(`├── Status: ${result.isValid ? colorize('✅ PASSED', 'green') : colorize('❌ FAILED', 'red')}`);
  console.log(`├── Errors: ${result.errors.length}`);
  console.log(`├── Warnings: ${result.warnings.length}`);
  console.log(`├── Missing Required: ${result.missingRequired.length}`);
  console.log(`├── Missing Recommended: ${result.missingRecommended.length}`);
  console.log(`└── Security Issues: ${result.securityIssues.length}`);

  if (result.errors.length > 0) {
    console.log(colorize('\n❌ Errors:', 'red'));
    result.errors.forEach(error => {
      console.log(`   • ${error}`);
    });
  }

  if (result.warnings.length > 0) {
    console.log(colorize('\n⚠️  Warnings:', 'yellow'));
    result.warnings.forEach(warning => {
      console.log(`   • ${warning}`);
    });
  }

  if (result.securityIssues.length > 0) {
    console.log(colorize('\n🔒 Security Issues:', 'magenta'));
    result.securityIssues.forEach(issue => {
      console.log(`   • ${issue}`);
    });
  }

  if (result.missingRequired.length > 0) {
    console.log(colorize('\n🔴 Missing Required Variables:', 'red'));
    result.missingRequired.forEach(varName => {
      console.log(`   • ${varName}`);
    });
  }

  if (result.missingRecommended.length > 0) {
    console.log(colorize('\n🟡 Missing Recommended Variables:', 'yellow'));
    result.missingRecommended.forEach(varName => {
      console.log(`   • ${varName}`);
    });
  }
}

function printSetupInstructions() {
  if (!existsSync(envPath)) {
    console.log(colorize('\n🚀 Quick Setup:', 'green'));
    console.log('1. Copy the example file:');
    console.log('   cp .env.example .env.local');
    console.log('\n2. Edit .env.local with your configuration');
    console.log('\n3. Run validation again:');
    console.log('   npm run env:validate');
  }
}

function printVariableDefinitions() {
  const defs = getEnvironmentVariableDefinitions();
  
  console.log(colorize('\n📖 Environment Variable Reference:', 'blue'));
  
  const nodeEnv = process.env.NODE_ENV || 'development';
  const requiredVars = nodeEnv === 'production' ? defs.required.production : defs.required.development;
  
  console.log(colorize(`\n🔴 Required (${nodeEnv}):`, 'red'));
  requiredVars.forEach(varName => {
    const hasValidation = defs.hasValidation.includes(varName) ? ' (validated)' : '';
    console.log(`   • ${varName}${hasValidation}`);
  });

  console.log(colorize('\n🟡 Recommended:', 'yellow'));
  defs.recommended.forEach(varName => {
    const hasValidation = defs.hasValidation.includes(varName) ? ' (validated)' : '';
    console.log(`   • ${varName}${hasValidation}`);
  });
}

function printHelp() {
  console.log(colorize('\n📚 Usage:', 'blue'));
  console.log('  npm run env:validate              Validate current environment');
  console.log('  tsx scripts/validate-env.ts       Same as above');
  console.log('  tsx scripts/validate-env.ts --help        Show this help');
  console.log('  tsx scripts/validate-env.ts --definitions Show variable definitions');
  
  console.log(colorize('\n🔧 Environment Files:', 'blue'));
  console.log('  .env.local          Development configuration (not committed)');
  console.log('  .env.example        Template with all variables');
  console.log('  .env.production.template  Production template');
}

function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help')) {
    printHeader();
    printHelp();
    return;
  }

  if (args.includes('--definitions')) {
    printHeader();
    printVariableDefinitions();
    return;
  }

  printHeader();
  printEnvironmentInfo();
  printValidationResults();
  printSetupInstructions();

  const result = validateEnvironmentVariables();
  if (!result.isValid) {
    console.log(colorize('\n💡 Tip: Check .env.example for detailed setup instructions', 'cyan'));
    process.exit(1);
  } else {
    console.log(colorize('\n✅ Environment configuration is valid!', 'green'));
  }
}

// Run the CLI if this file is executed directly
main();

export { main as validateEnvironmentCLI };