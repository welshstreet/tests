import { describe, it } from "vitest";
import { setupInitialLiquidity } from "./functions/setup-helper-functions";
import { getRewardPoolInfo, getRewardUserInfo } from "./functions/rewards-helper-functions";
import { disp } from "./vitestconfig"

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;

describe("=== REWARDS READ ONLY FUNCTIONS TESTS ===", () => {
    it("=== GET REWARD POOL INFO ===", () => {
        // STEP 1: Setup initial liquidity to establish reward system state
        setupInitialLiquidity(disp);

        // STEP 2: Check initial reward pool info
        // Initially: no rewards distributed, so all values should be 0
        const globalIndexAExpected = 0;  // No rewards distributed yet
        const globalIndexBExpected = 0;  // No rewards distributed yet
        const rewardsAExpected = 0;      // No WELSH tokens in rewards contract yet
        const rewardsBExpected = 0;      // No STREET tokens in rewards contract yet

        getRewardPoolInfo(
            globalIndexAExpected,
            globalIndexBExpected,
            rewardsAExpected,
            rewardsBExpected,
            deployer,
            disp
        );
    });

    it("=== GET REWARD USER INFO ===", () => {
        // STEP 1: Setup initial liquidity to establish user LP position
        const setup = setupInitialLiquidity(disp);

        // STEP 2: Check deployer's reward info
        // After initial liquidity provision, deployer should have LP tokens but no rewards yet
        // IMPORTANT: provide-initial-liquidity NOW calls update-provide-rewards
        // This creates the user-rewards map entry (needed for future burn redistribution)
        const balanceLpExpected = setup.mintedLpExpected;  // LP tokens from setup
        const blockLpExpected = 5;       // Updated by provide-initial-liquidity
        const debtAExpected = 0;         // No debt initially
        const debtBExpected = 0;         // No debt initially
        const earnedAExpected = 0;       // No rewards earned yet
        const earnedBExpected = 0;       // No rewards earned yet
        const indexAExpected = 0;        // Initial index
        const indexBExpected = 0;        // Initial index
        const unclaimedAExpected = 0;    // No unclaimed rewards
        const unclaimedBExpected = 0;    // No unclaimed rewards

        getRewardUserInfo(
            deployer,
            balanceLpExpected,
            blockLpExpected,
            debtAExpected,
            debtBExpected,
            earnedAExpected,
            earnedBExpected,
            indexAExpected,
            indexBExpected,
            unclaimedAExpected,
            unclaimedBExpected,
            deployer,
            disp
        );
    });
});