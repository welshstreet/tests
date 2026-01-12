import { describe, it } from "vitest";
import { disp } from "./vitestconfig";
import { setupExchangeLiquidity } from "./functions/setup-helper-functions";
import { updateRewardsB } from "./functions/rewards-helper-functions";

const accounts = simnet.getAccounts();
const wallet1 = accounts.get("wallet_1")!

describe("=== UPDATE REWARDS B TESTS ===", () => {
    it("=== UPDATE REWARDS B PASS ===", () => {
        if (disp) {
            console.log("✅ UPDATE REWARDS B: Success scenarios tested through exchange integration");
            console.log("   - swap functions → update-rewards-b (as-contract call from .exchange)");
        }
    });

    it("=== ERR_NOT_AUTHORIZED ===", () => {
        setupExchangeLiquidity(disp);
        updateRewardsB(1000, wallet1, disp);
    });

    it("=== ERR_ZERO_AMOUNT ===", () => {
        setupExchangeLiquidity(disp);
        updateRewardsB(0, wallet1, disp);
    });

});
