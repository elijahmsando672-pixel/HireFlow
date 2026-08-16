const { LOG_LEVEL } = require("../config");

const LEVELS = { debug: 10, info: 20, warn: 30, error: 40, silent: 100 };
const configured = LEVELS[LOG_LEVEL] !== undefined ? LEVELS[LOG_LEVEL] : LEVELS.info;

function safeArgs(args) {
    return args.map((arg) => {
        if (arg instanceof Error) {
            return { message: arg.message, stack: arg.stack };
        }
        if (typeof arg === "object" && arg !== null) {
            const copy = { ...arg };
            // Never log sensitive values even if they sneak into a payload.
            for (const key of Object.keys(copy)) {
                if (/password|token|secret|api[-_]?key|authorization/i.test(key)) {
                    copy[key] = "[REDACTED]";
                }
            }
            return copy;
        }
        return arg;
    });
}

function write(level, label, ...args) {
    if (LEVELS[level] < configured) return;
    const time = new Date().toISOString();
    const parts = safeArgs(args).map((arg) => {
        if (typeof arg === "string") return arg;
        try {
            return JSON.stringify(arg);
        } catch {
            return String(arg);
        }
    });
    const line = `${time} [${label}] ${parts.join(" ")}`;
    if (level === "error") {
        process.stderr.write(line + "\n");
    } else {
        process.stdout.write(line + "\n");
    }
}

module.exports = {
    debug: (...args) => write("debug", "DEBUG", ...args),
    info: (...args) => write("info", "INFO", ...args),
    warn: (...args) => write("warn", "WARN", ...args),
    error: (...args) => write("error", "ERROR", ...args)
};
