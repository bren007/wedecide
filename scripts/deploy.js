/**
 * Unified Deploy Script for WeDecide
 * 
 * Applies SQL migrations from supabase/migrations/ to the target environment.
 * Uses env-specific connection strings from .env.local to ensure you always
 * know which database you're targeting.
 * 
 * Usage:
 *   node scripts/deploy.js --env dev          # Deploy to development
 *   node scripts/deploy.js --env staging      # Deploy to staging
 *   node scripts/deploy.js --env production   # Deploy to production (requires --confirm)
 *   node scripts/deploy.js --env staging --dry-run   # Preview what would be applied
 *   node scripts/deploy.js --env staging --migration 20260228085344_phase_5_telemetry.sql  # Apply single migration
 * 
 * Environment variables expected in .env.local:
 *   DEV_DATABASE_URL       - Dev Supabase direct connection
 *   STAGING_DATABASE_URL   - Staging Supabase direct connection
 *   PROD_DATABASE_URL      - Production Supabase direct connection (future)
 * 
 * Legacy fallback (if env-specific vars not set):
 *   DIRECT_URL / DATABASE_URL will be used for --env dev
 */

import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.join(__dirname, '..');
const MIGRATIONS_DIR = path.join(ROOT_DIR, 'supabase', 'migrations');

// ── CLI Argument Parsing ──────────────────────────────────────────────
function parseArgs() {
    const args = process.argv.slice(2);
    const parsed = {
        env: null,
        dryRun: args.includes('--dry-run'),
        confirm: args.includes('--confirm'),
        migration: null,
        compare: args.includes('--compare'),
        help: args.includes('--help') || args.includes('-h'),
    };

    const envIdx = args.indexOf('--env');
    if (envIdx !== -1 && args[envIdx + 1]) {
        parsed.env = args[envIdx + 1].toLowerCase();
    }

    const migIdx = args.indexOf('--migration');
    if (migIdx !== -1 && args[migIdx + 1]) {
        parsed.migration = args[migIdx + 1];
    }

    return parsed;
}

function printUsage() {
    console.log(`
╔══════════════════════════════════════════════════════════════╗
║                    WeDecide Deploy Tool                      ║
╚══════════════════════════════════════════════════════════════╝

Usage:
  node scripts/deploy.js --env <environment> [options]

Environments:
  dev          Development Supabase instance
  staging      Staging Supabase instance
  production   Production Supabase instance (requires --confirm)

Options:
  --dry-run           Preview migrations without applying them
  --migration <file>  Apply a single specific migration file
  --compare           Compare schema between environments (dev vs target)
  --confirm           Required safety flag for production deploys
  --help, -h          Show this help message

Examples:
  node scripts/deploy.js --env staging
  node scripts/deploy.js --env staging --dry-run
  node scripts/deploy.js --env staging --migration 20260228085344_phase_5_telemetry.sql
  node scripts/deploy.js --env production --confirm

Environment Variables (in .env.local):
  DEV_DATABASE_URL       Direct connection to dev Supabase
  STAGING_DATABASE_URL   Direct connection to staging Supabase
  PROD_DATABASE_URL      Direct connection to production Supabase
`);
}

// ── Connection String Resolution ──────────────────────────────────────
const ENV_CONFIG = {
    dev: {
        label: 'Development',
        emoji: '🔧',
        envVars: ['DEV_DATABASE_URL', 'DIRECT_URL', 'DATABASE_URL'], // Fallback chain
        requireConfirm: false,
    },
    staging: {
        label: 'Staging',
        emoji: '🧪',
        envVars: ['STAGING_DATABASE_URL'],
        requireConfirm: false,
    },
    production: {
        label: 'Production',
        emoji: '🚀',
        envVars: ['PROD_DATABASE_URL'],
        requireConfirm: true,
    },
};

function getConnectionString(envName) {
    const config = ENV_CONFIG[envName];
    if (!config) {
        console.error(`❌ Unknown environment: "${envName}". Use: dev, staging, or production`);
        process.exit(1);
    }

    for (const varName of config.envVars) {
        if (process.env[varName]) {
            return { connectionString: process.env[varName], varName };
        }
    }

    console.error(`❌ No database connection string found for ${config.label}.`);
    console.error(`   Expected one of: ${config.envVars.join(', ')} in .env.local`);
    process.exit(1);
}

