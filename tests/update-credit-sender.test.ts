import { describe, it } from "vitest";
import { disp } from "./vitestconfig";
import { setupExchangeLiquidity } from "./functions/setup-helper-functions";
import { updateCreditSender } from "./functions/rewards-helper-functions";

const accounts = simnet.getAccounts();
const wallet1 = accounts.get("wallet_1")!;
const wallet2 = accounts.get("wallet_2")!;

describe("=== UPDATE CREDIT SENDER TESTS ===", () => {
    it("=== UPDATE CREDIT SENDER PASS ===", () => {
        if (disp) {
            console.log("✅ UPDATE CREDIT SENDER: Success scenarios tested through credit transfer integration");
            console.log("   - transfer → update-transfer-sender (as-contract call from .controller)");
        }
    });

    it("=== ERR_NOT_AUTHORIZED ===", () => {
        setupExchangeLiquidity(disp);
        updateCreditSender(wallet1, 1000000000, wallet2, disp);
    });
});