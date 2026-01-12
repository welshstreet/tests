import { describe, it } from "vitest";
import { disp, CONTRIBUTE_WELSH } from "./vitestconfig"
import { setupGenesis } from "./functions/setup-helper-functions";
import { contribute, getTotalContribution, getUserBalance, setContributeActive } from "./functions/genesis-helper-functions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet1 = accounts.get("wallet_1")!

describe("=== GENESIS CONTRIBUTE FUNCTION TESTS ===", () => {
    it("=== GENESIS CONTRIBUTE PASS ===", () => {
        // STEP 1: setup genesis
        const setup = setupGenesis(disp);

        // STEP 2: wallet1 contributes
        contribute(CONTRIBUTE_WELSH, CONTRIBUTE_WELSH, wallet1, disp);
        getTotalContribution(CONTRIBUTE_WELSH, deployer, disp);

        // STEP 3: Verify the user balance after contribution
        const balanceExpected = CONTRIBUTE_WELSH;
        const claimedExpected = 0;
        getUserBalance(wallet1, balanceExpected, claimedExpected, deployer, disp);
    });

    it("=== ERR_NOT_ACTIVE_FUND ===", () => {
        // STEP 1: setup genesis
        setupGenesis(disp);

        // STEP 2: Deactivate contribute
        setContributeActive(false, deployer, disp);

        // STEP 3: Try to contribute when contribute is not active (should fail with ERR_NOT_ACTIVE_FUND - 502)
        // Using amount: CONTRIBUTE_WELSH, totalExpected: 0 since we expect error
        contribute(CONTRIBUTE_WELSH, 0, wallet1, disp);
    });

    it("=== ERR_ZERO_AMOUNT ===", () => {
        // STEP 1: setup genesis
        setupGenesis(disp);

        // STEP 2: Try to contribute with zero amount (should fail with ERR_ZERO_AMOUNT - 500)
        // Using amount: 0, totalExpected: 0 since we expect error
        contribute(0, 0, wallet1, disp);
    });
});