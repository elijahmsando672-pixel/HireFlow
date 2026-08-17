const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");

// DATABASE_PATH overrides the SQLite location so hosting platforms can
// point it at a persistent disk (e.g. Render). Falls back to ./data/hireflow.db.
const dbPath = process.env.DATABASE_PATH || path.join(__dirname, "..", "data", "hireflow.db");
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(dbPath);

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");
db.pragma("wal_checkpoint(PASSIVE)");

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
        posted TEXT NOT NULL
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

    -- ============================================================
    -- Job aggregation (externally sourced listings)
    -- ============================================================

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

    CREATE INDEX IF NOT EXISTS idx_agg_jobs_title ON aggregated_jobs(title);
    CREATE INDEX IF NOT EXISTS idx_agg_jobs_category ON aggregated_jobs(category);
    CREATE INDEX IF NOT EXISTS idx_agg_jobs_source ON aggregated_jobs(source);
    CREATE INDEX IF NOT EXISTS idx_agg_jobs_posted_at ON aggregated_jobs(posted_at);
    CREATE INDEX IF NOT EXISTS idx_agg_jobs_status ON aggregated_jobs(status);
    CREATE INDEX IF NOT EXISTS idx_agg_jobs_remote ON aggregated_jobs(remote);
    CREATE INDEX IF NOT EXISTS idx_agg_jobs_job_type ON aggregated_jobs(job_type);
    CREATE INDEX IF NOT EXISTS idx_agg_jobs_content_hash ON aggregated_jobs(content_hash);

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

    CREATE INDEX IF NOT EXISTS idx_sync_logs_source ON aggregation_sync_logs(source);
    CREATE INDEX IF NOT EXISTS idx_sync_logs_started ON aggregation_sync_logs(started_at);

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

    CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_active_pro_user ON subscriptions(user_id) WHERE status = 'ACTIVE' AND plan = 'PRO';
    CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);
    CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
    CREATE INDEX IF NOT EXISTS idx_subscriptions_provider_txn ON subscriptions(provider_transaction_id);
    CREATE INDEX IF NOT EXISTS idx_subscriptions_expires ON subscriptions(expires_at);
