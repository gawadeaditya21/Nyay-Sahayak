import request from "supertest";
import { connectTestDb, clearTestDb, closeTestDb } from "./helpers/testDb.js";
import { createUserAndToken } from "./helpers/auth.js";

const { createTestApp } = await import("./helpers/createTestApp.js");
const app = createTestApp();

beforeAll(async () => {
  await connectTestDb();
});

afterEach(async () => {
  await clearTestDb();
});

afterAll(async () => {
  await closeTestDb();
});

test("GET /api/auth/me returns the authenticated user", async () => {
  const { user, token } = await createUserAndToken();

  const response = await request(app)
    .get("/api/auth/me")
    .set("Authorization", `Bearer ${token}`)
    .expect(200);

  expect(response.body.success).toBe(true);
  expect(response.body.user.id).toBe(String(user._id));
  expect(response.body.user.plan).toBe("free");
  expect(response.body.user.subscriptionStatus).toBe("none");
});