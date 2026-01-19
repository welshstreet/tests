import { describe, it } from "vitest";
import { disp, DONATE_STREET, DONATE_WELSH, PRECISION } from "./vitestconfig";
import { setupInitialLiquidity } from "./functions/setup-helper-functions";
import { getRewardPoolInfo, donateRewards, getRewardUserInfo, claimRewards } from "./functions/rewards-helper-functions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;

describe("=== DONATE REWARDS TESTS ===", () => {
    it("=== DONATE REWARDS BUG TEST ===", () => {
        // STEP 1: Setup exchange with ONLY deployer as LP provider (single-user scenario)
        const setup = setupInitialLiquidity(disp);

        // STEP 2: Check initial reward pool state (should be empty)
        getRewardPoolInfo(
            0,  // global-index-a
            0,  // global-index-b  
            0,  // rewards-a balance
            0,  // rewards-b balance
            deployer,
            disp
        )

        // STEP 3: Check deployer's initial user reward info (after providing LP)
        // Deployer should have user record with index-a=0, index-b=0 from LP provision
        getRewardUserInfo(
            deployer,
            setup.mintedLpExpected,  // balanceExpected: LP balance (10T tokens)
            5,  // blockExpected: block at which deployer provided liquidity
            0,  // debtAExpected: should be 0 initially
            0,  // debtBExpected: should be 0 initially
            0,  // indexAExpected: should be 0 from initial LP
            0,  // indexBExpected: should be 0 from initial LP
            0,  // unclaimedAExpected: should be 0 initially
            0,  // unclaimedBExpected: should be 0 initially
            deployer,
            disp
        );

        // STEP 4: Deployer donates rewards to rewards contract
        donateRewards(DONATE_WELSH, DONATE_STREET, deployer, disp)

        // STEP 5: Calculate expected values after donation
        const totalLpSupply = setup.mintedLpExpected;
        const expectedGlobalIndexA = Math.floor((DONATE_WELSH * PRECISION) / totalLpSupply);
        const expectedGlobalIndexB = Math.floor((DONATE_STREET * PRECISION) / totalLpSupply);

        // STEP 6: Verify global indexes updated correctly
        getRewardPoolInfo(
            expectedGlobalIndexA,
            expectedGlobalIndexB,
            DONATE_WELSH,
            DONATE_STREET,
            deployer,
            disp
        )

        // STEP 7: Check deployer's unclaimed rewards after donation  
        // CRITICAL TEST: Deployer should be able to claim the donated rewards
        const expectedUnclaimedA = DONATE_WELSH;  // Should exactly equal the donation
        const expectedUnclaimedB = DONATE_STREET; // Should exactly equal the donation
        
        if (disp) {
            console.log(`🧮 Expected unclaimed A: ${expectedUnclaimedA} (should equal donated ${DONATE_WELSH})`);
            console.log(`🧮 Expected unclaimed B: ${expectedUnclaimedB} (should equal donated ${DONATE_STREET})`);
        }

        getRewardUserInfo(
            deployer,
            setup.mintedLpExpected,  // balanceExpected: LP balance unchanged
            5,  // blockExpected: unchanged since no LP operations after donation
            0,  // debtAExpected: should still be 0
            0,  // debtBExpected: should still be 0  
            0,  // indexAExpected: should still be 0 from initial LP - NOT updated by donation
            0,  // indexBExpected: should still be 0 from initial LP - NOT updated by donation
            expectedUnclaimedA,  // unclaimedAExpected: should equal DONATE_WELSH
            expectedUnclaimedB,  // unclaimedBExpected: should equal DONATE_STREET
            deployer,
            disp
        );

        // STEP 8: THE CRITICAL TEST - Can deployer actually claim the donated rewards?
        if (disp) {
            console.log(`🔥 CRITICAL TEST: Attempting to claim donated rewards...`);
        }
        
        claimRewards(
            expectedUnclaimedA,  // Should be able to claim donated WELSH
            expectedUnclaimedB,  // Should be able to claim donated STREET
            deployer,
            disp
        );

        if (disp) {
            console.log(`✅ SUCCESS: Deployer can claim their own donated rewards!`);
        }
    })
});
