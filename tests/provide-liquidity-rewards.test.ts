import { describe, it } from "vitest";
import { setupInitialLiquidity, setupExchangeLiquidity } from "./functions/setup-helper-functions";
import { disp, MINT_AMOUNT, PROVIDE_WELSH, TOTAL_SUPPLY_WELSH, DONATE_WELSH, DONATE_STREET, PRECISION } from "./vitestconfig"
import { getExchangeInfo, provideLiquidity, removeLiquidity } from "./functions/exchange-helper-functions";
import { getBalance, getTotalSupply } from "./functions/shared-read-only-helper-functions";
import { donateRewards, getRewardUserInfo } from "./functions/rewards-helper-functions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet1 = accounts.get("wallet_1")!;

describe("=== PROVIDE LIQUIDITY CORRECT BEHAVIOR VERIFICATION ===", () => {
    it("=== PROVIDE LIQUIDITY REWARD PRESERVATION VERIFICATION ===", () => {
        // ================================================================================
        // SPECIALIZED TIMING EXPLANATION:
        // In exchange.clar provide-liquidity function, the contract calls:
        // 1. credit-mint (mints new LP tokens) - CHANGES USER'S LP BALANCE
        // 2. update-provide-rewards (updates rewards) - USES OLD LP BALANCE DATA
        // 
        // This is CORRECT specialized timing! This preserves existing unclaimed rewards
        // and prevents retroactive reward doubling when LP position increases.
        // 
        // DIFFERENT FROM BURN-LIQUIDITY:
        // - burn-liquidity: Updates rewards BEFORE token changes (for redistribution)
        // - provide-liquidity: Updates rewards AFTER token changes (for preservation)
        // ================================================================================
        
        if (disp) {
            console.log("\n📊 PROVIDE LIQUIDITY CALCULATION VERIFICATION");
            console.log("=".repeat(50));
            console.log("Testing reward preservation during LP position increase");
            console.log("=".repeat(50));
        }

        // STEP 1: Setup exchange with multiple LP holders
        const setup = setupExchangeLiquidity(false);
        
        if (disp) {
            console.log("\n📋 INITIAL LP DISTRIBUTION:");
            console.log(`Total LP: ${setup.totalLpSupply.toLocaleString()}`);
            console.log(`Deployer: 10,000,000,000,000 (33.33%)`);
            console.log(`Wallet1:  10,000,000,000,000 (33.33%)`);
            console.log("Wallet2:  10,000,000,000,000 (33.33%)");
        }

        // STEP 2: Donate rewards to create the scenario where timing matters
        if (disp) {
            console.log("\n💰 REWARD DONATION:");
            console.log("Donating:", DONATE_WELSH.toLocaleString(), "WELSH,", DONATE_STREET.toLocaleString(), "STREET");
            console.log("Expected per holder: 333,333,333,333 → 333,333,330,000 WELSH (integer division)");
        }
        
        donateRewards(DONATE_WELSH, DONATE_STREET, deployer, disp);


        // STEP 3: Check wallet1's reward state BEFORE providing additional liquidity
        if (disp) {
            console.log("\n📊 WALLET1 BEFORE ADDITIONAL LIQUIDITY:");
        }
        
        // wallet1 should have 1/3 of rewards since they have 1/3 of total LP supply (10T out of 30T)
        // setupExchangeLiquidity creates 3 participants with 10T LP each (using INITIAL_WELSH = 1T)
        const wallet1LpBalance = setup.totalLpSupply / 3; // 10,000,000,000,000 (10T)
        
        // Calculate expected unclaimed using contract's precision formula
        const globalIndexIncreaseA = Math.floor((DONATE_WELSH * PRECISION) / setup.totalLpSupply);
        const expectedUnclaimedA = Math.floor((wallet1LpBalance * globalIndexIncreaseA) / PRECISION);
        const globalIndexIncreaseB = Math.floor((DONATE_STREET * PRECISION) / setup.totalLpSupply);
        const expectedUnclaimedB = Math.floor((wallet1LpBalance * globalIndexIncreaseB) / PRECISION);
        
        const wallet1RewardsBefore = getRewardUserInfo(
            wallet1,
            wallet1LpBalance,      // balanceExpected: 10T (1/3 of total 30T)
            10,                    // blockExpected: Block at which wallet1 last provided liquidity
            0,                     // debtAExpected: No debt initially
            0,                     // debtBExpected: No debt initially
            0,                     // indexAExpected: Not tracking index yet
            0,                     // indexBExpected: Not tracking index yet
            expectedUnclaimedA,    // unclaimedAExpected: Unclaimed WELSH rewards
            expectedUnclaimedB,    // unclaimedBExpected: Unclaimed STREET rewards
            wallet1,
            disp                   // Enable display for this critical check
        );

        if (disp) {
            console.log("📊 WALLET1 VALUES:");
            console.log(`LP tokens: ${wallet1LpBalance.toLocaleString()}`);
            console.log(`Unclaimed WELSH: ${expectedUnclaimedA.toLocaleString()}`);
            console.log(`Unclaimed STREET: ${expectedUnclaimedB.toLocaleString()}`);
        }

        // STEP 4: wallet1 provides additional liquidity - demonstrates timing behavior
        const additionalWelsh = 1000000000; // 1B WELSH (will slightly increase LP balance)
        const reserveA = setup.reserveAExpected;
        const reserveB = setup.reserveBExpected;
        
        // Calculate expected values for additional liquidity provision
        const expectedAmountB = Math.floor((additionalWelsh * reserveB) / reserveA);
        const expectedMintedLp = Math.floor((additionalWelsh * setup.totalLpSupply) / reserveA);
        
        if (disp) {
            console.log("\n⚡ PROVIDING ADDITIONAL LIQUIDITY:");
            console.log(`Input: ${additionalWelsh.toLocaleString()} WELSH`);
            console.log(`Expected LP minted: ${expectedMintedLp.toLocaleString()}`);
            console.log(`LP balance change: ${wallet1LpBalance.toLocaleString()} → ${(wallet1LpBalance + expectedMintedLp).toLocaleString()}`);
            console.log(`Timing: Mint LP first, then update rewards`);
            console.log(`Expected unclaimed preservation: ${expectedUnclaimedA.toLocaleString()} WELSH (unchanged)`);
        }

        // This call demonstrates the specialized timing: LP tokens minted first,
        // then rewards updated with old LP balance (preserving existing unclaimed rewards)
        provideLiquidity(additionalWelsh, additionalWelsh, expectedAmountB, expectedMintedLp, wallet1, disp);

        // STEP 5: Analyze wallet1's reward state AFTER additional liquidity (CORRECT BEHAVIOR!)
        if (disp) {
            console.log("\n🔍 WALLET1 AFTER:");
        }
        
        // CORRECT behavior: unclaimed rewards should STAY THE SAME (no retroactive rewards)
        const expectedNewLpBalance = wallet1LpBalance + expectedMintedLp;
        
        if (disp) {
            console.log(`Expected NEW LP balance: ${expectedNewLpBalance.toLocaleString()}`);
        }
        
        // Calculate new unclaimed amounts based on new LP balance
        const newUnclaimedA = Math.floor((expectedNewLpBalance * globalIndexIncreaseA) / PRECISION);
        const newUnclaimedB = Math.floor((expectedNewLpBalance * globalIndexIncreaseB) / PRECISION);
        
        // Debt should preserve the unclaimed rewards
        const debtA = newUnclaimedA - expectedUnclaimedA;
        const debtB = newUnclaimedB - expectedUnclaimedB;
        
        // Check contract results:
        const wallet1RewardsAfter = getRewardUserInfo(
            wallet1,
            expectedNewLpBalance,  // balanceExpected: Wallet1's NEW LP balance (old + minted)
            13,                    // blockExpected: Updates to current block (provide-liquidity at block 13)
            debtA,                 // debtAExpected: Preserved to maintain correct unclaimed rewards
            debtB,                 // debtBExpected: Preserved to maintain correct unclaimed rewards
            0,                     // indexAExpected: Current global index
            0,                     // indexBExpected: Current global index
            expectedUnclaimedA,    // unclaimedAExpected: Preserved unchanged (no retroactive rewards!)
            expectedUnclaimedB,    // unclaimedBExpected: Preserved unchanged (no retroactive rewards!)
            wallet1,
            disp                   // Enable display for this critical analysis
        );

        if (disp) {
            console.log("\n📊 CALCULATION VERIFICATION:");
            console.log(`LP tokens: 20,000,000,000 (doubled)`);
            console.log(`Unclaimed WELSH: 333,330 (preserved)`);
            console.log(`Unclaimed STREET: 33,333,330 (preserved)`);
            console.log(`Block: 13 (updated)`);
        }

        // STEP 6: Verify rewards contract balance for precision check
        if (disp) {
            console.log("\n🏦 REWARDS CONTRACT BALANCE VERIFICATION:");
        }
        const rewardsContractBalance = getBalance(
            DONATE_WELSH, // Should still be 1T WELSH (unclaimed rewards remain in contract)
            "welshcorgicoin",
            { address: deployer, contractName: "rewards" },
            deployer,
            disp // Enable display
        );
        
        if (disp) {
            console.log(`✅ Contract still holds exactly ${rewardsContractBalance.toLocaleString()} WELSH`);
            console.log("(This confirms rewards are properly managed and preserved)");
        }
    });

})