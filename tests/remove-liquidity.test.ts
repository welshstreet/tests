import { describe, it } from "vitest";
import { setupInitialLiquidity } from "./functions/setup-helper-functions";
import { disp, MINT_AMOUNT, TOTAL_SUPPLY_WELSH } from "./vitestconfig"
import { getExchangeInfo, removeLiquidity } from "./functions/exchange-helper-functions";
import { getBalance, getTotalSupply } from "./functions/shared-read-only-helper-functions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;

describe("=== REMOVE LIQUIDITY TESTS ===", () => {
    it("=== REMOVE LIQUIDITY PASS ===", () => {
        // STEP 1: Setup initial liquidity
        const setup = setupInitialLiquidity(disp);

        // STEP 2: Get balances before provide liquidity
        let expectedWelshBalance = TOTAL_SUPPLY_WELSH - setup.amountA;
        let expectedStreetBalance = MINT_AMOUNT - setup.amountB;
        let expectedLpBalance = setup.mintedLpExpected;
        getBalance(expectedWelshBalance, "welshcorgicoin", deployer, deployer, disp);
        getBalance(expectedStreetBalance, "street", deployer, deployer, disp);
        getBalance(expectedLpBalance, "credit", deployer, deployer, disp);

        // STEP 3: Check LP total supply before burn
        getTotalSupply(setup.mintedLpExpected, "credit", deployer, disp);

        // STEP 4: Deployer removes all liquidity
        const amountLpToRemove = setup.mintedLpExpected; // Remove all LP tokens

        // Calculate expected values for remove-liquidity (using contract logic)
        const availA = setup.availAExpected;
        const availB = setup.availBExpected;
        const totalSupplyLp = setup.mintedLpExpected;

        // Contract calculations for remove-liquidity
        const amountA = Math.floor((amountLpToRemove * availA) / totalSupplyLp);
        const amountB = Math.floor((amountLpToRemove * availB) / totalSupplyLp);
        const taxA = Math.floor((amountA * 100) / 10000); // tax = 100, BASIS = 10000
        const taxB = Math.floor((amountB * 100) / 10000);
        const userA = amountA - taxA;
        const userB = amountB - taxB;

        // Remove all liquidity - this will make avail-a = 0 and avail-b = 0
        removeLiquidity(
            amountLpToRemove,
            amountLpToRemove, // burnedLpExpected
            taxA,             // taxAExpected
            taxB,             // taxBExpected
            userA,            // userAExpected
            userB,            // userBExpected
            deployer,
            disp
        );

        // STEP 5: Check exchange info after remove liquidity
        getExchangeInfo(
            0, // availAExpected
            0, // availBExpected
            100, // fee
            taxA, // lockedAexpected
            taxB, // lockedBexpected
            taxA, //reserveAexpected
            taxB, //reserveBexpected
            100, // revenueAexpected
            100, // tax
            deployer,
            disp
        );
    });

    it("=== ERR_ZERO_AMOUNT ===", () => {
        // STEP 1: Setup initial liquidity
        setupInitialLiquidity(disp);

        // STEP 2: Try to remove zero LP amount
        const amountLp = 0; // Zero amount (should trigger ERR_ZERO_AMOUNT)
        const burnedLpExpected = 0;  // Won't be used due to error
        const taxAExpected = 0;      // Won't be used due to error
        const taxBExpected = 0;      // Won't be used due to error
        const userAExpected = 0;     // Won't be used due to error
        const userBExpected = 0;     // Won't be used due to error

        removeLiquidity(
            amountLp,
            burnedLpExpected,
            taxAExpected,
            taxBExpected,
            userAExpected,
            userBExpected,
            deployer,
            disp
        );
    });
});