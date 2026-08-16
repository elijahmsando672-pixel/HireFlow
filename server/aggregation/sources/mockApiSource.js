const { createSourceAdapter } = require("../sourceAdapter");
const { MOCK_SOURCE_ENABLED, MOCK_SOURCE_FAIL_RATE } = require("../../config");

/**
 * Mock API source — used ONLY to exercise the aggregation pipeline in
 * development and tests. No external site is contacted. Data is generated
 * deterministically so syncs are reproducible.
 *
 * It deliberately returns "messy" raw records (mixed types, currency
 * symbols, combined locations) so the normalizer has real work to do.
 *
 * Failure simulation: when MOCK_SOURCE_FAIL_RATE is set, a fraction of
 * syncs throw, proving that one failing source never breaks the others.
 */

const MOCK_JOBS = [
    {
        id: "mock-001",
        title: "React Developer needed for dashboard rebuild",
        company: "Savanna Labs",
        url: "https://mock.jobs.example/savanna-labs/react-dashboard",
        description: "Rebuild an internal analytics dashboard in React and TypeScript. Responsive, accessible, clean state management.",
        category: "web-development",
        type: "Freelance",
        budget: "$1,200 - $1,800",
        payment: "fixed",
        level: "Intermediate",
        location: "Remote - Nairobi",
        skills: ["React", "TypeScript", "Tailwind CSS"],
        posted: "2026-08-10T08:00:00Z",
        deadline: "2026-09-10T00:00:00Z"
    },
    {
        id: "mock-002",
        title: "Backend Engineer (Node.js) for API service",
        company: "Nexus Cloud",
        url: "https://mock.jobs.example/nexus-cloud/backend",
        description: "Design REST APIs and background workers with Node.js and PostgreSQL. Own the service end to end.",
        category: "backend-development",
        type: "Full-time",
        budget: "KES 180,000",
        payment: "monthly",
        level: "Senior",
        location: "Nairobi",
        skills: ["Node.js", "PostgreSQL", "Redis"],
        posted: "2026-08-12T08:00:00Z",
        deadline: null
    },
    {
        id: "mock-003",
        title: "Logo and brand identity design",
        company: "Pixel & Pen",
        url: "https://mock.jobs.example/pixel-pen/logo",
        description: "Create a logo and a small brand kit for a coffee startup. Deliver vector files and a usage guide.",
        category: "design",
        type: "Contract",
        budget: "€400",
        payment: "fixed",
        level: "Mid Level",
        location: "Mombasa",
        skills: ["Logo Design", "Branding", "Illustrator"],
        posted: "2026-08-11T08:00:00Z",
        deadline: "2026-08-30T00:00:00Z"
    },
    {
        id: "mock-004",
        title: "Data Analyst for market research",
        company: "Kilimani Analytics",
        url: "https://mock.jobs.example/kilimani/data-analyst",
        description: "Clean datasets, build dashboards and write clear summaries for business stakeholders.",
        category: "data",
        type: "Contract",
        budget: "£50-70/hour",
        payment: "hourly",
        level: "Entry",
        location: "Remote",
        skills: ["SQL", "Excel", "Power BI"],
        posted: "2026-08-14T08:00:00Z",
        deadline: "2026-09-01T00:00:00Z"
    },
    {
        id: "mock-005",
        title: "Mobile app UI in Figma",
        company: "Orbit Ventures",
        url: "https://mock.jobs.example/orbit/mobile-ui",
        description: "Design a fintech mobile app UI with a reusable design system and clickable prototype.",
        category: "design",
        type: "Freelance",
        budget: "KSh 60,000",
        payment: "fixed",
        level: "Senior Level",
        location: "Nairobi",
        skills: ["Figma", "UI Design", "Prototyping"],
        posted: "2026-08-09T08:00:00Z",
        deadline: "2026-09-15T00:00:00Z"
    },
    {
        id: "mock-006",
        title: "SEO content writer for tech blog",
        company: "Tembo Media",
        url: "https://mock.jobs.example/tembo/seo-writer",
        description: "Write 10 SEO articles per month about software and startups. Research and keyword optimization included.",
        category: "writing",
        type: "Freelance",
        budget: "1500 - 2500 KES / article",
        payment: "fixed",
        level: "Intermediate",
        location: "Remote",
        skills: ["SEO", "Copywriting", "WordPress"],
        posted: "2026-08-13T08:00:00Z",
        deadline: null
    },
    {
        id: "mock-007",
        title: "Junior Support Engineer (Internship)",
        company: "Kilimani Analytics",
        url: "https://mock.jobs.example/kilimani/support-intern",
        description: "First-line technical support, workstation setup and internal tooling. Great entry point into IT.",
        category: "it",
        type: "Internship",
        budget: "KES 45,000/month",
        payment: "monthly",
        level: "Entry",
        location: "Nakuru",
        skills: ["Windows", "Networking", "Troubleshooting"],
        posted: "2026-08-15T08:00:00Z",
        deadline: "2026-08-25T00:00:00Z"
    },
    {
        id: "mock-008",
        title: "Digital marketing campaign manager",
        company: "Tembo Media",
        url: "https://mock.jobs.example/tembo/digital-marketing",
        description: "Run paid campaigns on Google and Meta, A/B test creatives and report on ROAS weekly.",
        category: "marketing",
        type: "Part-time",
        budget: "$800/month",
        payment: "monthly",
        level: "Intermediate",
        location: "Nairobi",
        skills: ["Google Ads", "Meta Ads", "Analytics"],
        posted: "2026-08-08T08:00:00Z",
        deadline: "2026-09-05T00:00:00Z"
    },
    {
        id: "mock-009",
        title: "Python web scraper for public data",
        company: "Nexus Cloud",
        url: "https://mock.jobs.example/nexus-cloud/scraper",
        description: "Build a reliable collector for publicly available government datasets with polite rate limiting.",
        category: "backend-development",
        type: "Contract",
        budget: "€1,000 - €1,500",
        payment: "fixed",
        level: "Intermediate",
        location: "Remote",
        skills: ["Python", "HTTP", "APIs"],
        posted: "2026-08-07T08:00:00Z",
        deadline: null
    },
    {
        id: "mock-010",
        title: "UX researcher for mobile product",
        company: "Orbit Ventures",
        url: "https://mock.jobs.example/orbit/ux-research",
        description: "Plan and run usability studies, synthesize findings and share actionable insights with the team.",
        category: "design",
        type: "Freelance",
        budget: "Ksh 90,000",
        payment: "fixed",
        level: "Senior",
        location: "Remote",
        skills: ["User Research", "Testing", "Figma"],
        posted: "2026-08-06T08:00:00Z",
        deadline: "2026-09-20T00:00:00Z"
    },
    {
        id: "mock-011",
        title: "Video editor for YouTube channel",
        company: "Savanna Labs",
        url: "https://mock.jobs.example/savanna-labs/video-editor",
        description: "Edit weekly tech explainer videos: cuts, captions, motion graphics and colour grading.",
        category: "video",
        type: "Freelance",
        budget: "USD 500",
        payment: "fixed",
        level: "Junior",
        location: "Remote",
        skills: ["Premiere Pro", "After Effects"],
        posted: "2026-08-05T08:00:00Z",
        deadline: null
    },
    {
        id: "mock-012",
        title: "Cloud engineer (AWS) — contract",
        company: "Nexus Cloud",
        url: "https://mock.jobs.example/nexus-cloud/aws-engineer",
        description: "Harden infrastructure, set up IaC with Terraform and improve CI/CD pipelines for a SaaS product.",
        category: "devops",
        type: "Contract",
        budget: "$90-120/hour",
        payment: "hourly",
        level: "Expert",
        location: "Remote",
        skills: ["AWS", "Terraform", "CI/CD"],
        posted: "2026-08-04T08:00:00Z",
        deadline: "2026-09-30T00:00:00Z"
    }
];

