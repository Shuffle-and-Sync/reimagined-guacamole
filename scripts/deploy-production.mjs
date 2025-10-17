import { execSync } from 'child_process';
import os from 'os';

// --- Configuration ---
const PROJECT_ID = process.env.PROJECT_ID;
const REGION = process.env.REGION || 'us-central1';

// --- Color Logging ---
const colors = {
    blue: '\x1b[34m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    nc: '\x1b[0m',
};

const log = (color, type, message) => console.log(`${color}[${type}]${colors.nc} ${message}`);
const printStatus = (message) => log(colors.blue, 'INFO', message);
const printSuccess = (message) => log(colors.green, 'SUCCESS', message);
const printWarning = (message) => log(colors.yellow, 'WARNING', message);
const printError = (message) => log(colors.red, 'ERROR', message);

// --- Helper Functions ---
function run(command) {
    try {
        execSync(command, { stdio: 'inherit' });
    } catch (error) {
        printError(`Command failed: ${command}`);
        process.exit(1);
    }
}

function commandExists(command) {
    try {
        const checkCmd = os.platform() === 'win32' ? 'where' : 'command -v';
        execSync(`${checkCmd} ${command}`, { stdio: 'ignore' });
        return true;
    } catch (error) {
        return false;
    }
}

// --- Deployment Steps ---
function checkPrerequisites() {
    printStatus('Checking prerequisites...');
    ['gcloud', 'docker', 'npm'].forEach(cmd => {
        if (!commandExists(cmd)) {
            printError(`${cmd} CLI is required but not installed. Aborting.`);
            process.exit(1);
        }
    });
    printSuccess('All prerequisites are installed');
}

function validateEnvironment() {
    printStatus('Validating environment variables...');
    if (!PROJECT_ID) {
        printError('PROJECT_ID environment variable is required. Aborting.');
        process.exit(1);
    }
    if (!process.env.REGION) {
        printWarning('REGION not set, defaulting to us-central1');
    }
    printSuccess('Environment variables validated');
}

function runTests() {
    printStatus('Running tests...');
    run('npm test');
    printSuccess('All tests passed');
}

function buildApplication() {
    printStatus('Building application...');
    run('npm run build');
    printSuccess('Application built successfully');
}

function deployBackend() {
    printStatus('Deploying backend service...');
    run(`gcloud builds submit --config cloudbuild.yaml --substitutions="_REGION=${REGION}" --project="${PROJECT_ID}"`);
    printSuccess('Backend deployed successfully');
}

function deployFrontend() {
    printStatus('Deploying frontend service...');
    run(`gcloud builds submit --config cloudbuild-frontend.yaml --substitutions="_REGION=${REGION}" --project="${PROJECT_ID}"`);
    printSuccess('Frontend deployed successfully');
}

// --- Main Execution ---
function main() {
    console.log('🚀 Starting production deployment for Shuffle & Sync');
    console.log('==================================================');
    
    checkPrerequisites();
    validateEnvironment();
    runTests();
    buildApplication();
    deployBackend();
    deployFrontend();
    
    console.log('');
    printSuccess('Production deployment process completed successfully!');
    printStatus('Check the Google Cloud console for service URLs and status.');
}

main();
