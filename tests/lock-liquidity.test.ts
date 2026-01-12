import { describe, it } from "vitest";
import { setupInitialLiquidity } from "./functions/setup-helper-functions";
import { getExchangeInfo, lockLiquidity } from "./functions/exchange-helper-functions";
import { disp } from "./vitestconfig";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet1 = accounts.get("wallet_1")!;

describe("=== LOCK LIQUIDITY TESTS ===", () => {
    it("=== LOCK LIQUIDITY PASS ===", () => {
        // STEP 1: Setup initial liquidity
        const setup = setupInitialLiquidity(disp);

        // STEP 2: Calculate expected values for locking liquidity
        const amountA = 1000000; // Lock 1M WELSH
        const reserveA = setup.reserveAExpected;
        const reserveB = setup.reserveBExpected;

        // Calculate proportional amount-b (from contract logic)
        const amountB = Math.floor((amountA * reserveB) / reserveA);

        const lockedAExpected = amountA;
        const lockedBExpected = amountB;

        // STEP 3: Lock liquidity
        lockLiquidity(
            amountA,
            lockedAExpected,
            lockedBExpected,
            deployer,
            disp
        );

        // STEP 4: Validate exchange state after locking
        const availAExpected = setup.availAExpected; // Available does not change
        const availBExpected = setup.availBExpected; // Available does not change
        const newLockedAExpected = amountA;     // Locked increases
        const newLockedBExpected = amountB;     // Locked increases
        const newReserveAExpected = setup.reserveAExpected + amountA; // Reserves increase
        const newReserveBExpected = setup.reserveBExpected + amountB; // Reserves increase

        getExchangeInfo(
            availAExpected,
            availBExpected,
            100, // fee unchanged
            newLockedAExpected,
            newLockedBExpected,
            newReserveAExpected,
            newReserveBExpected,
            100, // revenue unchanged
            100, // tax unchanged
            deployer,
            disp
        );
    });

    it("=== ERR_ZERO_AMOUNT ===", () => {
        // STEP 1: Setup initial liquidity
        setupInitialLiquidity(disp);

        // STEP 2: Try to lock zero amount
        const amountA = 0; // Zero amount (should trigger ERR_ZERO_AMOUNT)
        const lockedAExpected = 0;  // Won't be used due to error
        const lockedBExpected = 0;  // Won't be used due to error

        lockLiquidity(
            amountA,
            lockedAExpected,
            lockedBExpected,
            deployer,
            disp
        );
    });

    it("=== ERR_NOT_INITIALIZED ===", () => {
        // STEP 1: Fresh test state (no liquidity provided)
        // Do NOT call setupInitialLiquidity() - we want reserves to be zero

        // STEP 2: Try to lock liquidity as unauthorized sender when not initialized
        const amountA = 1000000;
        const lockedAExpected = 0;  // Won't be used due to error
        const lockedBExpected = 0;  // Won't be used due to error

        lockLiquidity(
            amountA,
            lockedAExpected,
            lockedBExpected,
            wallet1, // Unauthorized sender when reserves are zero
            disp
        );
    });
});