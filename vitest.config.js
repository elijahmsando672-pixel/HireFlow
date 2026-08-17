import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        include: ["tests/**/*.test.js"],
        setupFiles: ["tests/setup.cjs"],
        env: {
            NODE_ENV: "test",
            SUBSCRIPTION_ENABLED: "false",
            PAYWALL_ENABLED: "false",
            AGGREGATION_ENABLED: "false",
            MOCK_SOURCE_ENABLED: "false"
        }
    }
});
