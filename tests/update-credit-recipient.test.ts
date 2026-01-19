import { describe, it } from "vitest";
import { disp } from "./vitestconfig";
import { setupExchangeLiquidity } from "./functions/setup-helper-functions";
import { updateCreditRecipient } from "./functions/rewards-helper-functions";

const accounts = simnet.getAccounts();
const wallet1 = accounts.get("wallet_1")!;
const wallet2 = accounts.get("wallet_2")!;

describe("=== UPDATE CREDIT RECIPIENT TESTS ===", () => {
    it("=== UPDATE CREDIT RECIPIENT PASS ===", () => {
        if (disp) {
            console.log("✅ UPDATE CREDIT RECIPIENT: Success scenarios tested through credit transfer integration");
            console.log("   - transfer → update-transfer-recipient (as-contract call from .controller)");
        }
    });

    it("=== ERR_NOT_AUTHORIZED ===", () => {
        setupExchangeLiquidity(disp);
        updateCreditRecipient(wallet1, 1000000000, wallet2, disp);
    });
});