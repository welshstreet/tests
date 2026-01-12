import { describe, it } from "vitest";
import { disp, CONTRIBUTE_WELSH, INITIAL_WELSH, TOTAL_SUPPLY_WELSH } from "./vitestconfig"
import { setupGenesis } from "./functions/setup-helper-functions";
import { claim, contribute, getTotalContribution, getUserBalance, setClaimActive, setContributeActive, withdrawal } from "./functions/genesis-helper-functions";
import { getBalance } from "./functions/shared-read-only-helper-functions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet1 = accounts.get("wallet_1")!

describe("=== GENESIS WITHDRAWAL FUNCTION TESTS ===", () => {
    it("=== GENESIS WITHDRAWAL PASS ===", () => {
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

        // STEP 6: Check wallet1 street balance before withdrawal
        const expectedWelshBalance = TOTAL_SUPPLY_WELSH - INITIAL_WELSH * 4;
        const balanceBefore = getBalance(expectedWelshBalance, 'welshcorgicoin', deployer, deployer, disp);

        // STEP 7: wallet1 withdraws their contribution
        withdrawal(CONTRIBUTE_WELSH, deployer, disp);

        // STEP 8: Check wallet1 street balance after withdrawal
        getBalance(balanceBefore + CONTRIBUTE_WELSH, 'welshcorgicoin', deployer, deployer, disp);
    });
    
    it("=== ERR_ZERO_AMOUNT ===", () => {
        // STEP 1: setup genesis (no contributions, so genesis balance is 0)
        setupGenesis(disp);

        // STEP 2: Try to withdraw when genesis contract has zero WELSH balance (should fail with ERR_ZERO_AMOUNT - 500)
        // Using balanceExpected: 0 since we expect error
        withdrawal(0, deployer, disp);
    });

    it("=== ERR_NOT_CONTRACT_OWNER ===", () => {
        // STEP 1: setup genesis and add some contribution to create balance
        setupGenesis(disp);
        contribute(CONTRIBUTE_WELSH, CONTRIBUTE_WELSH, wallet1, disp);

        // STEP 2: Try to withdraw as non-owner (should fail with ERR_NOT_CONTRACT_OWNER - 501)  
        // Using balanceExpected: 0 since we expect error
        withdrawal(0, wallet1, disp);
    });
});