// ── Migration Discovery ──────────────────────────────────────────────
function discoverMigrations(specificFile) {
    if (!fs.existsSync(MIGRATIONS_DIR)) {
        console.error(`❌ Migrations directory not found: ${MIGRATIONS_DIR}`);
        process.exit(1);
    }

    const allFiles = fs.readdirSync(MIGRATIONS_DIR)
        .filter(f => f.endsWith('.sql'))
        .sort(); // Timestamp-prefixed files sort chronologically

    if (specificFile) {
        const match = allFiles.find(f => f === specificFile || f.includes(specificFile));
        if (!match) {
            console.error(`❌ Migration file not found: ${specificFile}`);
            console.error(`   Available migrations:`);
            allFiles.forEach(f => console.error(`     - ${f}`));
            process.exit(1);
        }
        return [match];
    }

    return allFiles;
}

// ── Migration Tracking ───────────────────────────────────────────────
async function ensureMigrationTable(client) {
    await client.query(`
        CREATE TABLE IF NOT EXISTS _migration_history (
            id SERIAL PRIMARY KEY,
            filename TEXT NOT NULL UNIQUE,
            applied_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
            checksum TEXT,
            applied_by TEXT DEFAULT current_user
        );
    `);
}

async function getAppliedMigrations(client) {
    const result = await client.query(
        'SELECT filename FROM _migration_history ORDER BY filename'
    );
    return new Set(result.rows.map(r => r.filename));
}

async function recordMigration(client, filename, checksum) {
    await client.query(
        'INSERT INTO _migration_history (filename, checksum) VALUES ($1, $2) ON CONFLICT (filename) DO NOTHING',
        [filename, checksum]
    );
}

function simpleChecksum(content) {
    // Simple hash for change detection — not cryptographic
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
        const char = content.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(16);
}

// ── Schema Comparison ────────────────────────────────────────────────
async function compareSchemas(sourceClient, targetClient) {
    console.log('\n📊 Comparing schemas...\n');

    const schemaQuery = `
        SELECT table_name, column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name NOT LIKE '_%'
        ORDER BY table_name, ordinal_position;
    `;

    const policyQuery = `
        SELECT schemaname, tablename, policyname, cmd, qual
        FROM pg_policies
        WHERE schemaname = 'public'
        ORDER BY tablename, policyname;
    `;

    const [sourceCols, targetCols] = await Promise.all([
        sourceClient.query(schemaQuery),
        targetClient.query(schemaQuery),
    ]);

    const [sourcePolicies, targetPolicies] = await Promise.all([
        sourceClient.query(policyQuery),
        targetClient.query(policyQuery),
    ]);

    // Compare tables/columns
    const sourceColMap = new Map();
    sourceCols.rows.forEach(r => sourceColMap.set(`${r.table_name}.${r.column_name}`, r));

    const targetColMap = new Map();
    targetCols.rows.forEach(r => targetColMap.set(`${r.table_name}.${r.column_name}`, r));

    let driftFound = false;

    // Columns in source but not target
    for (const [key, col] of sourceColMap) {
        if (!targetColMap.has(key)) {
            console.log(`  ➕ Missing in target: ${key} (${col.data_type})`);
            driftFound = true;
        }
    }

    // Columns in target but not source
    for (const [key, col] of targetColMap) {
        if (!sourceColMap.has(key)) {
            console.log(`  ➖ Extra in target:   ${key} (${col.data_type})`);
            driftFound = true;
        }
    }

    // Type mismatches
    for (const [key, srcCol] of sourceColMap) {
        const tgtCol = targetColMap.get(key);
        if (tgtCol && srcCol.data_type !== tgtCol.data_type) {
            console.log(`  ⚠️  Type mismatch:    ${key}: ${srcCol.data_type} → ${tgtCol.data_type}`);
            driftFound = true;
        }
    }

    // Compare policies
    const sourcePolicySet = new Set(sourcePolicies.rows.map(p => `${p.tablename}::${p.policyname}`));
    const targetPolicySet = new Set(targetPolicies.rows.map(p => `${p.tablename}::${p.policyname}`));

    for (const p of sourcePolicySet) {
        if (!targetPolicySet.has(p)) {
            console.log(`  🔐 Missing policy:   ${p}`);
            driftFound = true;
        }
    }

    for (const p of targetPolicySet) {
        if (!sourcePolicySet.has(p)) {
            console.log(`  🔓 Extra policy:     ${p}`);
            driftFound = true;
        }
    }

    if (!driftFound) {
        console.log('  ✅ No schema drift detected — environments are aligned.');
    }

    return driftFound;
}

