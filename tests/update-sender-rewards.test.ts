import { describe, it } from "vitest";
import { disp } from "./vitestconfig";
import { setupExchangeLiquidity } from "./functions/setup-helper-functions";
import { updateSenderRewards } from "./functions/rewards-helper-functions";

const accounts = simnet.getAccounts();
const wallet1 = accounts.get("wallet_1")!;
const wallet2 = accounts.get("wallet_2")!;

describe("=== UPDATE SENDER REWARDS TESTS ===", () => {
    it("=== UPDATE SENDER REWARDS PASS ===", () => {
        if (disp) {
            console.log("✅ UPDATE SENDER REWARDS: Success scenarios tested through credit transfer integration");
            console.log("   - transfer-credit → update-sender-rewards (as-contract call from .comptroller)");
        }
    });

    it("=== ERR_NOT_AUTHORIZED ===", () => {
        setupExchangeLiquidity(disp);
        updateSenderRewards(wallet1, 1000000000, wallet2, disp);
    });
});