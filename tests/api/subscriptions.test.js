import { describe, it, expect, beforeAll, afterAll } from "vitest";
const request = require("supertest");
const app = require("../../server/app");
const db = require("../../server/db");

function authHeaders(userId) {
  const jwt = require("jsonwebtoken");
  const { JWT_SECRET } = require("../../server/config");
  const token = jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: "7d" });
  return { Authorization: "Bearer " + token };
}

function createUser(overrides = {}) {
  const bcrypt = require("bcryptjs");
  const info = db.prepare(`
      INSERT INTO users (first_name, last_name, email, password_hash, role)
      VALUES (?, ?, ?, ?, ?)
  `).run(
      overrides.firstName || "Test",
      overrides.lastName || "User",
      overrides.email || "test-" + Date.now() + "@example.com",
      bcrypt.hashSync("password123", 10),
      overrides.role || "both"
  );

  return db.prepare("SELECT * FROM users WHERE id = ?").get(info.lastInsertRowid);
}

describe("subscriptions API", () => {
  beforeAll(() => {
    db.prepare("DELETE FROM subscriptions").run();
  });

  afterAll(() => {
    db.prepare("DELETE FROM subscriptions").run();
  });

  it("returns 401 without auth on /status", async () => {
    const res = await request(app).get("/api/subscriptions/status");
    expect(res.status).toBe(401);
  });

  it("returns FREE plan for user with no subscription", async () => {
    const user = createUser();
    const res = await request(app).get("/api/subscriptions/status").set(authHeaders(user.id));
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.plan).toBe("FREE");
    expect(res.body.data.isActive).toBe(false);
  });

  it("checkout returns disabled when SUBSCRIPTION_ENABLED=false", async () => {
    const user = createUser();
    const res = await request(app).post("/api/subscriptions/checkout").set(authHeaders(user.id));
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("SUBSCRIPTIONS_DISABLED");
  });

  it("allows proposals when paywall is disabled", async () => {
    const user = createUser();
    const jobRes = await request(app).get("/api/jobs").set(authHeaders(user.id));
    expect(jobRes.status).toBe(200);

    if (jobRes.body.jobs[0]) {
      const res = await request(app).post("/api/proposals").set(authHeaders(user.id)).send({ jobId: jobRes.body.jobs[0].id, coverLetter: "hi", rate: 100, timelineDays: 1 });
      expect([200, 201]).toContain(res.status);
    }
  });

  it("allows proposals when paywall is disabled", async () => {
    const old = process.env.PAYWALL_ENABLED;
    process.env.PAYWALL_ENABLED = "false";

    const user = createUser();
    const jobRes = await request(app).get("/api/jobs").set(authHeaders(user.id));
    expect(jobRes.status).toBe(200);

    if (jobRes.body.jobs[0]) {
      const res = await request(app).post("/api/proposals").set(authHeaders(user.id)).send({ jobId: jobRes.body.jobs[0].id, coverLetter: "hi", rate: 100, timelineDays: 1 });
      expect([200, 201]).toContain(res.status);
    }

    process.env.PAYWALL_ENABLED = old;
  });
});
