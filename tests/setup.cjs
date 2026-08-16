import { beforeAll, afterAll, beforeEach } from "vitest";
const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");

const testDbPath = path.join(__dirname, "..", "..", "data", "test.db");

beforeAll(() => {
    if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);
});

beforeEach(() => {
    if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);
});

afterAll(() => {
    if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);
});

function createTestDb() {
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

export { createTestDb, testDbPath };
