import { describe, it } from "vitest";
import { setupRewards } from "./functions/setup-helper-functions";
import { disp, DONATE_WELSH, DONATE_STREET, PRECISION, PROVIDE_WELSH } from "./vitestconfig"
import { burnLiquidity, provideLiquidity } from "./functions/exchange-helper-functions";
import { claimRewards, donateRewards, getRewardUserInfo, getRewardPoolInfo } from "./functions/rewards-helper-functions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet1 = accounts.get("wallet_1")!;

describe("=== BURN LIQUIDITY TESTS ===", () => {
    it("=== PHANTOM DEBT BUG FIX VERIFICATION ===", () => {
        // TEST SUMMARY
        // This test verifies the fix for the phantom debt bug in update-provide-rewards
        // where new/returning users were incorrectly initialized with phantom debt
        // 
        // STEP 1: Setup initial liquidity state and reward state with multi-user liquidity
        // STEP 2: wallet1 claims all rewards (debt increases, unclaimed = 0)
        // STEP 3: wallet1 burns ALL liquidity (complete exit, entry deleted)
        // STEP 4: wallet1 provides liquidity again (re-entry as "new" user)
        //         FIXED: Contract now sets debt = 0 (correct behavior)
        // STEP 5: deployer donates MORE rewards to contract
        // STEP 6: wallet1 can now claim rewards
        //         FIXED: unclaimed = earned (no phantom debt blocking claims)
        
        // STEP 1: Setup rewards environment with multi-user liquidity state
        // This creates deployer, wallet1, wallet2 each with 10T LP and donates initial rewards
        const setup = setupRewards(disp);
        
        if (disp) {
            console.log("\n=== STEP 1 COMPLETE: Initial Setup ===");
            console.log(`Total LP supply: ${setup.totalLpSupply}`);
            console.log(`wallet1 LP balance: ${setup.userRewardInfo.balance}`);
            console.log(`wallet1 unclaimed A: ${setup.userRewardInfo.unclaimedA}`);
            console.log(`wallet1 unclaimed B: ${setup.userRewardInfo.unclaimedB}`);
            console.log(`Global index A: ${setup.rewardPoolInfo.globalIndexA}`);
            console.log(`Global index B: ${setup.rewardPoolInfo.globalIndexB}`);
        }

        // STEP 2: wallet1 claims all their rewards
        claimRewards(
            setup.userRewardInfo.unclaimedA,
            setup.userRewardInfo.unclaimedB,
            wallet1,
            disp
        );
        
        // After claiming, verify debt increased and unclaimed = 0
        getRewardUserInfo(
            wallet1,
            setup.userRewardInfo.balance,   // LP balance unchanged
            setup.userRewardInfo.block,     // Block unchanged
            setup.userRewardInfo.unclaimedA,  // Debt = previous claimed amount
            setup.userRewardInfo.unclaimedB,  // Debt = previous claimed amount
            setup.userRewardInfo.indexA,      // Index unchanged (still 0)
            setup.userRewardInfo.indexB,      // Index unchanged (still 0)
            0,                                 // Unclaimed = 0 after claiming
            0,                                 // Unclaimed = 0 after claiming
            deployer,
            disp
        );
        
        if (disp) {
            console.log("\n=== STEP 2 COMPLETE: wallet1 Claimed Rewards ===");
            console.log(`wallet1 debt A: ${setup.userRewardInfo.unclaimedA}`);
            console.log(`wallet1 debt B: ${setup.userRewardInfo.unclaimedB}`);
            console.log(`wallet1 unclaimed: 0`);
        }

        // STEP 3: wallet1 burns ALL liquidity (complete exit)
        const wallet1LpBalance = setup.userRewardInfo.balance;
        burnLiquidity(wallet1LpBalance, wallet1LpBalance, wallet1, disp);
        
        if (disp) {
            console.log("\n=== STEP 3 COMPLETE: wallet1 Burned All LP ===");
            console.log(`Burned: ${wallet1LpBalance}`);
            console.log(`wallet1 entry deleted from user-rewards map`);
        }

        // STEP 4: wallet1 provides liquidity again (re-entry)
        // This triggers the BUG - contract will initialize with phantom debt
        const provideAmount = PROVIDE_WELSH;
        const remainingLpAfterBurn = setup.totalLpSupply - wallet1LpBalance; // 20T (deployer + wallet2)
        const ratio = 100; // 1 WELSH : 100 STREET
        const expectedAmountB = provideAmount * ratio;
        const expectedLpMinted = Math.floor((provideAmount * remainingLpAfterBurn) / setup.availAExpected);
        
        provideLiquidity(
            provideAmount,
            provideAmount,
            expectedAmountB,
            expectedLpMinted,
            wallet1,
            disp
        );
        
        // Current global indices (unchanged from initial donation)
        const currentGlobalIndexA = setup.rewardPoolInfo.globalIndexA;
        const currentGlobalIndexB = setup.rewardPoolInfo.globalIndexB;
        
        // FIXED: Contract now correctly initializes debt to 0
        const correctDebtA = 0;
        const correctDebtB = 0;
        
        // Verify wallet1's state after re-entry (with FIX applied)
        getRewardUserInfo(
            wallet1,
            expectedLpMinted,      // New LP balance
            simnet.blockHeight,    // Current block
            correctDebtA,          // FIXED: Debt = 0 for new users!
            correctDebtB,          // FIXED: Debt = 0 for new users!
            currentGlobalIndexA,   // Index set to current global
            currentGlobalIndexB,   // Index set to current global
            0,                     // No unclaimed because just entered
            0,                     // No unclaimed because just entered
            deployer,
            disp
        );
        
        if (disp) {
            console.log("\n=== STEP 4 COMPLETE: wallet1 Re-entered ===");
            console.log(`wallet1 new LP balance: ${expectedLpMinted}`);
            console.log(`✅ BUG FIXED: Debt correctly initialized to 0!`);
            console.log(`  Debt A: ${correctDebtA} (CORRECT - no phantom debt)`);
            console.log(`  Debt B: ${correctDebtB} (CORRECT - no phantom debt)`);
            console.log(`  Global index A: ${currentGlobalIndexA}`);
            console.log(`  Global index B: ${currentGlobalIndexB}`);
        }

        // STEP 5: Donate MORE rewards
        donateRewards(DONATE_WELSH, DONATE_STREET, deployer, disp);
        
        // Calculate new global indices after second donation
        const currentTotalLp = remainingLpAfterBurn + expectedLpMinted; // 20T + wallet1's new LP
        const indexIncreaseA = Math.floor((DONATE_WELSH * PRECISION) / currentTotalLp);
        const indexIncreaseB = Math.floor((DONATE_STREET * PRECISION) / currentTotalLp);
        const newGlobalIndexA = currentGlobalIndexA + indexIncreaseA;
        const newGlobalIndexB = currentGlobalIndexB + indexIncreaseB;
        
        // Expected rewards in contract = first donation - wallet1's claim + second donation
        const expectedRewardsA = DONATE_WELSH * 2 - setup.userRewardInfo.unclaimedA;
        const expectedRewardsB = DONATE_STREET * 2 - setup.userRewardInfo.unclaimedB;
        
        getRewardPoolInfo(
            newGlobalIndexA,
            newGlobalIndexB,
            expectedRewardsA,  // Account for wallet1's claim in STEP 2
            expectedRewardsB,  // Account for wallet1's claim in STEP 2
            deployer,
            disp
        );
        
        if (disp) {
            console.log("\n=== STEP 5 COMPLETE: Second Donation ===");
            console.log(`Donated: ${DONATE_WELSH} WELSH, ${DONATE_STREET} STREET`);
            console.log(`New global index A: ${newGlobalIndexA}`);
            console.log(`New global index B: ${newGlobalIndexB}`);
        }

        // STEP 6: Check wallet1's rewards - VERIFY THE FIX WORKS
        // Calculate what wallet1 SHOULD have earned from second donation
        const expectedEarnedA = Math.floor((expectedLpMinted * (newGlobalIndexA - currentGlobalIndexA)) / PRECISION);
        const expectedEarnedB = Math.floor((expectedLpMinted * (newGlobalIndexB - currentGlobalIndexB)) / PRECISION);
        
        // FIXED: Contract now calculates earned correctly with debt = 0
        const correctUnclaimedA = expectedEarnedA; // earned - 0 = earned
        const correctUnclaimedB = expectedEarnedB; // earned - 0 = earned
        
        getRewardUserInfo(
            wallet1,
            expectedLpMinted,       // LP balance unchanged
            simnet.blockHeight - 1, // Block from provide-liquidity
            0,                      // FIXED: Debt = 0 for new users
            0,                      // FIXED: Debt = 0 for new users
            currentGlobalIndexA,    // Index unchanged (set at re-entry)
            currentGlobalIndexB,    // Index unchanged (set at re-entry)
            correctUnclaimedA,      // FIXED: Can claim rewards earned after re-entry!
            correctUnclaimedB,      // FIXED: Can claim rewards earned after re-entry!
            deployer,
            disp
        );
        
        if (disp) {
            console.log("\n=== STEP 6 COMPLETE: FIX VERIFIED ===");
            console.log(`\n✅ PHANTOM DEBT BUG FIXED:`);
            console.log(`\n  wallet1 earned from second donation:`);
            console.log(`    Earned A: ${expectedEarnedA}`);
            console.log(`    Earned B: ${expectedEarnedB}`);
            console.log(`\n  wallet1 can now claim (debt = 0):`);
            console.log(`    Unclaimed A: ${correctUnclaimedA} ✅`);
            console.log(`    Unclaimed B: ${correctUnclaimedB} ✅`);
            console.log(`\n  FIX CONFIRMED: update-provide-rewards now initializes`);
            console.log(`    debt = 0 (instead of balance * global-index / PRECISION)`);
            console.log(`    for new users and re-entries after complete burn`);
            console.log(`\n  IMPACT: Users can now claim ${correctUnclaimedA} WELSH and ${correctUnclaimedB} STREET`);
            console.log(`          that they legitimately earned!`);
        }
    })

});