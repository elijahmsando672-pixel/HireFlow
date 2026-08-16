// Canonical enums shared across the aggregation pipeline.
// Source adapters should map their own values onto these.

const JOB_STATUS = {
    ACTIVE: "ACTIVE",
    EXPIRED: "EXPIRED",
    CLOSED: "CLOSED",
    REMOVED: "REMOVED"
};

const JOB_TYPES = [
    "full-time",
    "part-time",
    "contract",
    "freelance",
    "internship"
];

const EXPERIENCE_LEVELS = [
    "entry",
    "junior",
    "intermediate",
    "senior",
    "expert"
];

// Map source-provided job-type strings to the canonical set.
const JOB_TYPE_MAP = {
    "full time": "full-time",
    "full-time": "full-time",
    "fulltime": "full-time",
    "permanent": "full-time",
    "part time": "part-time",
    "part-time": "part-time",
    "parttime": "part-time",
    "freelance": "freelance",
    "freelancer": "freelance",
    "contract": "contract",
    "contractual": "contract",
    "temporary": "contract",
    "internship": "internship",
    "intern": "internship"
};

const EXPERIENCE_LEVEL_MAP = {
    "entry": "entry",
    "entry level": "entry",
    "junior": "junior",
    "mid": "intermediate",
    "mid level": "intermediate",
    "intermediate": "intermediate",
    "senior": "senior",
    "senior level": "senior",
    "lead": "senior",
    "principal": "expert",
    "expert": "expert",
    "expert level": "expert"
};

const CURRENCY_MAP = {
    "KES": "KES",
    "KSH": "KES",
    "Ksh": "KES",
    "USD": "USD",
    "$": "USD",
    "EUR": "EUR",
    "€": "EUR",
    "GBP": "GBP",
    "£": "GBP",
    "NGN": "NGN",
    "ZAR": "ZAR",
    "Rands": "ZAR",
    "GHS": "GHS",
    "UGX": "UGX",
    "TZS": "TZS",
    "RWF": "RWF"
};

const PAYMENT_TYPES = ["fixed", "hourly", "monthly"];

const SOURCE_STATUS = {
    IDLE: "IDLE",
    RUNNING: "RUNNING",
    OK: "OK",
    ERROR: "ERROR"
};

module.exports = {
    JOB_STATUS,
    JOB_TYPES,
    EXPERIENCE_LEVELS,
    JOB_TYPE_MAP,
    EXPERIENCE_LEVEL_MAP,
    CURRENCY_MAP,
    PAYMENT_TYPES,
    SOURCE_STATUS
};
