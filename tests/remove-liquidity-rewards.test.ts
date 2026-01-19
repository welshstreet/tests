import { describe, expect, it } from "vitest";

// Import test helper functions
import { setupExchangeLiquidity } from "./functions/setup-helper-functions";
import { donateRewards, getRewardUserInfo } from "./functions/rewards-helper-functions";
import { removeLiquidity } from "./functions/exchange-helper-functions";
import { getBalance } from "./functions/shared-read-only-helper-functions";

// Import test constants
import { 
    DONATE_WELSH, 
    DONATE_STREET,
    PRECISION,
    disp 
} from "./vitestconfig";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet1 = accounts.get("wallet_1")!;
const wallet2 = accounts.get("wallet_2")!;

describe("=== REMOVE LIQUIDITY BEHAVIOR VERIFICATION ===", () => {
    it("=== REMOVE LIQUIDITY REWARD REDISTRIBUTION VERIFICATION ===", () => {
        // ================================================================================
        // REMOVE-LIQUIDITY TIMING EXPLANATION:
        // In exchange.clar remove-liquidity function, the contract calls:
        // 1. update-remove-rewards (updates rewards) - USES CURRENT LP BALANCE
        // 2. credit-burn (burns LP tokens) - CHANGES USER'S LP BALANCE
        // 
        // This timing follows burn-liquidity pattern for redistribution behavior.
        // When users remove liquidity, their unclaimed rewards are redistributed
        // to remaining LP holders before position reduction.
        // 
        // DIFFERENT FROM PROVIDE-LIQUIDITY:
        // - provide-liquidity: Updates rewards AFTER token changes (for preservation)
        // - remove-liquidity: Updates rewards BEFORE token changes (for redistribution)
        // ================================================================================
        
        if (disp) {
            console.log("\n📊 REMOVE LIQUIDITY CALCULATION VERIFICATION");
            console.log("=".repeat(50));
            console.log("Testing reward redistribution during LP position reduction");
            console.log("=".repeat(50));
        }

        // STEP 1: Setup exchange with multiple LP holders
        const setup = setupExchangeLiquidity(false);
        
        if (disp) {
            console.log("\n📋 INITIAL LP DISTRIBUTION:");
            console.log(`Total LP: ${setup.totalLpSupply.toLocaleString()}`);
            console.log(`Deployer: ${(setup.totalLpSupply / 3).toLocaleString()} (33.33%)`);
            console.log(`Wallet1:  ${(setup.totalLpSupply / 3).toLocaleString()} (33.33%)`);
            console.log(`Wallet2:  ${(setup.totalLpSupply / 3).toLocaleString()} (33.33%)`);
        }

        // STEP 2: Donate rewards to create scenario for redistribution testing
        if (disp) {
            console.log("\n💰 REWARD DONATION:");
            console.log("Donating:", DONATE_WELSH.toLocaleString(), "WELSH,", DONATE_STREET.toLocaleString(), "STREET");
            console.log("Expected per holder: 333,333,333,333 → 333,333,330,000 WELSH (integer division)");
        }
        
        donateRewards(DONATE_WELSH, DONATE_STREET, deployer, disp);

        // STEP 3: Check wallet1's reward state BEFORE removing liquidity
        if (disp) {
            console.log("\n📊 WALLET1 BEFORE REMOVAL:");
        }
        
        // Calculate wallet1's LP balance dynamically (1/3 of total)
        const wallet1LpBalance = setup.totalLpSupply / 3; // 10,000,000,000,000 (10T)
        
        // Calculate expected unclaimed using contract's precision formula
        const globalIndexIncreaseA = Math.floor((DONATE_WELSH * PRECISION) / setup.totalLpSupply);
        const expectedUnclaimedA = Math.floor((wallet1LpBalance * globalIndexIncreaseA) / PRECISION);
        const globalIndexIncreaseB = Math.floor((DONATE_STREET * PRECISION) / setup.totalLpSupply);
        const expectedUnclaimedB = Math.floor((wallet1LpBalance * globalIndexIncreaseB) / PRECISION);
        
        const wallet1RewardsBefore = getRewardUserInfo(
            wallet1,
            wallet1LpBalance,      // balanceExpected: Current LP tokens (10T)
            10,                    // blockExpected: Block when LP position last changed
            0,                     // debtAExpected: Should be 0 initially
            0,                     // debtBExpected: Should be 0 initially
            0,                     // indexAExpected: Global index starts at 0
            0,                     // indexBExpected: Global index starts at 0
            expectedUnclaimedA,    // unclaimedAExpected: 1/3 of 1T donation
            expectedUnclaimedB,    // unclaimedBExpected: 1/3 of 100T donation
            wallet1,
            disp                   // Enable display for verification
        );

        if (disp) {
            console.log("📊 WALLET1 VALUES:");
            console.log(`LP tokens: ${wallet1LpBalance.toLocaleString()}`);
            console.log(`Unclaimed WELSH: ${expectedUnclaimedA.toLocaleString()}`);
            console.log(`Unclaimed STREET: ${expectedUnclaimedB.toLocaleString()}`);
        }

        // STEP 4: wallet1 removes 50% of liquidity - triggers redistribution
        const removalAmount = Math.floor(wallet1LpBalance / 2); // Remove 50% LP tokens
        
        if (disp) {
            console.log("\n⚡ REMOVING LIQUIDITY:");
            console.log(`Removing: ${removalAmount.toLocaleString()} LP tokens (50%)`);
            console.log(`Timing: Update rewards first, then burn tokens`);
            console.log(`Expected: Partial reward redistribution to remaining holders`);
        }

        // Calculate expected values for remove liquidity
        const reserveA = setup.reserveAExpected;
        const reserveB = setup.reserveBExpected;
        const totalLpSupply = setup.totalLpSupply;
        
        // Calculate withdrawn amounts (before tax) using BigInt for precision
        const availA = reserveA;
        const availB = reserveB;
        const grossAmountA = Number((BigInt(removalAmount) * BigInt(availA)) / BigInt(totalLpSupply));
        const grossAmountB = Number((BigInt(removalAmount) * BigInt(availB)) / BigInt(totalLpSupply));
        
        // Calculate tax (1% = 100 basis points) using BigInt for precision
        const taxA = Number((BigInt(grossAmountA) * 100n) / 10000n);
        const taxB = Number((BigInt(grossAmountB) * 100n) / 10000n);
        const userAmountA = grossAmountA - taxA;
        const userAmountB = grossAmountB - taxB;

        removeLiquidity(
            removalAmount,
            removalAmount,
            taxA,
            taxB,
            userAmountA,
            userAmountB,
            wallet1,
            disp
        );

        // STEP 5: Check wallet1's reward state AFTER removing liquidity
        if (disp) {
            console.log("\n📊 WALLET1 AFTER REMOVAL:");
        }
        
        // Calculate expected values after removal using contract's exact logic
        const expectedRemainingLp = wallet1LpBalance - removalAmount; // 5T remaining
        
        // Contract logic from update-remove-rewards:
        // 1. Calculate forfeited amount (proportional to LP removed)
        const lossRatio = Math.floor((removalAmount * PRECISION) / wallet1LpBalance);
        const forfeitedA = Math.floor((expectedUnclaimedA * lossRatio) / PRECISION);
        const forfeitedB = Math.floor((expectedUnclaimedB * lossRatio) / PRECISION);
        const keptUnclaimedA = expectedUnclaimedA - forfeitedA;
        const keptUnclaimedB = expectedUnclaimedB - forfeitedB;
        
        // 2. Redistribution updates global index
        // CRITICAL: other-lp = total-lp - ORIGINAL lp-balance (NOT the removal amount)
        const otherLp = setup.totalLpSupply - wallet1LpBalance; // 30T - 10T = 20T
        const redistIndexIncreaseA = Math.floor((forfeitedA * PRECISION) / otherLp);
        const redistIndexIncreaseB = Math.floor((forfeitedB * PRECISION) / otherLp);
        const newGlobalIndexA = globalIndexIncreaseA + redistIndexIncreaseA;
        const newGlobalIndexB = globalIndexIncreaseB + redistIndexIncreaseB;
        
        // 3. Calculate new unclaimed with UPDATED global index and REMAINING LP balance
        // Note: Contract uses (balance * (global - user_index)) / PRECISION where user_index is OLD
        const newUnclaimedA = Math.floor((expectedRemainingLp * newGlobalIndexA) / PRECISION);
        const newUnclaimedB = Math.floor((expectedRemainingLp * newGlobalIndexB) / PRECISION);
        
        // 4. After the bug fix, debt is always u0 because the contract uses:
        // - map-delete (wipes user state)
        // - Adjusts the personal index (keep-idx) to preserve kept unclaimed
        // Result: debt = 0, unclaimed = kept_unclaimed (no phantom rewards)
        const preservedDebtA = 0; // Always 0 after bug fix
        const preservedDebtB = 0; // Always 0 after bug fix
        
        // Final unclaimed equals kept amount (contract preserves this via adjusted index)
        const finalUnclaimedA = keptUnclaimedA;
        const finalUnclaimedB = keptUnclaimedB;
        
        // Calculate the adjusted personal index (keep-idx) used by the contract
        // keep-idx = new-global-index - (kept * PRECISION / remaining_balance)
        const keepIdxA = newGlobalIndexA - Math.floor((keptUnclaimedA * PRECISION) / expectedRemainingLp);
        const keepIdxB = newGlobalIndexB - Math.floor((keptUnclaimedB * PRECISION) / expectedRemainingLp);
        
        const wallet1RewardsAfter = getRewardUserInfo(
            wallet1,
            expectedRemainingLp,   // balanceExpected: 5T remaining LP tokens
            13,                    // blockExpected: Updates to current block
            preservedDebtA,        // debtAExpected: 0 (bug fix eliminates phantom rewards)
            preservedDebtB,        // debtBExpected: 0 (bug fix eliminates phantom rewards)
            keepIdxA,              // indexAExpected: Adjusted personal index to preserve kept unclaimed
            keepIdxB,              // indexBExpected: Adjusted personal index to preserve kept unclaimed
            finalUnclaimedA,       // unclaimedAExpected: Kept amount (no self-benefit from redistribution)
            finalUnclaimedB,       // unclaimedBExpected: Kept amount (no self-benefit from redistribution)
            wallet1,
            disp
        );

        // STEP 6: Check redistribution effect on wallet2
        if (disp) {
            console.log("\n📊 WALLET2 AFTER WALLET1 REMOVAL:");
        }
        
        // wallet2 has 10T LP and gets their share of wallet1's forfeited rewards
        const wallet2LpBalance = setup.totalLpSupply / 3; // 10T
        
        // Calculate wallet2's theoretical unclaimed amounts after redistribution
        // 
        // Step-by-step theoretical calculation matching the contract's exact integer arithmetic:
        //
        // 1. Initial state: Each holder gets 1/3 share of donated rewards
        //    - DONATE_WELSH: 100B, DONATE_STREET: 10T
        //    - Total LP: 30T (10T each holder)
        //    - Initial global indices after donation:
        const donationGlobalIncA = Math.floor((DONATE_WELSH * PRECISION) / setup.totalLpSupply);
        const donationGlobalIncB = Math.floor((DONATE_STREET * PRECISION) / setup.totalLpSupply);
        
        if (disp) {
            console.log(`\n🧮 THEORETICAL CALCULATION DEBUG:`);
            console.log(`DONATE_WELSH: ${DONATE_WELSH}`);
            console.log(`DONATE_STREET: ${DONATE_STREET}`);
            console.log(`TOTAL_LP: ${setup.totalLpSupply}`);
            console.log(`PRECISION: ${PRECISION}`);
            console.log(`Donation global index A: ${donationGlobalIncA}`);
            console.log(`Donation global index B: ${donationGlobalIncB}`);
        }
        
        // 2. Each holder's initial unclaimed rewards:
        const holderLpBalance = setup.totalLpSupply / 3; // 10T each
        const initialUnclaimedPerHolderA = Math.floor((holderLpBalance * donationGlobalIncA) / PRECISION);
        const initialUnclaimedPerHolderB = Math.floor((holderLpBalance * donationGlobalIncB) / PRECISION);
        
        if (disp) {
            console.log(`Holder LP balance: ${holderLpBalance}`);
            console.log(`Initial unclaimed per holder A: ${initialUnclaimedPerHolderA}`);
            console.log(`Initial unclaimed per holder B: ${initialUnclaimedPerHolderB}`);
        }
        
        // 3. When wallet1 removes 50% LP (5T), they forfeit proportional rewards:
        const removalPercentage = 0.5; // 50% removal
        const theoreticalForfeitedA = Math.floor(initialUnclaimedPerHolderA * removalPercentage);
        const theoreticalForfeitedB = Math.floor(initialUnclaimedPerHolderB * removalPercentage);
        
        if (disp) {
            console.log(`Theoretical forfeited A: ${theoreticalForfeitedA}`);
            console.log(`Theoretical forfeited B: ${theoreticalForfeitedB}`);
        }
        
        // 4. Forfeited rewards redistribute to remaining LP holders (deployer 10T + wallet2 10T = 20T)
        // CRITICAL: Redistribution goes to OTHER holders, NOT total remaining LP
        const otherHoldersLp = setup.totalLpSupply - holderLpBalance; // 30T - 10T = 20T (deployer + wallet2)
        const redistributionIncA = Math.floor((theoreticalForfeitedA * PRECISION) / otherHoldersLp);
        const redistributionIncB = Math.floor((theoreticalForfeitedB * PRECISION) / otherHoldersLp);
        
        if (disp) {
            console.log(`Other holders LP (not wallet1): ${otherHoldersLp}`);
            console.log(`Redistribution inc A: ${redistributionIncA}`);
            console.log(`Redistribution inc B: ${redistributionIncB}`);
        }
        
        // 5. Final global indices after redistribution
        const finalGlobalIndexA = donationGlobalIncA + redistributionIncA;
        const finalGlobalIndexB = donationGlobalIncB + redistributionIncB;
        
        if (disp) {
            console.log(`Final global index A: ${finalGlobalIndexA}`);
            console.log(`Final global index B: ${finalGlobalIndexB}`);
        }
        
        // 6. Wallet2's theoretical unclaimed (with 10T LP, original user indices = 0)
        const wallet2TheoreticalUnclaimedA = Math.floor((holderLpBalance * finalGlobalIndexA) / PRECISION);
        const wallet2TheoreticalUnclaimedB = Math.floor((holderLpBalance * finalGlobalIndexB) / PRECISION);
        
        if (disp) {
            console.log(`Wallet2 theoretical unclaimed A: ${wallet2TheoreticalUnclaimedA}`);
            console.log(`Wallet2 theoretical unclaimed B: ${wallet2TheoreticalUnclaimedB}`);
            console.log(`Contract actual wallet2 unclaimed A: 41666660000`);
            console.log(`Contract actual wallet2 unclaimed B: 4166666660000`);
        }
        
        const wallet2RewardsAfter = getRewardUserInfo(
            wallet2,
            wallet2LpBalance,               // balanceExpected: Unchanged LP tokens (10T)
            11,                             // blockExpected: From initial setup (not updated by wallet1's removal)
            0,                              // debtAExpected: Stays 0
            0,                              // debtBExpected: Stays 0
            0,                              // indexAExpected: Uses original user index
            0,                              // indexBExpected: Uses original user index
            wallet2TheoreticalUnclaimedA,   // unclaimedAExpected: Theoretical calculation
            wallet2TheoreticalUnclaimedB,   // unclaimedBExpected: Theoretical calculation
            wallet2,
            disp
        );

        if (disp) {
            console.log("\n📊 CALCULATION VERIFICATION:");
            console.log(`Wallet1 LP: ${expectedRemainingLp.toLocaleString()} (halved)`);
            console.log(`Wallet1 WELSH: ${finalUnclaimedA.toLocaleString()} (kept from ${expectedUnclaimedA.toLocaleString()})`);
            console.log(`Wallet2 WELSH: ${wallet2TheoreticalUnclaimedA.toLocaleString()} (increased from ${expectedUnclaimedA.toLocaleString()})`);
            console.log(`Forfeited by wallet1: ${forfeitedA.toLocaleString()} WELSH`);
            console.log(`Kept by wallet1: ${keptUnclaimedA.toLocaleString()} WELSH`);
            console.log(`Redistribution index increase: ${redistIndexIncreaseA.toLocaleString()}`);
            
            // Calculate totals
            const totalAfterWelsh = finalUnclaimedA + wallet2TheoreticalUnclaimedA; // wallet1 + wallet2 after removal
            const originalTotalWelsh = expectedUnclaimedA * 2; // wallet1 + wallet2 before (each had 1/3)
            
            console.log(`Total WELSH before: ${originalTotalWelsh.toLocaleString()}`);
            console.log(`Total WELSH after: ${totalAfterWelsh.toLocaleString()}`);
            console.log(`Difference: ${Math.abs(totalAfterWelsh - originalTotalWelsh).toLocaleString()} WELSH (rounding)`);
        }
        
        // STEP 7: Contract balance verification
        const rewardsContractBalance = getBalance(
            DONATE_WELSH, // Should still be 1T WELSH (unclaimed rewards remain in contract)
            "welshcorgicoin",
            { address: deployer, contractName: "rewards" },
            deployer,
            disp
        );
        
        if (disp) {
            console.log(`Contract balance: ${rewardsContractBalance.toLocaleString()} WELSH`);
            console.log("(Confirms proper redistribution accounting)");
        }
    });
});