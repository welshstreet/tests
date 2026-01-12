import { describe, it } from "vitest";
import { disp } from "./vitestconfig"
import { getCurrentEpoch, getLastMintBlock } from "./functions/street-helper-functions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;

describe("=== STREET READ ONLY FUNCTION TESTS ===", () => {
    it("=== GET CURRENT EPOCH ===", () => {
        const epochExpected = 0;
        getCurrentEpoch(epochExpected, deployer, disp);
    });

    it("=== GET LAST MINT BLOCK ===", () => {
        const blockExpected = 0;
        getLastMintBlock(blockExpected, deployer, disp);
    });
});