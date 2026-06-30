import { spawnSync, execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.join(__dirname, '..');

// ── CLI Parsing ──
const args = process.argv.slice(2);
const envIdx = args.indexOf('--env');
const targetEnv = envIdx !== -1 && args[envIdx + 1] ? args[envIdx + 1].toLowerCase() : null;

if (!targetEnv || !['staging', 'production'].includes(targetEnv)) {
    console.error('❌ Usage: node scripts/orchestrate-deploy.js --env <staging|production>');
    process.exit(1);
}

const isProd = targetEnv === 'production';

console.log(`
╔══════════════════════════════════════════════════════════════╗
║        🚀 WeDecide Orchestrator: ${targetEnv.toUpperCase().padEnd(20)}        ║
╚══════════════════════════════════════════════════════════════╝
`);

// ── Helpers ──
function runStep(name, command, argsArr = []) {
    console.log(`\n▶️  Step: ${name}`);
    console.log(`   Running: ${command} ${argsArr.join(' ')}\n`);
    
    const result = spawnSync(command, argsArr, { 
        stdio: 'inherit', 
        cwd: ROOT_DIR,
        shell: true 
    });

    if (result.status !== 0) {
        console.error(`\n❌ Step Failed: ${name}`);
        console.error(`   The command exited with status ${result.status}.`);
        console.error(`💡 Tip: Run '${command} ${argsArr.join(' ')}' manually to debug.`);
        process.exit(1);
    }
    console.log(`\n✅ Step Complete: ${name}\n`);
}

function checkGitState() {
    console.log(`\n▶️  Step: Git State Verification`);
    
    try {
        const status = execSync('git status --porcelain', { cwd: ROOT_DIR }).toString().trim();
        if (status) {
            console.error('❌ Git working directory is not clean.');
            console.error('   Please commit or stash your changes before deploying.');
            console.error(status);
            process.exit(1);
        }

        const branch = execSync('git branch --show-current', { cwd: ROOT_DIR }).toString().trim();
        console.log(`   Current branch: ${branch}`);
        
        if (isProd && branch !== 'main') {
            console.error(`❌ Production deployments must be run from the 'main' branch.`);
            process.exit(1);
        }
        
        if (targetEnv === 'staging' && !['main', 'staging'].includes(branch)) {
            console.warn(`⚠️  Warning: Deploying to staging from branch '${branch}'. Normally this is done from 'staging' or 'main'.`);
        }

        console.log(`✅ Git state verified.\n`);
    } catch (e) {
        console.error('❌ Failed to verify git state.', e.message);
        process.exit(1);
    }
}

// ── Pipeline ──
checkGitState();

runStep('Lint', 'npm', ['run', 'lint']);
runStep('Type Check', 'npx', ['tsc', '--noEmit']);
runStep('Unit Tests', 'npm', ['run', 'test:unit']);
runStep('Integration Tests', 'npm', ['run', 'test:int']);
runStep('Build Verification', 'npm', ['run', 'build']);

const dbArgs = ['scripts/deploy.js', '--env', targetEnv];
if (targetEnv === 'staging') {
    dbArgs.push('--validate');
} else if (targetEnv === 'production') {
    dbArgs.push('--confirm');
}

runStep('Database Deploy & Validation', 'node', dbArgs);

console.log(`\n🎉 All local checks and database migrations for ${targetEnv} have passed!`);
console.log(`   Pushing to GitHub to trigger Vercel deployment...`);

runStep('Push to GitHub', 'git', ['push', 'origin', 'HEAD']);

console.log(`
╔══════════════════════════════════════════════════════════════╗
║   ✅ Deployment pipeline triggered successfully!             ║
║      Check GitHub Actions for Vercel build status.           ║
╚══════════════════════════════════════════════════════════════╝
`);