// ── Main Deploy Logic ────────────────────────────────────────────────
async function main() {
    // Load env
    dotenv.config({ path: path.join(ROOT_DIR, '.env.local') });

    const args = parseArgs();

    if (args.help) {
        printUsage();
        process.exit(0);
    }

    if (!args.env) {
        console.error('❌ Missing required --env argument.');
        printUsage();
        process.exit(1);
    }

    const config = ENV_CONFIG[args.env];
    if (!config) {
        console.error(`❌ Unknown environment: "${args.env}"`);
        process.exit(1);
    }

    // Production safety gate
    if (config.requireConfirm && !args.confirm) {
        console.error(`\n🛑 PRODUCTION DEPLOY requires --confirm flag.`);
        console.error(`   Run: node scripts/deploy.js --env production --confirm\n`);
        process.exit(1);
    }

    const { connectionString, varName } = getConnectionString(args.env);
    const maskedUrl = connectionString.replace(/:[^:@]*@/, ':****@');

    console.log(`
╔══════════════════════════════════════════════════════════════╗
║  ${config.emoji}  WeDecide Deploy — ${config.label.padEnd(40)}  ║
╚══════════════════════════════════════════════════════════════╝
`);
    console.log(`  Environment:  ${config.label}`);
    console.log(`  Using:        ${varName}`);
    console.log(`  Database:     ${maskedUrl}`);
    console.log(`  Mode:         ${args.dryRun ? '🔍 DRY RUN (no changes will be made)' : '▶️  LIVE'}`);
    console.log('');

    // Handle --compare mode
    if (args.compare && args.env !== 'dev') {
        const devConn = getConnectionString('dev');
        const devClient = new Client({ connectionString: devConn.connectionString, ssl: { rejectUnauthorized: false } });
        const targetClient = new Client({ connectionString, ssl: { rejectUnauthorized: false } });

        try {
            await Promise.all([devClient.connect(), targetClient.connect()]);
            console.log('  ✅ Connected to both Dev and ' + config.label);
            const hasDrift = await compareSchemas(devClient, targetClient);
            process.exit(hasDrift ? 1 : 0);
        } finally {
            await Promise.all([devClient.end(), targetClient.end()]);
        }
    }

    // Discover migrations
    const migrations = discoverMigrations(args.migration);
    console.log(`  📁 Found ${migrations.length} migration(s) in supabase/migrations/`);

    // Connect
    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 15000,
    });

    try {
        await client.connect();
        console.log('  ✅ Connected to database.\n');

        // Ensure tracking table exists
        await ensureMigrationTable(client);

        // Get already-applied migrations
        const applied = await getAppliedMigrations(client);
        const pending = migrations.filter(f => !applied.has(f));

        if (pending.length === 0) {
            console.log('  ℹ️  All migrations already applied. Nothing to do.');
            if (args.migration) {
                console.log(`     (${args.migration} was already applied previously)`);
            }
            return;
        }

        console.log(`  📋 Pending migrations (${pending.length}):`);
        pending.forEach((f, i) => console.log(`     ${i + 1}. ${f}`));
        console.log('');

        if (args.dryRun) {
            console.log('  🔍 Dry run complete — no changes were made.');
            return;
        }

        // Apply each migration in order
        let applied_count = 0;
        let failed = false;

        for (const file of pending) {
            const filePath = path.join(MIGRATIONS_DIR, file);
            const sql = fs.readFileSync(filePath, 'utf8');
            const checksum = simpleChecksum(sql);

            console.log(`  ▶️  Applying: ${file}`);

            try {
                await client.query('BEGIN');
                await client.query(sql);
                await recordMigration(client, file, checksum);
                await client.query('COMMIT');
                console.log(`     ✅ Success`);
                applied_count++;
            } catch (err) {
                await client.query('ROLLBACK');
                console.error(`     ❌ FAILED: ${err.message}`);
                console.error(`     ⏹️  Stopping — ${applied_count} migration(s) applied before failure.`);
                failed = true;
                break;
            }
        }

        console.log('');
        if (!failed) {
            console.log(`  🎉 Deploy complete! ${applied_count} migration(s) applied to ${config.label}.`);
        } else {
            console.log(`  ⚠️  Deploy incomplete. Fix the failing migration and re-run.`);
            process.exit(1);
        }

    } catch (err) {
        console.error(`  ❌ Connection error: ${err.message}`);
        process.exit(1);
    } finally {
        await client.end();
    }
}

main();
