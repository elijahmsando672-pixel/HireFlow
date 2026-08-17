const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");

const testDbPath = path.join(__dirname, "..", "data", "test.db");

function createTestDb() {
    const dataDir = path.dirname(testDbPath);
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

    if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);

    const db = new Database(testDbPath);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");

    db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            first_name TEXT NOT NULL,
            last_name TEXT NOT NULL,
            username TEXT UNIQUE,
            email TEXT UNIQUE NOT NULL,
            phone TEXT,
            password_hash TEXT NOT NULL,
            headline TEXT,
            bio TEXT,
            education TEXT,
            skills TEXT,
            interests TEXT,
            linkedin TEXT,
            github TEXT,
            twitter TEXT,
            portfolio TEXT,
            role TEXT NOT NULL DEFAULT 'both',
            created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS jobs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            company TEXT NOT NULL,
            location TEXT NOT NULL,
            type TEXT NOT NULL,
            category TEXT NOT NULL,
            salary INTEGER NOT NULL,
            description TEXT NOT NULL,
            requirements TEXT NOT NULL,
            posted TEXT NOT NULL,
            posted_by INTEGER
        );

        CREATE TABLE IF NOT EXISTS applications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            job_id INTEGER NOT NULL,
            status TEXT NOT NULL DEFAULT 'Under Review',
            applied_at TEXT NOT NULL,
            UNIQUE (user_id, job_id),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS proposals (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            job_id INTEGER NOT NULL,
            cover_letter TEXT NOT NULL,
            rate INTEGER NOT NULL CHECK (rate > 0),
            timeline_days INTEGER NOT NULL CHECK (timeline_days > 0),
            status TEXT NOT NULL DEFAULT 'Pending',
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            UNIQUE (user_id, job_id),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS gigs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            title TEXT NOT NULL,
            description TEXT NOT NULL,
            category TEXT NOT NULL,
            packages TEXT NOT NULL,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            gig_id INTEGER NOT NULL,
            buyer_id INTEGER NOT NULL,
            seller_id INTEGER NOT NULL,
            package_name TEXT NOT NULL,
            price INTEGER NOT NULL,
            status TEXT NOT NULL DEFAULT 'In Progress',
            ordered_at TEXT NOT NULL DEFAULT (datetime('now')),
            completed_at TEXT,
            FOREIGN KEY (gig_id) REFERENCES gigs(id) ON DELETE CASCADE,
            FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS reviews (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_id INTEGER NOT NULL,
            from_user_id INTEGER NOT NULL,
            to_user_id INTEGER NOT NULL,
            rating INTEGER NOT NULL,
            comment TEXT,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            UNIQUE (order_id, from_user_id),
            FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
            FOREIGN KEY (from_user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (to_user_id) REFERENCES users(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sender_id INTEGER NOT NULL,
            recipient_id INTEGER NOT NULL,
            body TEXT NOT NULL,
            read INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS contracts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            type TEXT NOT NULL DEFAULT 'job',
            client_id INTEGER NOT NULL,
            freelancer_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            amount INTEGER NOT NULL CHECK (amount > 0),
            proposal_id INTEGER,
            order_id INTEGER,
            status TEXT NOT NULL DEFAULT 'Active',
            terms TEXT,
            delivery_note TEXT,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            started_at TEXT,
            delivered_at TEXT,
            completed_at TEXT,
            FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (freelancer_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (proposal_id) REFERENCES proposals(id) ON DELETE SET NULL,
            FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL
        );

        CREATE TABLE IF NOT EXISTS payments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            contract_id INTEGER NOT NULL,
            amount INTEGER NOT NULL CHECK (amount > 0),
            method TEXT NOT NULL DEFAULT 'M-Pesa',
            reference TEXT,
            status TEXT NOT NULL DEFAULT 'Paid',
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            paid_at TEXT,
            FOREIGN KEY (contract_id) REFERENCES contracts(id) ON DELETE CASCADE
        );

        CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_contract ON payments(contract_id);

        CREATE TABLE IF NOT EXISTS saved_jobs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            job_id INTEGER NOT NULL,
            saved_at TEXT NOT NULL DEFAULT (datetime('now')),
            UNIQUE (user_id, job_id),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS saved_gigs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            gig_id INTEGER NOT NULL,
            saved_at TEXT NOT NULL DEFAULT (datetime('now')),
            UNIQUE (user_id, gig_id),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (gig_id) REFERENCES gigs(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS aggregated_jobs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            external_id TEXT NOT NULL,
            source TEXT NOT NULL,
            source_url TEXT NOT NULL,
            title TEXT NOT NULL,
            description TEXT NOT NULL DEFAULT '',
            company_name TEXT,
            company_url TEXT,
            category TEXT,
            skills TEXT NOT NULL DEFAULT '[]',
            budget_min INTEGER,
            budget_max INTEGER,
            currency TEXT NOT NULL DEFAULT 'KES',
            payment_type TEXT NOT NULL DEFAULT 'fixed',
            job_type TEXT,
            experience_level TEXT,
            location TEXT,
            remote INTEGER NOT NULL DEFAULT 0,
            posted_at TEXT,
            deadline TEXT,
            status TEXT NOT NULL DEFAULT 'ACTIVE',
            raw_data TEXT,
            content_hash TEXT,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now')),
            UNIQUE (source, external_id)
        );

        CREATE TABLE IF NOT EXISTS aggregation_sources (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL,
            type TEXT NOT NULL,
            enabled INTEGER NOT NULL DEFAULT 1,
            sync_interval_minutes INTEGER NOT NULL DEFAULT 30,
            last_sync TEXT,
            last_success TEXT,
            status TEXT NOT NULL DEFAULT 'IDLE',
            error_count INTEGER NOT NULL DEFAULT 0,
            error_message TEXT,
            fetched INTEGER NOT NULL DEFAULT 0,
            inserted INTEGER NOT NULL DEFAULT 0,
            updated INTEGER NOT NULL DEFAULT 0,
            duplicates INTEGER NOT NULL DEFAULT 0,
            rejected INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS aggregation_sync_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            source TEXT,
            started_at TEXT NOT NULL DEFAULT (datetime('now')),
            finished_at TEXT,
            duration_ms INTEGER,
            status TEXT NOT NULL,
            fetched INTEGER NOT NULL DEFAULT 0,
            inserted INTEGER NOT NULL DEFAULT 0,
            updated INTEGER NOT NULL DEFAULT 0,
            duplicates INTEGER NOT NULL DEFAULT 0,
            rejected INTEGER NOT NULL DEFAULT 0,
            error TEXT
        );

        CREATE TABLE IF NOT EXISTS subscriptions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            plan TEXT NOT NULL DEFAULT 'FREE',
            status TEXT NOT NULL DEFAULT 'PENDING',
            provider TEXT NOT NULL DEFAULT 'MOCK',
            provider_subscription_id TEXT,
            provider_transaction_id TEXT,
            amount INTEGER NOT NULL DEFAULT 0,
            currency TEXT NOT NULL DEFAULT 'KES',
            started_at TEXT,
            expires_at TEXT,
            cancelled_at TEXT,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS idx_agg_jobs_title ON aggregated_jobs(title);
        CREATE INDEX IF NOT EXISTS idx_agg_jobs_category ON aggregated_jobs(category);
        CREATE INDEX IF NOT EXISTS idx_agg_jobs_source ON aggregated_jobs(source);
        CREATE INDEX IF NOT EXISTS idx_agg_jobs_posted_at ON aggregated_jobs(posted_at);
        CREATE INDEX IF NOT EXISTS idx_agg_jobs_status ON aggregated_jobs(status);
        CREATE INDEX IF NOT EXISTS idx_agg_jobs_remote ON aggregated_jobs(remote);
        CREATE INDEX IF NOT EXISTS idx_agg_jobs_job_type ON aggregated_jobs(job_type);
        CREATE INDEX IF NOT EXISTS idx_agg_jobs_content_hash ON aggregated_jobs(content_hash);
    `);

    return db;
}

function cleanupTestDb() {
    if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);
}

module.exports = { createTestDb, cleanupTestDb, testDbPath };
