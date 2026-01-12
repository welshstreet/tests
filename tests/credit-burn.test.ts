import { describe, it } from "vitest";
import { disp, MINT_AMOUNT } from "./vitestconfig"
import { burn } from "./functions/credit-helper-functions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;

describe("=== CREDIT BURN TESTS ===", () => {
    it("=== CREDIT BURN PASS ===", () => {
        const amountExpected = MINT_AMOUNT;
        burn(amountExpected, deployer, disp);
    });

    it("=== ERR_ZERO_AMOUNT ===", () => {
        const amountExpected = 0;
        burn(amountExpected, deployer, disp);
    });

    it("=== ERR_NOT_AUTHORIZED ===", () => {
        const amountExpected = MINT_AMOUNT;
        burn(amountExpected, deployer, disp);
    });
});