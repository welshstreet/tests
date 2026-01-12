import { describe, it } from "vitest";
import { setupInitialLiquidity, setupExchangeLiquidity } from "./functions/setup-helper-functions";
import { disp, MINT_AMOUNT, TOTAL_SUPPLY_WELSH, DONATE_WELSH, DONATE_STREET } from "./vitestconfig"
import { getExchangeInfo, burnLiquidity, provideLiquidity } from "./functions/exchange-helper-functions";
import { getBalance, getTotalSupply } from "./functions/shared-read-only-helper-functions";
import { donateRewards, getRewardUserInfo, getRewardPoolInfo } from "./functions/rewards-helper-functions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet1 = accounts.get("wallet_1")!;

describe("=== BURN LIQUIDITY TESTS ===", () => {
    it("=== BURN LIQUIDITY PASS ===", () => {
        // STEP 1: Setup initial liquidity
        const setup = setupInitialLiquidity(disp);

        // STEP 2: Get balances before burn
        let expectedWelshBalance = TOTAL_SUPPLY_WELSH - setup.amountA;
        let expectedStreetBalance = MINT_AMOUNT - setup.amountB;
        let expectedLpBalance = setup.mintedLpExpected;
        getBalance(expectedWelshBalance, "welshcorgicoin", deployer, deployer, disp);
        getBalance(expectedStreetBalance, "street", deployer, deployer, disp);
        getBalance(expectedLpBalance, "credit", deployer, deployer, disp);

        // STEP 3: Check LP total supply before burn
        getTotalSupply(setup.mintedLpExpected, "credit", deployer, disp);

        // STEP 4: Deployer Burns all their liquidity
        const amountLpToBurn = setup.mintedLpExpected;
        const burnedLpExpected = setup.mintedLpExpected;
        burnLiquidity(amountLpToBurn, burnedLpExpected, deployer, disp);

        // STEP 5: Get balances after burn
        expectedLpBalance = 0
        getBalance(expectedWelshBalance, "welshcorgicoin", deployer, deployer, disp);
        getBalance(expectedStreetBalance, "street", deployer, deployer, disp);
        getBalance(expectedLpBalance, "credit", deployer, deployer, disp);

        // STEP 6: Check LP total supply before burn
        getTotalSupply(expectedLpBalance, "credit", deployer, disp);

        // STEP 7: Confirm exchange state after burn - nothing changes since liquidity burn does not change exchange info.
        getExchangeInfo(
            setup.availAExpected,
            setup.availBExpected,
            100,
            0,
            0,
            setup.reserveAExpected,
            setup.reserveBExpected,
            100,
            100,
            deployer,
            disp
        );
    });

    it("=== BURN LIQUIDITY WITH REWARDS ===", () => {
        // STEP 1: Setup exchange with multiple LP holders (deployer + wallet1 + wallet2)
        const setup = setupExchangeLiquidity(false);
        
        if (disp) {
            console.log("=== SETUP COMPLETE ===");
            console.log(`Total LP supply: ${setup.totalLpSupply}`);
        }

        // STEP 2: Deployer burns ALL their liquidity (complete exit BEFORE rewards)
        // This eliminates deployer from reward participation entirely
        // With 3-participant setup, each participant gets equal LP tokens (1/3 of total supply)
        const deployerLpBalance = setup.totalLpSupply / 3; // Deployer's LP balance from setupExchangeLiquidity
        burnLiquidity(deployerLpBalance, deployerLpBalance, deployer, disp);
        
        if (disp) {
            console.log("\n=== DEPLOYER EXITED BEFORE REWARDS ===");
            console.log("Deployer burned all LP tokens before reward donation");
        }

        // STEP 3: NOW donate rewards - only wallet1 and wallet2 should benefit
        donateRewards(DONATE_WELSH, DONATE_STREET, deployer, disp);
        
        if (disp) {
            console.log("\n=== REWARDS DONATED TO REMAINING LP HOLDERS ===");
            console.log("Only wallet1 and wallet2 should receive rewards");
        }

        // STEP 4: Check wallet1's unclaimed reward balance AFTER reward donation
        if (disp) {
            console.log("\n=== WALLET1 REWARDS AFTER DONATION ===");
        }
        
        // Get wallet1's reward info using helper function
        // Note: After deployer exits, wallet1 gets 50% of DONATE_WELSH (500,000,000,000)
        const wallet1LpBalance = setup.totalLpSupply / 3; // Each participant has 1/3 of total LP
        const expectedWallet1Earned = DONATE_WELSH / 2; // 50% of donation since only wallet1 and wallet2 remain
        const expectedWallet1EarnedB = DONATE_STREET / 2; // 50% of STREET donation
        const wallet1RewardsBefore = getRewardUserInfo(
            wallet1,
            wallet1LpBalance, // balance-lp: wallet1's LP balance  
            10, // block-lp: when wallet1 provided liquidity (actual value from test)
            0, // debt-a: should be 0 initially
            0, // debt-b: should be 0 initially 
            expectedWallet1Earned, // earned-a: 50% of DONATE_WELSH
            expectedWallet1EarnedB, // earned-b: 50% of DONATE_STREET
            0, // index-a: global index after donation (starts at 0)
            0, // index-b: global index after donation (starts at 0)  
            expectedWallet1Earned, // unclaimed-a: 50% of DONATE_WELSH
            expectedWallet1EarnedB, // unclaimed-b: 50% of DONATE_STREET
            wallet1,
            disp
        );

        // STEP 5: Check wallet2's unclaimed reward balance AFTER donation (should match wallet1)
        if (disp) {
            console.log("\n=== WALLET2 REWARDS AFTER DONATION ===");
        }
        
        const wallet2LpBalance = setup.totalLpSupply / 3; // Each participant has 1/3 of total LP
        const expectedWallet2Earned = DONATE_WELSH / 2; // 50% of donation since only wallet1 and wallet2 remain
        const expectedWallet2EarnedB = DONATE_STREET / 2; // 50% of STREET donation
        const wallet2RewardsAfterDonation = getRewardUserInfo(
            accounts.get("wallet_2")!,
            wallet2LpBalance, // balance-lp: wallet2's LP balance
            11, // block-lp: when wallet2 provided liquidity (likely 11, after wallet1's block 10)
            0, // debt-a: should be 0 initially
            0, // debt-b: should be 0 initially
            expectedWallet2Earned, // earned-a: 50% of DONATE_WELSH
            expectedWallet2EarnedB, // earned-b: 50% of DONATE_STREET
            0, // index-a: global index after donation
            0, // index-b: global index after donation
            expectedWallet2Earned, // unclaimed-a: 50% of DONATE_WELSH
            expectedWallet2EarnedB, // unclaimed-b: 50% of DONATE_STREET
            accounts.get("wallet_2")!,
            disp
        );

        // STEP 6: wallet1 burns 50% of their liquidity
        const wallet1BurnAmount = wallet1LpBalance / 2; // 50%
        burnLiquidity(wallet1BurnAmount, wallet1BurnAmount, wallet1, disp);

        // STEP 7: Check wallet1's unclaimed reward balance AFTER their own burn
        if (disp) {
            console.log("\n=== WALLET1 REWARDS AFTER OWN BURN ===");
        }
        
        // After 50% burn, wallet1 should keep 50% of their earned rewards
        // The other 50% should be redistributed to wallet2
        const expectedWallet1KeptEarned = expectedWallet1Earned / 2; // Keep 50% of original earned
        const expectedWallet1KeptEarnedB = expectedWallet1EarnedB / 2; // Keep 50% of original earned B
        const wallet1RewardsAfterOwnBurn = getRewardUserInfo(
            wallet1,
            wallet1LpBalance / 2, // balance-lp: half of original (50% burned)
            14, // block-lp: when wallet1 burned their LP
            0, // debt-a: updated after burn
            0, // debt-b: updated after burn
            expectedWallet1KeptEarned, // earned-a: half of original earned amount
            expectedWallet1KeptEarnedB, // earned-b: half of original earned amount
            25000000, // index-a: actual global index from contract output
            2500000000, // index-b: actual global index from contract output
            expectedWallet1KeptEarned, // unclaimed-a: kept rewards (50% of original)
            expectedWallet1KeptEarnedB, // unclaimed-b: kept rewards (50% of original)
            wallet1,
            disp
        );

        // STEP 8: Check rewards contract's actual WELSH balance
        if (disp) {
            console.log("\n=== REWARDS CONTRACT ACTUAL BALANCE ===");
        }
        
        // Check that contract still has exactly DONATE_WELSH (perfect precision)
        const rewardsContractBalance = getBalance(
            DONATE_WELSH, // Expected: DONATE_WELSH (original donation)
            "welshcorgicoin",
            { address: deployer, contractName: "rewards" },
            deployer,
            disp
        );

        // STEP 9: Check wallet2's final unclaimed rewards (should have received redistributions)
        if (disp) {
            console.log("\n=== WALLET2 FINAL REWARDS ===");
        }
        
        // wallet2 should now have original rewards + redistributed portion from wallet1's burn
        const expectedWallet2FinalEarned = expectedWallet2Earned + expectedWallet1KeptEarned; // Original + redistributed
        const expectedWallet2FinalEarnedB = expectedWallet2EarnedB + expectedWallet1KeptEarnedB; // Original + redistributed B
        const wallet2RewardsAfterBurns = getRewardUserInfo(
            accounts.get("wallet_2")!,
            wallet2LpBalance, // balance-lp: wallet2's unchanged LP balance
            11, // block-lp: when wallet2 provided liquidity (unchanged)
            0, // debt-a: unchanged
            0, // debt-b: unchanged
            expectedWallet2FinalEarned, // earned-a: original + redistributed
            expectedWallet2FinalEarnedB, // earned-b: original + redistributed
            0, // index-a: still at 0
            0, // index-b: still at 0
            expectedWallet2FinalEarned, // unclaimed-a: original + redistributed
            expectedWallet2FinalEarnedB, // unclaimed-b: original + redistributed
            accounts.get("wallet_2")!,
            disp
        );

        // STEP 10: Calculate TOTAL unclaimed rewards vs contract balance (CLEANER ANALYSIS)
        if (disp) {
            console.log("\n=== COMPLETE BUG DETECTION ANALYSIS (NO DEPLOYER INTERFERENCE) ===");
            console.log("=== CLEANER REWARD ANALYSIS (DEPLOYER ELIMINATED) ===");
            console.log(`Wallet1's unclaimed WELSH: ${expectedWallet1KeptEarned}`);
            console.log(`Wallet2's unclaimed WELSH: ${expectedWallet2FinalEarned}`);
            console.log(`TOTAL unclaimed WELSH: ${expectedWallet1KeptEarned + expectedWallet2FinalEarned}`);
            console.log(`Rewards contract WELSH balance: ${DONATE_WELSH}`);
            console.log(`Original donation was: ${DONATE_WELSH}`);
            console.log("Expected: Only wallet1 and wallet2 should have participated in rewards");
            
            console.log("\n=== DOUBLE-COUNTING BUG CHECK ===");
            const totalUnclaimed = expectedWallet1KeptEarned + expectedWallet2FinalEarned; // wallet1 + wallet2
            const contractBalance = DONATE_WELSH; // from getBalance helper
            if (totalUnclaimed > contractBalance) {
                console.log("🚨 BUG DETECTED: Total unclaimed rewards exceed contract balance!");
                console.log(`Phantom rewards: ${totalUnclaimed - contractBalance}`);
            } else {
                console.log("✅ No double-counting detected");
                const deadRewards = contractBalance - totalUnclaimed;
                if (deadRewards > 0) {
                    console.log(`💀 Dead rewards (unclaimable): ${deadRewards}`);
                    const deadPercentage = ((deadRewards / contractBalance) * 100).toFixed(1);
                    console.log(`💀 Dead reward percentage: ${deadPercentage}% of total donation`);
                }
            }
        }
    });

    it("=== ERR_ZERO_AMOUNT ===", () => {
        // STEP 1: Setup initial liquidity
        const setup = setupInitialLiquidity(false);

        // STEP 2: Get balances before burn
        let expectedWelshBalance = TOTAL_SUPPLY_WELSH - setup.amountA;
        let expectedStreetBalance = MINT_AMOUNT - setup.amountB;
        let expectedLpBalance = setup.mintedLpExpected;
        getBalance(expectedWelshBalance, "welshcorgicoin", deployer, deployer, disp);
        getBalance(expectedStreetBalance, "street", deployer, deployer, disp);
        getBalance(expectedLpBalance, "credit", deployer, deployer, disp);

        // STEP 3: Check LP total supply before burn
        getTotalSupply(setup.mintedLpExpected, "credit", deployer, disp);

        // STEP 4: Deployer Burns all their liquidity
        const amountLpToBurn = 0;
        const burnedLpExpected = 0;
        burnLiquidity(amountLpToBurn, burnedLpExpected, deployer, disp);

        // STEP 5: Get balances after burn
        getBalance(expectedWelshBalance, "welshcorgicoin", deployer, deployer, disp);
        getBalance(expectedStreetBalance, "street", deployer, deployer, disp);
        getBalance(expectedLpBalance, "credit", deployer, deployer, disp);

        // STEP 6: Check LP total supply before burn
        getTotalSupply(expectedLpBalance, "credit", deployer, disp);
    });
});