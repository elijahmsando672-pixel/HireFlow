const mockProvider = require("./mock");
const pesapalProvider = require("./pesapal");
const { SUBSCRIPTION_PROVIDER } = require("../config");

function getProvider() {
    const provider = SUBSCRIPTION_PROVIDER || "mock";
    if (provider === "pesapal") {
        return pesapalProvider;
    }
    return mockProvider;
}

module.exports = {
    getProvider,
    mock: mockProvider,
    pesapal: pesapalProvider
};
