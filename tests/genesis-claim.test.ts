import { describe, it } from "vitest";
import { disp, CONTRIBUTE_WELSH } from "./vitestconfig"
import { setupGenesis } from "./functions/setup-helper-functions";
import { claim, contribute, getTotalContribution, getUserBalance, setClaimActive, setContributeActive } from "./functions/genesis-helper-functions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet1 = accounts.get("wallet_1")!

describe("=== GENESIS CLAIM FUNCTION TESTS ===", () => {
    it("=== GENESIS CLAIM PASS ===", () => {
        // STEP 1: setup genesis
        const setup = setupGenesis(disp);

        // STEP 2: wallet1 contributes
        contribute(CONTRIBUTE_WELSH, CONTRIBUTE_WELSH, wallet1, disp);
        const totalContribution = getTotalContribution(CONTRIBUTE_WELSH, deployer, disp);

        // STEP 3: Verify the user balance after contribution
        let balanceExpected = CONTRIBUTE_WELSH;
        let claimedExpected = 0;
        getUserBalance(wallet1, balanceExpected, claimedExpected, deployer, disp);

        // STEP 4: deactivate contribute and activate claim
        setContributeActive(false, deployer, disp);
        setClaimActive(true, deployer, disp);

        // STEP 5: wallet1 claims their tokens
        balanceExpected = CONTRIBUTE_WELSH;
        claimedExpected = CONTRIBUTE_WELSH / totalContribution * setup.streetMintExpected;
        claim(balanceExpected, claimedExpected, wallet1, disp);
    });

    it("=== ERR_NOT_ACTIVE_FUND ===", () => {
        // STEP 1: setup genesis (claim-active starts as false)
        setupGenesis(disp);

        // STEP 2: Try to claim when claim is not active (should fail with ERR_NOT_ACTIVE_FUND - 502)
        // Using balanceExpected: 0, claimedExpected: 0 since we expect error
        claim(0, 0, wallet1, disp);
    });

    it("=== ERR_ZERO_AMOUNT ===", () => {
        // STEP 1: setup genesis
        setupGenesis(disp);

        // STEP 2: Activate claim without any contribution (user balance is 0)
        setClaimActive(true, deployer, disp);

        // STEP 3: Try to claim with zero balance (should fail with ERR_ZERO_AMOUNT - 500)
        // Using balanceExpected: 0, claimedExpected: 0 since we expect error
        claim(0, 0, wallet1, disp);
    });
});