`);

    const subscriptionColumns = db.prepare("PRAGMA table_info(subscriptions)").all();
    const subColumnNames = subscriptionColumns.map((column) => column.name);

    if (!subColumnNames.includes("provider")) {
        db.exec("ALTER TABLE subscriptions ADD COLUMN provider TEXT NOT NULL DEFAULT 'MOCK'");
    }
    if (!subColumnNames.includes("provider_subscription_id")) {
        db.exec("ALTER TABLE subscriptions ADD COLUMN provider_subscription_id TEXT");
    }
    if (!subColumnNames.includes("provider_transaction_id")) {
        db.exec("ALTER TABLE subscriptions ADD COLUMN provider_transaction_id TEXT");
    }
    if (!subColumnNames.includes("cancelled_at")) {
        db.exec("ALTER TABLE subscriptions ADD COLUMN cancelled_at TEXT");
    }
    if (!subColumnNames.includes("updated_at")) {
        db.exec("ALTER TABLE subscriptions ADD COLUMN updated_at TEXT NOT NULL DEFAULT (datetime('now'))");
    }

    db.prepare("UPDATE subscriptions SET plan = 'PRO' WHERE plan = 'monthly'").run();
    db.prepare("UPDATE subscriptions SET status = 'ACTIVE' WHERE status = 'active'").run();
    db.prepare("UPDATE subscriptions SET status = 'PENDING' WHERE status = 'pending'").run();
    db.prepare("UPDATE subscriptions SET status = 'EXPIRED' WHERE status = 'expired'").run();
    db.prepare("UPDATE subscriptions SET status = 'CANCELLED' WHERE status = 'cancelled'").run();
    db.prepare("UPDATE subscriptions SET status = 'FAILED' WHERE status = 'failed'").run();

    const jobColumns = db.prepare("PRAGMA table_info(jobs)").all();
if (!jobColumns.some((column) => column.name === "posted_by")) {
    db.exec("ALTER TABLE jobs ADD COLUMN posted_by INTEGER");
}

    const userColumns = db.prepare("PRAGMA table_info(users)").all();
    if (!userColumns.some((column) => column.name === "role")) {
        db.exec("ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'both'");
    }
    if (!userColumns.some((column) => column.name === "company_name")) {
        db.exec("ALTER TABLE users ADD COLUMN company_name TEXT");
    }
    if (!userColumns.some((column) => column.name === "company_website")) {
        db.exec("ALTER TABLE users ADD COLUMN company_website TEXT");
    }
    if (!userColumns.some((column) => column.name === "company_email")) {
        db.exec("ALTER TABLE users ADD COLUMN company_email TEXT");
    }
    if (!userColumns.some((column) => column.name === "company_phone")) {
        db.exec("ALTER TABLE users ADD COLUMN company_phone TEXT");
    }
    if (!userColumns.some((column) => column.name === "company_country")) {
        db.exec("ALTER TABLE users ADD COLUMN company_country TEXT");
    }
    if (!userColumns.some((column) => column.name === "company_description")) {
        db.exec("ALTER TABLE users ADD COLUMN company_description TEXT");
    }
    if (!userColumns.some((column) => column.name === "is_verified")) {
        db.exec("ALTER TABLE users ADD COLUMN is_verified INTEGER NOT NULL DEFAULT 0");
    }
    if (!userColumns.some((column) => column.name === "verified_at")) {
        db.exec("ALTER TABLE users ADD COLUMN verified_at TEXT");
    }
    if (!userColumns.some((column) => column.name === "suspended")) {
        db.exec("ALTER TABLE users ADD COLUMN suspended INTEGER NOT NULL DEFAULT 0");
    }

    db.exec(`
        CREATE TABLE IF NOT EXISTS employer_verifications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            company_name TEXT NOT NULL,
            company_website TEXT,
            company_email TEXT NOT NULL,
            company_phone TEXT,
            company_country TEXT NOT NULL,
            company_description TEXT NOT NULL,
            business_info TEXT,
            status TEXT NOT NULL DEFAULT 'pending',
            admin_notes TEXT,
            reviewed_by INTEGER,
            submitted_at TEXT NOT NULL DEFAULT (datetime('now')),
            reviewed_at TEXT,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
        );

        CREATE INDEX IF NOT EXISTS idx_verifications_user ON employer_verifications(user_id);
        CREATE INDEX IF NOT EXISTS idx_verifications_status ON employer_verifications(status);
    `);

  // Existing SQLite tables cannot gain CHECK constraints with ALTER TABLE.
  // These triggers apply the same invariant to databases created before it.
  db.exec(`
      CREATE TRIGGER IF NOT EXISTS validate_proposal_values_insert
      BEFORE INSERT ON proposals
      WHEN NEW.rate <= 0 OR NEW.timeline_days <= 0
      BEGIN SELECT RAISE(ABORT, 'Proposal rate and timeline must be positive'); END;

      CREATE TRIGGER IF NOT EXISTS validate_proposal_values_update
      BEFORE UPDATE OF rate, timeline_days ON proposals
      WHEN NEW.rate <= 0 OR NEW.timeline_days <= 0
      BEGIN SELECT RAISE(ABORT, 'Proposal rate and timeline must be positive'); END;

      CREATE TRIGGER IF NOT EXISTS validate_contract_amount_insert
      BEFORE INSERT ON contracts
      WHEN NEW.amount <= 0
      BEGIN SELECT RAISE(ABORT, 'Contract amount must be positive'); END;

      CREATE TRIGGER IF NOT EXISTS validate_payment_amount_insert
      BEFORE INSERT ON payments
      WHEN NEW.amount <= 0
      BEGIN SELECT RAISE(ABORT, 'Payment amount must be positive'); END;
  `);

const SEED_JOBS = [
    {
        title: "Frontend Developer",
        company: "Savanna Labs",
        location: "Nairobi",
        type: "Full-time",
        category: "Software",
        salary: 120000,
        description: "Build responsive, accessible web applications using HTML, CSS and vanilla JavaScript. Work with designers to turn Figma mockups into polished, production-ready interfaces.",
        requirements: ["2+ years of frontend experience", "Strong HTML, CSS and vanilla JavaScript", "Experience with responsive design", "Great attention to detail and UI polish"]
    },
    {
        title: "Backend Engineer (Node.js)",
        company: "Nexus Cloud",
        location: "Remote",
        type: "Full-time",
        category: "Software",
        salary: 160000,
        description: "Design and build REST APIs and microservices with Node.js. Own the backend for internal tools and customer-facing features end to end.",
        requirements: ["3+ years of backend development", "Strong Node.js and Express experience", "Solid understanding of relational databases", "Experience writing automated tests"]
    },
    {
        title: "Data Analyst",
        company: "Kilimani Analytics",
        location: "Nairobi",
        type: "Contract",
        category: "Data",
        salary: 110000,
        description: "Turn raw data into clear insights and dashboards. Work with business teams to answer questions and drive decisions with data.",
        requirements: ["Strong SQL and Excel skills", "Experience with data visualisation tools", "Analytical and problem-solving mindset", "Clear written and verbal communication"]
    },
    {
        title: "UX Designer",
        company: "Pixel & Pen",
        location: "Mombasa",
        type: "Full-time",
        category: "Design",
        salary: 95000,
        description: "Design intuitive user experiences from research to high-fidelity prototypes. Partner with product and engineering to ship delightful products.",
        requirements: ["Portfolio of UX and UI work", "Proficiency with Figma", "User research and usability testing experience", "Strong visual design skills"]
    },
    {
        title: "Digital Marketing Specialist",
        company: "Tembo Media",
        location: "Nairobi",
        type: "Full-time",
        category: "Marketing",
        salary: 80000,
        description: "Plan and execute digital campaigns across social, email and search. Grow brand awareness and generate quality leads.",
        requirements: ["Experience managing social media campaigns", "Familiarity with Google and Meta ads", "Strong copywriting skills", "Data-driven approach to campaigns"]
    },
    {
        title: "Mobile App Developer (Flutter)",
        company: "Savanna Labs",
        location: "Nairobi",
        type: "Full-time",
        category: "Software",
        salary: 130000,
        description: "Build beautiful, performant mobile applications with Flutter for both Android and iOS. Ship features from idea to store release.",
        requirements: ["2+ years with Flutter and Dart", "Experience with REST APIs", "Published apps on the Play Store or App Store", "Strong problem-solving skills"]
    },
    {
        title: "Product Manager",
        company: "Orbit Ventures",
        location: "Remote",
        type: "Full-time",
        category: "Product",
        salary: 180000,
        description: "Own the product roadmap and work with engineering and design to deliver value to customers. Balance user needs, business goals and technical feasibility.",
        requirements: ["3+ years in product management", "Experience writing PRDs and specs", "Strong stakeholder management", "Data-informed decision making"]
    },
    {
        title: "IT Support Intern",
        company: "Kilimani Analytics",
        location: "Nakuru",
        type: "Internship",
        category: "IT",
        salary: 45000,
        description: "Provide first-line IT support to staff, set up workstations and help keep our systems running smoothly. A great entry point into IT.",
        requirements: ["Basic knowledge of computer hardware and networks", "Familiarity with Windows and macOS", "Good communication and patience", "Willingness to learn"]
    }
];

function seedJobs() {
    const count = db.prepare("SELECT COUNT(*) AS n FROM jobs").get().n;
    if (count > 0) return;

    const insert = db.prepare(`
        INSERT INTO jobs (title, company, location, type, category, salary, description, requirements, posted)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const daysAgo = (n) => new Date(Date.now() - n * 86400000).toISOString().slice(0, 10);

    SEED_JOBS.forEach((job, index) => {
        insert.run(
            job.title,
            job.company,
            job.location,
            job.type,
            job.category,
            job.salary,
            job.description,
            JSON.stringify(job.requirements),
            daysAgo(index * 2 + 1)
        );
    });
}

