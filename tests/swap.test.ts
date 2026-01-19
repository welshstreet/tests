import { describe, it } from "vitest";
import { disp, FEE_BASIS, LOCK_WELSH, SWAP_WELSH, SWAP_STREET } from "./vitestconfig";
import { setupInitialLiquidity, setupExchangeLiquidity } from "./functions/setup-helper-functions";
import { getExchangeInfo, lockLiquidity, swapAB, swapBA } from "./functions/exchange-helper-functions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet1 = accounts.get("wallet_1")!;

describe("=== SWAP TESTS ===", () => {
    it("=== SWAP-A-B PASS ===", () => {
        // STEP 1: Setup initial liquidity to enable swapping
        const setup = setupInitialLiquidity(disp);

        // STEP 2: Calculate expected swap values
        // Using AMM formula: amount_out = (amount_in_net * reserve_out) / (reserve_in + amount_in_net)
        // Where amount_in_net = amount_in - fees
        const amountA = SWAP_WELSH;
        const feeAExpected = Math.floor((amountA * setup.feeExpected) / FEE_BASIS);
        const revAExpected = Math.floor((amountA * setup.revenueExpected) / FEE_BASIS);
        const amountANet = amountA - feeAExpected - revAExpected;

        // AMM calculation
        const resA = setup.reserveAExpected;
        const resB = setup.reserveBExpected;
        const amountOut = Math.floor((amountANet * resB) / (resA + amountANet));

        // New reserve values
        const resANew = resA + amountANet;
        const resBNew = resB - amountOut;

        swapAB(
            amountA,
            amountA,        // amount-a (Welsh input)
            amountOut,      // amount-b (Street output - net)
            feeAExpected,   // fee-a
            resA,           // res-a (initial)
            resANew,        // res-a-new
            resB,           // res-b (initial)
            resBNew,        // res-b-new
            revAExpected,   // rev-a
            deployer,
            disp
        );
    });

    it("=== SWAP-B-A PASS ===", () => {
        // STEP 1: Setup initial liquidity to enable swapping
        const setup = setupInitialLiquidity(disp);

        // STEP 2: Calculate expected swap values
        // Using AMM formula: amount_out = (amount_in_net * reserve_out) / (reserve_in + amount_in_net)
        // Where amount_in_net = amount_in - fees
        const amountB = SWAP_STREET;
        const feeBExpected = Math.floor((amountB * setup.feeExpected) / FEE_BASIS);
        const revBExpected = Math.floor((amountB * setup.revenueExpected) / FEE_BASIS);
        const amountBNet = amountB - feeBExpected - revBExpected;
        
        // AMM calculation
        const resA = setup.reserveAExpected;
        const resB = setup.reserveBExpected;
        const amountOut = Math.floor((amountBNet * resA) / (resB + amountBNet));
        
        // New reserve values
        const resANew = resA - amountOut;
        const resBNew = resB + amountBNet;

        swapBA(
            amountB,
            amountOut,      // amount-a (Welsh output - net)
            amountB,        // amount-b (Street input)
            feeBExpected,   // fee-b
            resA,           // res-a (initial)
            resANew,        // res-a-new
            resB,           // res-b (initial)
            resBNew,        // res-b-new
            revBExpected,   // rev-b
            deployer,
            disp
        );
    });
    it("=== PROPORTIONAL LOCKED ADJUSTMENT DURING LARGE SWAP ===", () => {
        // STEP 1: Setup exchange with initial liquidity state (multi-user)
        const setup = setupExchangeLiquidity(disp);

        getExchangeInfo(
            setup.availAExpected,
            setup.availBExpected,
            setup.feeExpected,
            setup.lockedAExpected,
            setup.lockedBExpected,
            setup.reserveAExpected,
            setup.reserveBExpected,
            setup.revenueExpected,
            setup.taxExpected,
            deployer,
            disp
        );

        // STEP 2: Lock additional liquidity to create locked vs available split
        const lockAmountA = LOCK_WELSH;
        const lockAmountB = Math.floor((lockAmountA * setup.reserveBExpected) / setup.reserveAExpected);

        lockLiquidity(lockAmountA, lockAmountA, lockAmountB, deployer, disp);
        // Calculate state after locking
        const reservesAfterLock = {
            reserveA: setup.reserveAExpected + lockAmountA,
            reserveB: setup.reserveBExpected + lockAmountB,
            lockedA: lockAmountA,
            lockedB: lockAmountB,
        };

        getExchangeInfo(
            setup.availAExpected,
            setup.availBExpected,
            setup.feeExpected,
            lockAmountA,
            lockAmountB,
            setup.reserveAExpected + lockAmountA,
            setup.reserveBExpected + lockAmountB,
            setup.revenueExpected,
            setup.taxExpected,
            deployer,
            disp
        );
        
        // STEP 3: Perform large swap using proper AMM calculations
        const extremeSwapB = SWAP_STREET * 100;
        
        // Calculate fees using proper basis points (matching the working swap test pattern)
        const feeBExpected = Math.floor((extremeSwapB * setup.feeExpected) / FEE_BASIS); // fee = 100 basis points
        const revBExpected = Math.floor((extremeSwapB * setup.revenueExpected) / FEE_BASIS); // rev = 100 basis points
        const swapAmountBNet = extremeSwapB - feeBExpected - revBExpected;
        // AMM calculation for amount out
        const currentReserveA = reservesAfterLock.reserveA;
        const currentReserveB = reservesAfterLock.reserveB;
        const amountOutA = Math.floor((swapAmountBNet * currentReserveA) / (currentReserveB + swapAmountBNet));
        // New reserve values after swap
        const newReserveA = currentReserveA - amountOutA;
        const newReserveB = currentReserveB + swapAmountBNet;
        // Execute the swap following the working pattern from swap.test.ts
        swapBA(
            extremeSwapB,        // amountB input
            amountOutA,          // amount-a (Welsh output - net)
            extremeSwapB,        // amount-b (Street input)
            feeBExpected,        // feeBExpected
            currentReserveA,     // resAExpected (OLD reserves)
            newReserveA,         // resANewExpected (NEW reserves)
            currentReserveB,     // resBExpected (OLD reserves)
            newReserveB,         // resBNewExpected (NEW reserves)
            revBExpected,        // revBExpected
            wallet1,
            disp
        );
        
        // STEP 4: Calculate expected proportional locked amounts after swap  
        // The proportional fix should maintain: lock_new = (lock_old * reserve_new) / reserve_old
        // Use BigInt to ensure precise integer arithmetic matching the contract
        const lockedABig = BigInt(reservesAfterLock.lockedA);
        const lockedBBig = BigInt(reservesAfterLock.lockedB);
        const reserveABig = BigInt(reservesAfterLock.reserveA);
        const reserveBBig = BigInt(reservesAfterLock.reserveB);
        const newReserveABig = BigInt(newReserveA);
        const newReserveBBig = BigInt(newReserveB);
        
        const expectedLockedA = Number((lockedABig * newReserveABig) / reserveABig);
        const expectedLockedB = Number((lockedBBig * newReserveBBig) / reserveBBig);
        
        // Calculate available amounts (contract does: avail = reserve - locked)
        const expectedAvailA = newReserveA - expectedLockedA;
        const expectedAvailB = newReserveB - expectedLockedB;
        
        // STEP 5: Validate that the proportional fix worked using helper function
        getExchangeInfo(
            expectedAvailA,      // availAExpected (should be positive with proportional fix)
            expectedAvailB,      // availBExpected
            setup.feeExpected,   // feeExpected
            expectedLockedA,     // lockedAExpected (proportionally reduced)
            expectedLockedB,     // lockedBExpected (proportionally increased)
            newReserveA,         // reserveAExpected (reduced by swap)
            newReserveB,         // reserveBExpected (increased by swap)
            setup.revenueExpected, // revenueExpected
            setup.taxExpected,   // taxExpected
            deployer,
            disp
        );
    });

    it("=== ERR_ZERO_AMOUNT - SWAP-A-B ===", () => {
        setupInitialLiquidity(disp);
        
        swapAB(
            0,              // Zero amount A should trigger ERR_ZERO_AMOUNT
            0,              // amount-a expected
            0,              // amount-b expected
            0,              // feeAExpected
            0,              // resAExpected
            0,              // resANewExpected
            0,              // resBExpected
            0,              // resBNewExpected
            0,              // revAExpected
            deployer,
            disp
        );
    });

    it("=== ERR_INVALID_AMOUNT - SWAP-A-B ===", () => {
        // For ERR_INVALID_AMOUNT in swap-a-b, we need amount-b-net = 0
        // This happens when the AMM calculation results in 0 output
        // This can occur with extremely small input amounts or when reserves are very unbalanced
        
        // We'll use a tiny amount that results in 0 after AMM calculation
        setupInitialLiquidity(disp);
        const tinyAmount = 1; // 1 micro-token - should result in 0 output after fees and AMM
        
        swapAB(
            tinyAmount,     // Tiny amount that results in 0 output (ERR_INVALID_AMOUNT)
            0,              // amountInExpected
            0,              // amountOutExpected
            0,              // feeAExpected
            0,              // resAExpected
            0,              // resANewExpected
            0,              // resBExpected
            0,              // resBNewExpected
            0,              // revAExpected
            deployer,
            disp
        );
    });

    it("=== ERR_ZERO_AMOUNT - SWAP-B-A ===", () => {
        setupInitialLiquidity(disp);
        
        swapBA(
            0,              // Zero amount B should trigger ERR_ZERO_AMOUNT (but this checks amount-a-net > 0)
            0,              // amount-a expected
            0,              // amount-b expected
            0,              // feeBExpected
            0,              // resAExpected
            0,              // resANewExpected
            0,              // resBExpected
            0,              // resBNewExpected
            0,              // revBExpected
            deployer,
            disp
        );
    });

    it("=== ERR_INVALID_AMOUNT - SWAP-B-A ===", () => {
        // For ERR_INVALID_AMOUNT in swap-b-a, we need amount-b = 0
        // But since we already test zero amount-b above, this would be checking the second assert
        // Looking at the contract: (asserts! (> amount-b u0) ERR_INVALID_AMOUNT)
        // This is the same as the zero check, so let's use a scenario where calculation fails
        
        setupInitialLiquidity(disp);
        const tinyAmount = 1; // 1 micro-token that may trigger invalid amount
        
        swapBA(
            tinyAmount,     // Tiny amount that may trigger ERR_INVALID_AMOUNT
            0,              // amount-a expected
            tinyAmount,     // amount-b expected (input amount)
            0,              // feeBExpected
            0,              // resAExpected
            0,              // resANewExpected
            0,              // resBExpected
            0,              // resBNewExpected
            0,              // revBExpected
            deployer,
            disp
        );
    });
});
