const app = require("./app");
const { PORT, AGGREGATION_ENABLED } = require("./config");
const { startScheduler } = require("./aggregation/scheduler");
const logger = require("./aggregation/logger");

if (AGGREGATION_ENABLED) {
    startScheduler();
} else {
    logger.info("Job aggregation scheduler disabled (AGGREGATION_ENABLED=false).");
}

app.listen(PORT, () => {
    console.log("HireFlow running at http://localhost:" + PORT);
});
