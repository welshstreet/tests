import { describe, it } from "vitest";
import { disp } from "./vitestconfig";
import { setupExchangeLiquidity } from "./functions/setup-helper-functions";
import { updateRecipientRewards } from "./functions/rewards-helper-functions";

const accounts = simnet.getAccounts();
const wallet1 = accounts.get("wallet_1")!;
const wallet2 = accounts.get("wallet_2")!;

describe("=== UPDATE RECIPIENT REWARDS TESTS ===", () => {
    it("=== UPDATE RECIPIENT REWARDS PASS ===", () => {
        if (disp) {
            console.log("✅ UPDATE RECIPIENT REWARDS: Success scenarios tested through credit transfer integration");
            console.log("   - transfer-credit → update-recipient-rewards (as-contract call from .comptroller)");
        }
    });

    it("=== ERR_NOT_AUTHORIZED ===", () => {
        setupExchangeLiquidity(disp);
        updateRecipientRewards(wallet1, 1000000000, wallet2, disp);
    });
});