const SEED_GIGS = [
    {
        title: "I will design a professional logo and brand kit",
        description: "A complete identity for your business: a memorable logo, colour palette, typography and usage guide you can hand to any designer.",
        category: "Design",
        packages: [
            { name: "Basic", price: 1500, description: "1 logo concept, 2 revisions, PNG files", deliveryDays: 3 },
            { name: "Standard", price: 3500, description: "3 logo concepts, 5 revisions, all file formats", deliveryDays: 5 },
            { name: "Premium", price: 6000, description: "Full brand kit: logo, colours, fonts, social kit and guide", deliveryDays: 7 }
        ]
    },
    {
        title: "I will build a responsive website with HTML, CSS and JavaScript",
        description: "A fast, mobile-friendly website built from scratch. Perfect for portfolios, small businesses and landing pages.",
        category: "Software",
        packages: [
            { name: "Basic", price: 4000, description: "1 page, responsive, contact form", deliveryDays: 5 },
            { name: "Standard", price: 9000, description: "Up to 5 pages, animations, basic SEO", deliveryDays: 10 },
            { name: "Premium", price: 18000, description: "Multi-page site with blog, CMS or dashboard", deliveryDays: 15 }
        ]
    },
    {
        title: "I will write SEO articles and blog posts",
        description: "Clear, well-researched articles that rank. Research, outline, writing and basic SEO included in every package.",
        category: "Writing",
        packages: [
            { name: "Basic", price: 1200, description: "600-word article, keyword research", deliveryDays: 2 },
            { name: "Standard", price: 2500, description: "1,200-word article with outline and SEO", deliveryDays: 4 },
            { name: "Premium", price: 5000, description: "3,000-word pillar post with internal linking", deliveryDays: 7 }
        ]
    },
    {
        title: "I will edit your video for YouTube and social media",
        description: "Clean cuts, captions, background music and colour grading so your content looks professional.",
        category: "Video",
        packages: [
            { name: "Basic", price: 2000, description: "Up to 5 min, cuts and colour", deliveryDays: 3 },
            { name: "Standard", price: 5000, description: "Up to 15 min, captions and music", deliveryDays: 5 },
            { name: "Premium", price: 10000, description: "Up to 30 min, full package with thumbnails", deliveryDays: 7 }
        ]
    },
    {
        title: "I will create a mobile app UI in Figma",
        description: "Clickable, pixel-perfect app interfaces with a design system your developers can ship from directly.",
        category: "Design",
        packages: [
            { name: "Basic", price: 3000, description: "1 screen, high-fidelity mockup", deliveryDays: 3 },
            { name: "Standard", price: 8000, description: "Up to 8 screens with flows", deliveryDays: 7 },
            { name: "Premium", price: 15000, description: "Full app design system, 20+ screens, prototype", deliveryDays: 12 }
        ]
    },
    {
        title: "I will set up and manage your social media accounts",
        description: "Strategy, content calendar and posting so your brand shows up consistently across platforms.",
        category: "Marketing",
        packages: [
            { name: "Basic", price: 3000, description: "1 platform, 4 posts per month", deliveryDays: 7 },
            { name: "Standard", price: 7000, description: "2 platforms, 12 posts per month", deliveryDays: 14 },
            { name: "Premium", price: 15000, description: "All platforms, daily posts and monthly report", deliveryDays: 30 }
        ]
    }
];

