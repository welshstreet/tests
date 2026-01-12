import { describe, it } from "vitest";
import { disp } from "./vitestconfig"
import { getBlocks, getExchangeInfo } from "./functions/exchange-helper-functions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;

describe("=== EXCHANGE READ ONLY FUNCTION TESTS ===", () => {
    it('=== GET BLOCKS PASS ===', () => {
        getBlocks(deployer, disp);
    });

    it("=== GET EXCHANGE INFO ===", () => {
        const availAExpected = 0;
        const availBExpected = 0;
        const feeExpected = 100;
        const lockedAExpected = 0;
        const lockedBExpected = 0;
        const reserveAExpected = 0;
        const reserveBExpected = 0;
        const revenueExpected = 100;
        const taxExpected = 100;

        getExchangeInfo(
            availAExpected,
            availBExpected,
            feeExpected,
            lockedAExpected,
            lockedBExpected,
            reserveAExpected,
            reserveBExpected,
            revenueExpected,
            taxExpected,
            deployer,
            disp
        );
    })
});