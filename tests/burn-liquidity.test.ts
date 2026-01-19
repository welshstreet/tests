import { describe, it } from "vitest";
import { setupInitialLiquidity, setupExchangeLiquidity } from "./functions/setup-helper-functions";
import { disp, MINT_AMOUNT, TOTAL_SUPPLY_WELSH, DONATE_WELSH, DONATE_STREET, PRECISION } from "./vitestconfig"
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
        const wallet1UnclaimedA = DONATE_WELSH / 2; // 50% of donation since only wallet1 and wallet2 remain
        const wallet1UnclaimedB = DONATE_STREET / 2; // 50% of STREET donation
        const wallet1RewardsBefore = getRewardUserInfo(
            wallet1,                    // user: wallet1 principal
            wallet1LpBalance,           // balanceExpected: wallet1's LP balance
            10,                         // blockExpected: when wallet1 provided liquidity
            0,                          // debtAExpected: should be 0 initially
            0,                          // debtBExpected: should be 0 initially
            0,                          // indexAExpected: global index after donation (starts at 0)
            0,                          // indexBExpected: global index after donation (starts at 0)
            wallet1UnclaimedA,          // unclaimedAExpected: net claimable WELSH amount
            wallet1UnclaimedB,          // unclaimedBExpected: net claimable STREET amount
            wallet1,                    // sender: transaction sender
            disp                        // disp: display flag
        );

        // STEP 5: Check wallet2's unclaimed reward balance AFTER donation (should match wallet1)
        if (disp) {
            console.log("\n=== WALLET2 REWARDS AFTER DONATION ===");
        }
        
        const wallet2LpBalance = setup.totalLpSupply / 3; // Each participant has 1/3 of total LP
        const wallet2UnclaimedA = DONATE_WELSH / 2; // 50% of donation since only wallet1 and wallet2 remain
        const wallet2UnclaimedB = DONATE_STREET / 2; // 50% of STREET donation
        const wallet2RewardsAfterDonation = getRewardUserInfo(
            accounts.get("wallet_2")!,   // user: wallet2 principal
            wallet2LpBalance,             // balanceExpected: wallet2's LP balance
            11,                           // blockExpected: when wallet2 provided liquidity
            0,                            // debtAExpected: should be 0 initially
            0,                            // debtBExpected: should be 0 initially
            0,                            // indexAExpected: global index after donation
            0,                            // indexBExpected: global index after donation
            wallet2UnclaimedA,            // unclaimedAExpected: net claimable WELSH amount
            wallet2UnclaimedB,            // unclaimedBExpected: net claimable STREET amount
            accounts.get("wallet_2")!,    // sender: transaction sender
            disp                          // disp: display flag
        );

        // STEP 6: wallet1 burns 50% of their liquidity
        const wallet1BurnAmount = wallet1LpBalance / 2; // 50%
        burnLiquidity(wallet1BurnAmount, wallet1BurnAmount, wallet1, disp);

        // STEP 7: Check wallet1's unclaimed reward balance AFTER their own burn
        if (disp) {
            console.log("\n=== WALLET1 REWARDS AFTER OWN BURN ===");
        }
        
        // After 50% burn, wallet1 should keep 50% of their unclaimed rewards
        // The other 50% should be redistributed to wallet2
        const wallet1KeptUnclaimedA = wallet1UnclaimedA / 2; // Keep 50% of original unclaimed
        const wallet1KeptUnclaimedB = wallet1UnclaimedB / 2; // Keep 50% of original unclaimed B
        
        // Calculate expected global indices after donation (before burn)
        const remainingLpAfterDeployerExit = setup.totalLpSupply * 2 / 3; // wallet1 + wallet2 LP (20T)
        const initialGlobalIndexA = Math.floor((DONATE_WELSH * PRECISION) / remainingLpAfterDeployerExit); // 5000000
        const initialGlobalIndexB = Math.floor((DONATE_STREET * PRECISION) / remainingLpAfterDeployerExit); // 500000000
        
        // After wallet1 burns 50% of their LP, the contract will:
        // 1. Calculate forfeit rewards (50% of wallet1's unclaimed)
        // 2. Redistribute to remaining LP holders (update global indices)
        // 3. Set wallet1's user indices to preserve their remaining rewards
        
        // Contract forfeit calculation:
        // forfeit-a = (unclaimed-a * burn-amount) / balance = (50000000000 * 5T) / 10T = 25000000000
        // forfeit-b = (unclaimed-b * burn-amount) / balance = (5000000000000 * 5T) / 10T = 2500000000000
        const forfeitA = Math.floor((wallet1UnclaimedA * (wallet1LpBalance / 2)) / wallet1LpBalance); // 25000000000
        const forfeitB = Math.floor((wallet1UnclaimedB * (wallet1LpBalance / 2)) / wallet1LpBalance); // 2500000000000
        
        // Redistribution to other LP holders (wallet2 has 10T LP):
        // redistributed-a = (forfeit-a * PRECISION) / other-lp = (25000000000 * 1000000000) / 10T = 2500000
        // redistributed-b = (forfeit-b * PRECISION) / other-lp = (2500000000000 * 1000000000) / 10T = 250000000
        const otherLp = wallet1LpBalance; // Only wallet2 remains with 10T LP
        const redistributedA = Math.floor((forfeitA * PRECISION) / otherLp); // 2500000
        const redistributedB = Math.floor((forfeitB * PRECISION) / otherLp); // 250000000
        
        // New global indices after redistribution:
        const newGlobalA = initialGlobalIndexA + redistributedA; // 5000000 + 2500000 = 7500000
        const newGlobalB = initialGlobalIndexB + redistributedB; // 500000000 + 250000000 = 750000000
        
        // Preserve index calculation for wallet1's remaining rewards:
        // preserve-a = unclaimed-a - forfeit-a = 50000000000 - 25000000000 = 25000000000
        // preserve-b = unclaimed-b - forfeit-b = 5000000000000 - 2500000000000 = 2500000000000
        const preserveA = wallet1UnclaimedA - forfeitA; // 25000000000
        const preserveB = wallet1UnclaimedB - forfeitB; // 2500000000000
        
        // preserve-idx-a = new-global-a - (preserve-a * PRECISION) / remaining-lp
        // preserve-idx-b = new-global-b - (preserve-b * PRECISION) / remaining-lp
        const remainingLp = wallet1LpBalance / 2; // 5T after burning 50%
        const wallet1ExpectedIndexA = newGlobalA - Math.floor((preserveA * PRECISION) / remainingLp); // 7500000 - 5000000 = 2500000
        const wallet1ExpectedIndexB = newGlobalB - Math.floor((preserveB * PRECISION) / remainingLp); // 750000000 - 500000000 = 250000000
        
        if (disp) {
            console.log("\n=== CALCULATED INDICES DEBUG ===");
            console.log(`Initial global index A: ${initialGlobalIndexA}`);
            console.log(`Initial global index B: ${initialGlobalIndexB}`);
            console.log(`Forfeit A: ${forfeitA}, Forfeit B: ${forfeitB}`);
            console.log(`Redistributed A: ${redistributedA}, Redistributed B: ${redistributedB}`);
            console.log(`New global A: ${newGlobalA}, New global B: ${newGlobalB}`);
            console.log(`Preserve A: ${preserveA}, Preserve B: ${preserveB}`);
            console.log(`wallet1 calculated index A: ${wallet1ExpectedIndexA}`);
            console.log(`wallet1 calculated index B: ${wallet1ExpectedIndexB}`);
        }
        
        const wallet1RewardsAfterOwnBurn = getRewardUserInfo(
            wallet1,                      // user: wallet1 principal
            wallet1LpBalance / 2,         // balanceExpected: half of original (50% burned)
            14,                           // blockExpected: when wallet1 burned their LP
            0,                            // debtAExpected: reset after burn
            0,                            // debtBExpected: reset after burn
            wallet1ExpectedIndexA,        // indexAExpected: calculated preserve index (2500000)
            wallet1ExpectedIndexB,        // indexBExpected: calculated preserve index (250000000)
            preserveA,                    // unclaimedAExpected: calculated preserved rewards (25000000000)
            preserveB,                    // unclaimedBExpected: calculated preserved rewards (2500000000000)
            wallet1,                      // sender: transaction sender
            disp                          // disp: display flag
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
        const wallet2FinalUnclaimedA = wallet2UnclaimedA + wallet1KeptUnclaimedA; // Original + redistributed
        const wallet2FinalUnclaimedB = wallet2UnclaimedB + wallet1KeptUnclaimedB; // Original + redistributed B
        const wallet2RewardsAfterBurns = getRewardUserInfo(
            accounts.get("wallet_2")!,   // user: wallet2 principal
            wallet2LpBalance,             // balanceExpected: wallet2's unchanged LP balance
            11,                           // blockExpected: when wallet2 provided liquidity (unchanged)
            0,                            // debtAExpected: unchanged
            0,                            // debtBExpected: unchanged
            0,                            // indexAExpected: still at 0
            0,                            // indexBExpected: still at 0
            wallet2FinalUnclaimedA,       // unclaimedAExpected: original + redistributed WELSH
            wallet2FinalUnclaimedB,       // unclaimedBExpected: original + redistributed STREET
            accounts.get("wallet_2")!,    // sender: transaction sender
            disp                          // disp: display flag
        );

        // STEP 10: Calculate TOTAL unclaimed rewards vs contract balance (CLEANER ANALYSIS)
        if (disp) {
            console.log("\n=== COMPLETE BUG DETECTION ANALYSIS (NO DEPLOYER INTERFERENCE) ===");
            console.log("=== CLEANER REWARD ANALYSIS (DEPLOYER ELIMINATED) ===");
            console.log(`Wallet1's unclaimed WELSH: ${wallet1KeptUnclaimedA}`);
            console.log(`Wallet2's unclaimed WELSH: ${wallet2FinalUnclaimedA}`);
            console.log(`TOTAL unclaimed WELSH: ${wallet1KeptUnclaimedA + wallet2FinalUnclaimedA}`);
            console.log(`Rewards contract WELSH balance: ${DONATE_WELSH}`);
            console.log(`Original donation was: ${DONATE_WELSH}`);
            console.log("Expected: Only wallet1 and wallet2 should have participated in rewards");
            
            console.log("\n=== DOUBLE-COUNTING BUG CHECK ===");
            const totalUnclaimed = wallet1KeptUnclaimedA + wallet2FinalUnclaimedA; // wallet1 + wallet2
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