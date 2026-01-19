import { describe, it } from "vitest";
import { setupInitialLiquidity } from "./functions/setup-helper-functions";
import { disp, FEE_BASIS, DECIMALS, TAX, PROVIDE_WELSH, TOTAL_SUPPLY_WELSH } from "./vitestconfig"
import { getExchangeInfo, provideLiquidity, provideInitialLiquidity, removeLiquidity } from "./functions/exchange-helper-functions";
import { getBalance } from "./functions/shared-read-only-helper-functions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;

describe("=== LIQUIDITY SCENARIOS ===", () => {
    it("=== PROVIDE INITIAL LIQUIDITY, REMOVAL ALL LIQUIDITY, PROVIDE LIQUIDITY ===", () => {
        // STEP 1: Setup initial liquidity
        const setup = setupInitialLiquidity(disp);

        // STEP 2: Deployer removes all liquidity
        const amountLpToRemove = setup.mintedLpExpected; // Remove all LP tokens

        // Calculate expected values for remove-liquidity (using contract logic)
        const availA = setup.availAExpected;
        const availB = setup.availBExpected;
        const totalSupplyLp = setup.mintedLpExpected;

        // Contract calculations for remove-liquidity
        const removeAmountA = Math.floor((amountLpToRemove * availA) / totalSupplyLp);
        const removeAmountB = Math.floor((amountLpToRemove * availB) / totalSupplyLp);
        const taxA = Math.floor((removeAmountA * TAX) / FEE_BASIS); // tax = 100, BASIS = 10000
        const taxB = Math.floor((removeAmountB * TAX) / FEE_BASIS);
        const userA = removeAmountA - taxA;
        const userB = removeAmountB - taxB;

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

        // STEP 3: Check exchange info after remove liquidity
        const state = getExchangeInfo(
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

        // STEP 4: Deployer tries to provide liquidity again after all liquidity was removed
        const reserveA = state.reserveA;
        const reserveB = state.reserveB;

        const amountAToProvide = PROVIDE_WELSH
        const addedAExpected = amountAToProvide;
        const addedBExpected = Math.floor((amountAToProvide * reserveB) / reserveA);
        const mintedLpExpectedForProvideLiquidity = Math.floor((amountAToProvide * TOTAL_SUPPLY_WELSH) / reserveA);

        // This should failed due to error 710 ERR_INSUFFICIENT_AVAILABLE_LIQUIDITY
        provideLiquidity(
            amountAToProvide,
            addedAExpected,
            addedBExpected,
            mintedLpExpectedForProvideLiquidity,
            deployer,
            disp
        );

        // STEP 5: Deployer tries to provide initial liquidity after providing liquidity failed
        // After the fix, provide-initial-liquidity always uses geometric mean when total-supply-lp = 0
        // LP = sqrt(amount-a * amount-b)
        const mintedLpExpected = Math.floor(Math.sqrt(amountAToProvide * addedBExpected));

        provideInitialLiquidity(
            amountAToProvide,
            addedBExpected,
            amountAToProvide,
            addedBExpected,
            mintedLpExpected,
            deployer,
            disp
        );

        // STEP 6: Validate LP token balance
        getBalance(mintedLpExpected, 'credit', deployer, deployer, disp);
    })
});