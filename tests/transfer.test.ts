import { describe, it } from "vitest";
import { disp, DONATE_WELSH, DONATE_STREET, PRECISION } from "./vitestconfig";
import { setupRewards } from "./functions/setup-helper-functions";
import { getRewardUserInfo, getRewardPoolInfo, donateRewards, claimRewards } from "./functions/rewards-helper-functions";
import { getBalance } from "./functions/shared-read-only-helper-functions";
import { transferCredit } from "./functions/controller-helper-functions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet1 = accounts.get("wallet_1")!;
const wallet2 = accounts.get("wallet_2")!;
const wallet3 = accounts.get("wallet_3")!;

describe("=== TRANSFER CREDIT TESTS ===", () => {
    it("=== TRANSFER CREDIT PASS - WALLET1 TO WALLET2 ===", () => {
        // TEST SUMMARY
        // STEP 1: Setup rewards environment (deployer + wallet1 + wallet2 all have 10T LP each)
        // STEP 2: Get initial CREDIT balances (wallet1: 10T, wallet2: 10T)
        // STEP 3: Check initial reward user info for wallet1 (333330 unclaimed-b)
        // STEP 4: Check initial reward user info for wallet2 (333330 unclaimed-b)
        // STEP 5: Transfer ALL 10T CREDIT tokens from wallet1 to wallet2
        // STEP 6: Verify CREDIT balances after transfer (wallet1: 0, wallet2: 20T)
        //         Check global indices updated (global-index-a: 333 → 499, global-index-b: 33333 → 49999 from forfeit redistribution)
        // STEP 7: Verify wallet1 reward info after full transfer (all state wiped to 0)
        // STEP 8: Verify wallet2 reward info after receiving transfer (499980 unclaimed-b preserved + redistribution)

        // STEP 1: Setup rewards environment with multi-user liquidity state
        const setup = setupRewards(disp);

        // STEP 2: Get initial CREDIT token balances
        const wallet1InitialBalance = getBalance(
            setup.userRewardInfo.balance, 
            'credit', 
            wallet1, 
            deployer, 
            disp
        );
        const wallet2InitialBalance = getBalance(
            setup.userRewardInfo.balance, // wallet2 has LP tokens from setupRewards
            'credit', 
            wallet2, 
            deployer, 
            disp
        );

        // STEP 3: Check initial reward user info for wallet1
        getRewardUserInfo(
            wallet1,
            setup.userRewardInfo.balance,   // balanceExpected: LP tokens from setup
            setup.userRewardInfo.block,     // blockExpected: Block at which wallet1 last changed LP position
            setup.userRewardInfo.debtA,       // debtAExpected: No debt initially
            setup.userRewardInfo.debtB,       // debtBExpected: No debt initially
            setup.userRewardInfo.indexA,      // indexAExpected: Initial index
            setup.userRewardInfo.indexB,      // indexBExpected: Initial index
            setup.userRewardInfo.unclaimedA,  // unclaimedAExpected: Unclaimed WELSH rewards
            setup.userRewardInfo.unclaimedB,  // unclaimedBExpected: Unclaimed STREET rewards
            deployer,
            disp
        );

        // STEP 4: Check initial reward user info for wallet2 (has LP tokens from setupRewards)
        getRewardUserInfo(
            wallet2,
            setup.userRewardInfo.balance,   // balanceExpected: LP tokens from liquidity provision
            setup.userRewardInfo.block + 1, // blockExpected: Updated from liquidity provision
            setup.userRewardInfo.debtA,       // debtAExpected: From setup
            setup.userRewardInfo.debtB,       // debtBExpected: From setup
            setup.userRewardInfo.indexA,      // indexAExpected: From setup
            setup.userRewardInfo.indexB,      // indexBExpected: From setup
            setup.userRewardInfo.unclaimedA,  // unclaimedAExpected: Unclaimed WELSH rewards
            setup.userRewardInfo.unclaimedB,  // unclaimedBExpected: Unclaimed STREET rewards
            deployer,
            disp
        );

        // STEP 5: Transfer ALL CREDIT tokens from wallet1 to wallet2 using controller
        const transferAmount = wallet1InitialBalance
        transferCredit(
            transferAmount,
            wallet1,
            wallet2,
            wallet1, // wallet1 calls the transfer            undefined, // no memo            disp
        );
        
        // STEP 6: Verify CREDIT token balances after transfer
        getBalance(
            0, // wallet1 should have 0 CREDIT tokens after transfer
            'credit', 
            wallet1, 
            deployer, 
            disp
        );
        getBalance(
            transferAmount + wallet2InitialBalance, // wallet2 should have all transferred tokens plus their initial balance
            'credit', 
            wallet2, 
            deployer, 
            disp
        );

        // End of STEP 6 - Calculate expected global indices after transfer
        // When wallet1 transfers all tokens, it forfeits unclaimed rewards: 3330 WELSH, 333330 STREET
        // These get redistributed across OTHER LP holders (20T: deployer 10T + wallet2 10T, excluding wallet1)
        const forfeitedRewardsA = setup.userRewardInfo.unclaimedA; // 3330 from wallet1
        const forfeitedRewardsB = setup.userRewardInfo.unclaimedB; // 333330 from wallet1
        const totalLpSupply = 30000000000000; // deployer 10T + wallet1 10T + wallet2 10T = 30T
        const wallet1Balance = 10000000000000; // wallet1's original LP balance
        const otherLpSupply = totalLpSupply - wallet1Balance; // 20T (remaining LP holders, excluding sender)
        
        // Calculate expected global index increases from forfeit redistribution
        // Contract uses other-lp (remaining LP holders) as denominator, NOT total LP supply
        const globalIndexIncreaseA = Math.floor((forfeitedRewardsA * PRECISION) / otherLpSupply);
        const globalIndexIncreaseB = Math.floor((forfeitedRewardsB * PRECISION) / otherLpSupply);
        
        const expectedGlobalIndexA = setup.rewardPoolInfo.globalIndexA + globalIndexIncreaseA;
        const expectedGlobalIndexB = setup.rewardPoolInfo.globalIndexB + globalIndexIncreaseB;
        
        if (disp) {
            console.log(`\n=== FORFEIT REDISTRIBUTION CALCULATION ===`);
            console.log(`Forfeited Rewards A: ${forfeitedRewardsA}`);
            console.log(`Forfeited Rewards B: ${forfeitedRewardsB}`);
            console.log(`Total LP Supply: ${totalLpSupply}`);
            console.log(`Other LP Supply (excludes sender): ${otherLpSupply}`);
            console.log(`Global Index Increase A: ${globalIndexIncreaseA}`);
            console.log(`Global Index Increase B: ${globalIndexIncreaseB}`);
            console.log(`Expected Global Index A: ${setup.rewardPoolInfo.globalIndexA} + ${globalIndexIncreaseA} = ${expectedGlobalIndexA}`);
            console.log(`Expected Global Index B: ${setup.rewardPoolInfo.globalIndexB} + ${globalIndexIncreaseB} = ${expectedGlobalIndexB}`);
            console.log(`\n✅ BUG FIXED: Contract uses other-lp (20T) as denominator, not total-lp (30T)`);
        }
        
        getRewardPoolInfo(
            expectedGlobalIndexA, // Should be 333 + 166 = 499
            expectedGlobalIndexB, // Should be 33333 + 16666 = 49999
            setup.rewardPoolInfo.rewardsA, // Current rewardsA (10000)
            setup.rewardPoolInfo.rewardsB, // Current rewardsB (1000000)
            deployer,
            disp
        );

        // STEP 7: Get actual wallet1 reward info after full transfer using helper function
        if (disp) {
            console.log("\n=== WALLET1 AFTER TRANSFER - GETTING ACTUAL VALUES ===");
        }
        const wallet1ActualData = getRewardUserInfo(
            wallet1,
            0, // balanceExpected: Balance is 0 after full transfer
            0, // blockExpected: block reset to 0 (state wiped after full transfer like burn)
            0, // debtAExpected: Should be 0 after transfer (rewards preserved differently)
            0, // debtBExpected: Should be 0 after transfer (rewards preserved differently)
            0, // indexAExpected: Reset to 0 after full transfer  
            0, // indexBExpected: Reset to 0 after full transfer
            0, // unclaimedAExpected: Unclaimed rewards after transfer
            0, // unclaimedBExpected: Unclaimed rewards after transfer
            deployer,
            disp
        );

        // STEP 8: Get actual wallet2 reward info after receiving full transfer using helper function
        if (disp) {
            console.log("\n=== WALLET2 AFTER TRANSFER - GETTING ACTUAL VALUES ===");
        }
        // Calculate expected values for wallet2 after receiving transfer
        const wallet2FinalBalance = transferAmount + wallet2InitialBalance; // 20T total
        
        // Calculate the current global indices after forfeit redistribution
        // The global indices are updated from the forfeit redistribution in update-transfer-sender
        const currentGlobalIndexA = expectedGlobalIndexA;
        const currentGlobalIndexB = expectedGlobalIndexB;
        
        // The transfer credit logic involves two key steps in the rewards contract:
        // 1. update-transfer-sender: Handles forfeit redistribution when sender transfers tokens
        // 2. update-transfer-recipient: Handles preservation logic when recipient receives tokens
        
        // Calculate theoretical values based on contract logic for update-transfer-recipient
        // Wallet2 state before transfer: balance=10T, index-a=0, index-b=0, debt-a=0, debt-b=0
        // Global indices after forfeit: current-global-a=49, current-global-b=4999
        
        const wallet2OldBalance = wallet2InitialBalance; // 10T (before transfer)
        const wallet2NewBalance = wallet2InitialBalance + transferAmount; // 20T (after transfer)
        const wallet2InitialIndexA = setup.userRewardInfo.indexA; // 0
        const wallet2InitialIndexB = setup.userRewardInfo.indexB; // 0
        const wallet2InitialDebtA = setup.userRewardInfo.debtA; // 0
        const wallet2InitialDebtB = setup.userRewardInfo.debtB; // 0
        
        // Calculate earned rewards from global index changes (including forfeit redistribution)
        const earnedA = Math.floor((wallet2OldBalance * (currentGlobalIndexA - wallet2InitialIndexA)) / PRECISION);
        const earnedB = Math.floor((wallet2OldBalance * (currentGlobalIndexB - wallet2InitialIndexB)) / PRECISION);
        
        // Calculate unclaimed rewards (earned - debt, minimum 0)
        const unclaimedA = Math.max(earnedA - wallet2InitialDebtA, 0);
        const unclaimedB = Math.max(earnedB - wallet2InitialDebtB, 0);
        
        // Calculate preserve indices to maintain unclaimed rewards after balance increase
        const actualPreserveIndexA = unclaimedA > 0 
            ? currentGlobalIndexA - Math.floor((unclaimedA * PRECISION) / wallet2NewBalance)
            : currentGlobalIndexA;
        const actualPreserveIndexB = unclaimedB > 0 
            ? currentGlobalIndexB - Math.floor((unclaimedB * PRECISION) / wallet2NewBalance)
            : currentGlobalIndexB;
        
        // Calculate final unclaimed rewards after preserve index adjustment
        const actualUnclaimedA = Math.floor((wallet2NewBalance * (currentGlobalIndexA - actualPreserveIndexA)) / PRECISION);
        const actualUnclaimedB = Math.floor((wallet2NewBalance * (currentGlobalIndexB - actualPreserveIndexB)) / PRECISION);
        
        if (disp) {
            console.log(`\n=== THEORETICAL CALCULATION VERIFICATION ===`);
            console.log(`Wallet2 Old Balance: ${wallet2OldBalance}, New Balance: ${wallet2NewBalance}`);
            console.log(`Earned A: ${earnedA}, Earned B: ${earnedB}`);
            console.log(`Unclaimed A: ${unclaimedA}, Unclaimed B: ${unclaimedB}`);
            console.log(`Preserve Index A: ${actualPreserveIndexA}, B: ${actualPreserveIndexB}`);
            console.log(`Final Unclaimed A: ${actualUnclaimedA}, B: ${actualUnclaimedB}`);
            console.log(`\n✅ All values calculated theoretically from contract logic!`);
        }
        
        const wallet2ActualData = getRewardUserInfo(
            wallet2,
            wallet2FinalBalance, // balanceExpected: 20000000000000 total balance
            13, // blockExpected: Updated to current block (transfer happened at block 13 with simplified setup)
            0, // debtAExpected: No debt
            0, // debtBExpected: No debt
            actualPreserveIndexA, // indexAExpected: Contract-calculated preserve index A
            actualPreserveIndexB, // indexBExpected: Contract-calculated preserve index B
            actualUnclaimedA, // unclaimedAExpected: Contract-calculated unclaimed rewards A
            actualUnclaimedB, // unclaimedBExpected: Contract-calculated unclaimed rewards B
            deployer,
            disp
        );

        if (disp) {
            console.log("✅ TRANSFER CREDIT test completed successfully!");
            console.log(`   - Transferred ${transferAmount} CREDIT tokens from wallet1 to wallet2`);
            console.log(`   - wallet2 final balance: ${transferAmount + wallet2InitialBalance} CREDIT tokens`);
            console.log(`   - Reward accounting properly maintained for both users`);
            console.log(`   - LP token balances correctly updated`);
        }
    });
    it("=== TRANSFER CREDIT PASS - WALLET1 TO WALLET3 ===", () => {
        // TEST SUMMARY
        // STEP 1: Setup rewards environment (deployer + wallet1 + wallet2 all have 10T LP each)
        // STEP 2: Get initial CREDIT balances (wallet1: 10T, wallet3: 0)
        // STEP 3: Check initial reward user info for wallet1 (330k unclaimed-b)
        // STEP 4: Check initial reward user info for wallet3 (clean wallet, all zeros)
        // STEP 5: Transfer ALL 10T CREDIT tokens from wallet1 to wallet3 (new recipient)
        // STEP 6: Verify CREDIT balances after transfer (wallet1: 0, wallet3: 10T)
        // STEP 7: Check global indices updated (global-index-a: 333 → 499, global-index-b: 33333 → 49999 from forfeit redistribution)
        // STEP 8: Verify wallet1 reward info after full transfer (all state wiped to 0)
        // STEP 9: Verify wallet3 reward info after receiving transfer (clean start at global index 49, no retroactive rewards)

        // STEP 1: Setup rewards environment with multi-user liquidity state
        const setup = setupRewards(disp);
        if (disp) {
            console.log("Rewards setup completed:", setup);
        }

        // STEP 2: Get initial CREDIT token balances
        const wallet1InitialBalance = getBalance(
            setup.userRewardInfo.balance, 
            'credit', 
            wallet1, 
            deployer, 
            disp
        );
        const wallet3InitialBalance = getBalance(
            0, // wallet3 has no tokens from setupRewards
            'credit', 
            wallet3, 
            deployer, 
            disp
        );

        // STEP 3: Check initial reward user info for wallet1
        getRewardUserInfo(
            wallet1,
            setup.userRewardInfo.balance,   // balanceExpected: LP tokens from setup
            setup.userRewardInfo.block,     // blockExpected: Block at which wallet1 last changed LP position
            setup.userRewardInfo.debtA,       // debtAExpected: No debt initially
            setup.userRewardInfo.debtB,       // debtBExpected: No debt initially
            setup.userRewardInfo.indexA,      // indexAExpected: Initial index
            setup.userRewardInfo.indexB,      // indexBExpected: Initial index
            setup.userRewardInfo.unclaimedA,  // unclaimedAExpected: Unclaimed WELSH rewards
            setup.userRewardInfo.unclaimedB,  // unclaimedBExpected: Unclaimed STREET rewards
            deployer,
            disp
        );

        // STEP 4: Check initial reward user info for wallet3 (clean wallet - no LP tokens or rewards)
        getRewardUserInfo(
            wallet3,
            0, // balanceExpected: No LP tokens
            0, // blockExpected: No LP activity
            0, // debtAExpected: No debt
            0, // debtBExpected: No debt
            0, // indexAExpected: Default index
            0, // indexBExpected: Default index
            0, // unclaimedAExpected: No claimable rewards
            0, // unclaimedBExpected: No claimable rewards
            deployer,
            disp
        );

        // STEP 5: Transfer ALL CREDIT tokens from wallet1 to wallet3 using controller
        const transferAmount = wallet1InitialBalance;
        transferCredit(
            transferAmount,
            wallet1,
            wallet3,
            wallet1, // wallet1 calls the transfer            undefined, // no memo            disp
        );
        
        // STEP 6: Verify CREDIT token balances after transfer
        getBalance(
            0, // wallet1 should have 0 CREDIT tokens after transfer
            'credit', 
            wallet1, 
            deployer, 
            disp
        );
        getBalance(
            transferAmount, // wallet3 should have all transferred tokens
            'credit', 
            wallet3, 
            deployer, 
            disp
        );

        // STEP 7: Calculate expected global indices after forfeit redistribution
        const forfeitedRewardsA = setup.userRewardInfo.unclaimedA; // 3330 from wallet1
        const forfeitedRewardsB = setup.userRewardInfo.unclaimedB; // 333330 from wallet1
        const totalLpSupply = 30000000000000; // Total LP tokens in system
        const wallet1OriginalBalance = 10000000000000; // wallet1's original LP balance
        const otherLpSupply = totalLpSupply - wallet1OriginalBalance; // 20T (other LP holders, excluding sender)
        
        // Contract uses other-lp as denominator for redistribution
        const globalIndexIncreaseA = Math.floor((forfeitedRewardsA * PRECISION) / otherLpSupply);
        const globalIndexIncreaseB = Math.floor((forfeitedRewardsB * PRECISION) / otherLpSupply);
        
        const expectedGlobalIndexA = setup.rewardPoolInfo.globalIndexA + globalIndexIncreaseA;
        const expectedGlobalIndexB = setup.rewardPoolInfo.globalIndexB + globalIndexIncreaseB;
        
        getRewardPoolInfo(
            expectedGlobalIndexA, // 333 + 166 = 499
            expectedGlobalIndexB, // 33333 + 16666 = 49999
            setup.rewardPoolInfo.rewardsA, // Current rewardsA (10000)
            setup.rewardPoolInfo.rewardsB, // Current rewardsB (1000000)
            deployer,
            disp
        );

        // STEP 8: Get actual wallet1 reward info after full transfer using helper function
        if (disp) {
            console.log("\n=== WALLET1 AFTER TRANSFER - GETTING ACTUAL VALUES ===");
        }
        const wallet1ActualData = getRewardUserInfo(
            wallet1,
            0, // balanceExpected: Balance is 0 after full transfer
            0, // blockExpected: block reset to 0 (state wiped after full transfer)
            0, // debtAExpected: Debt reset to 0
            0, // debtBExpected: Debt reset to 0
            0, // indexAExpected: Reset to 0 after full transfer
            0, // indexBExpected: Reset to 0 after full transfer
            0, // unclaimedAExpected: No unclaimed rewards
            0, // unclaimedBExpected: No unclaimed rewards
            deployer,
            disp
        );

        // STEP 9: Get actual wallet3 reward info after receiving transfer using helper function
        if (disp) {
            console.log("\n=== WALLET3 AFTER TRANSFER - GETTING ACTUAL VALUES ===");
        }
        const wallet3ActualData = getRewardUserInfo(
            wallet3,
            transferAmount, // balanceExpected: wallet3 now has all the LP tokens
            13, // blockExpected: Set to current block (transfer at block 14)
            0, // debtAExpected: Clean recipient, no initial debt
            0, // debtBExpected: Clean recipient, no initial debt
            expectedGlobalIndexA, // indexAExpected: Should match global index after forfeit
            expectedGlobalIndexB, // indexBExpected: Should match global index after forfeit
            0, // unclaimedAExpected: Clean recipient gets fresh start
            0, // unclaimedBExpected: Clean recipient gets fresh start (no retroactive rewards)
            deployer,
            disp
        );

        if (disp) {
            console.log("✅ TRANSFER CREDIT to clean wallet test completed successfully!");
            console.log(`   - Transferred ${transferAmount} CREDIT tokens from wallet1 to wallet3`);
            console.log(`   - wallet3 (clean wallet) final balance: ${transferAmount} CREDIT tokens`);
        }
    });
});