function seedStudio() {
    const existing = db.prepare("SELECT * FROM users WHERE username = ?").get("hireflow_studio");

    if (existing) return existing;

    if (process.env.NODE_ENV === "production") return null;

    const bcrypt = require("bcryptjs");

    const info = db.prepare(`
        INSERT INTO users (first_name, last_name, username, email, phone, password_hash, headline, bio)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
        "HireFlow",
        "Studio",
        "hireflow_studio",
        "studio@hireflow.app",
        null,
        bcrypt.hashSync("hireflow-demo-studio", 10),
        "Full-service creative studio",
        "We help founders and small teams ship fast with design, code and content. Browse our gigs and message us before ordering."
    );

    return db.prepare("SELECT * FROM users WHERE id = ?").get(info.lastInsertRowid);
}

function seedGigs() {
    const count = db.prepare("SELECT COUNT(*) AS n FROM gigs").get().n;
    if (count > 0) return;

    const studio = seedStudio();
    const insert = db.prepare(`
        INSERT INTO gigs (user_id, title, description, category, packages)
        VALUES (?, ?, ?, ?, ?)
    `);

    SEED_GIGS.forEach((gig) => {
        insert.run(studio.id, gig.title, gig.description, gig.category, JSON.stringify(gig.packages));
    });
}

seedJobs();
seedGigs();

module.exports = db;