let callCount = 0;

async function fetchMockJobs() {
    callCount += 1;

    // Simulate a source that occasionally fails so we can prove the
    // pipeline keeps going when one source is down.
    if (MOCK_SOURCE_FAIL_RATE > 0 && Math.random() < MOCK_SOURCE_FAIL_RATE) {
        throw new Error("Mock source simulated outage (MOCK_SOURCE_FAIL_RATE).");
    }

    // Every 4th sync re-emits mock-001 unchanged. It already exists in the
    // DB, so the pipeline must classify it as a duplicate, not an update.
    const jobs = [...MOCK_JOBS];
    if (callCount > 1 && callCount % 4 === 0) {
        jobs.push(MOCK_JOBS[0]);
    }
    if (callCount > 1 && callCount % 5 === 0) {
        jobs.push({
            ...MOCK_JOBS[3],
            id: "mock-013",
            title: "Data analyst for market research",
            company: "Kilimani Analytics",
            budget: "£50-70/hour"
        });
    }

    return jobs;
}

module.exports = createSourceAdapter({
    name: "mock_api",
    label: "Mock API (development)",
    type: "API",
    enabled: MOCK_SOURCE_ENABLED,
    syncIntervalMinutes: 30,
    description: "Deterministic generated jobs for development and tests. No external site is contacted.",
    fetchJobs: fetchMockJobs
});
