import { describe, it } from "vitest";
import { disp } from "./vitestconfig"
import { getBlocks, getClaimActive, getContributeActive, getTotalContribution, getUserBalance } from "./functions/genesis-helper-functions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;

describe("=== GENESIS READ ONLY FUNCTION TESTS ===", () => {
    it('=== GET BLOCKS PASS ===', () => {
        getBlocks(deployer, disp);
    });

    it("=== GET CLAIM ACTIVE ===", () => {
        const expectedActive = false;
        getClaimActive(expectedActive, deployer, disp);
    });

    it("=== GET CONTRIBUTE ACTIVE ===", () => {
        const expectedActive = true;
        getContributeActive(expectedActive, deployer, disp);
    });

    it("=== GET TOTAL CONTRIBUTION ===", () => {
        const totalExpected = 0;
        getTotalContribution(totalExpected, deployer, disp);
    });

    it("=== GET USER BALANCE ===", () => {
        const balanceExpected = 0;
        const claimedExpected = 0;
        getUserBalance(deployer, balanceExpected, claimedExpected, deployer, disp);
    });
});