import { describe, it } from "vitest";
import { disp } from "./vitestconfig";
import { setupRewards } from "./functions/setup-helper-functions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet1 = accounts.get("wallet_1")!;
const wallet2 = accounts.get("wallet_2")!;

describe("=== SETUP REWARDS TESTS ===", () => {
    it("=== VERIFY SETUP REWARDS HELPER FUNCTION===", () => {
        const setup = setupRewards(disp);
    })
});