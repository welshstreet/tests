import { describe, it } from "vitest";
import { disp } from "./vitestconfig";
import { setupRewards } from "./functions/setup-helper-functions";
import { getRewardPoolInfo, getRewardUserInfo, claimRewards } from "./functions/rewards-helper-functions";
import { getBalance } from "./functions/shared-read-only-helper-functions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet1 = accounts.get("wallet_1")!;

describe("=== CLAIM REWARDS TESTS ===", () => {
    it("=== CLAIM REWARDS PASS ===", () => {
        // STEP 1: Setup exchange with initial liquidity state (multi-user)
        const setup = setupRewards(disp);
        // STEP 2: Verify initial balances in rewards contract
        getBalance(setup.rewardPoolInfo.rewardsA, 'welshcorgicoin', {address: deployer, contractName: 'rewards' }, deployer, disp);
        getBalance(setup.rewardPoolInfo.rewardsB, 'street', {address: deployer, contractName: 'rewards' }, deployer, disp);

        // STEP 3: wallet1 claims rewards
        claimRewards(
            setup.userRewardInfo.unclaimedA,  // amountA from donation (33333330000)
            setup.userRewardInfo.unclaimedB,  // amountB from donation (3333333330000)
            wallet1,
            disp
        )

        // STEP 4: Verify final balances in rewards contract after claim
        getBalance(setup.rewardPoolInfo.rewardsA - setup.userRewardInfo.unclaimedA, 'welshcorgicoin', {address: deployer, contractName: 'rewards' }, deployer, disp);
        getBalance(setup.rewardPoolInfo.rewardsB - setup.userRewardInfo.unclaimedB, 'street', {address: deployer, contractName: 'rewards' }, deployer, disp);

        // STEP 5: call getRewardPoolInfo to verify reward pool state after claiming rewards
        getRewardPoolInfo(
            setup.rewardPoolInfo.globalIndexA,
            setup.rewardPoolInfo.globalIndexB,
            setup.rewardPoolInfo.rewardsA - setup.userRewardInfo.unclaimedA,
            setup.rewardPoolInfo.rewardsB - setup.userRewardInfo.unclaimedB,
            deployer,
            disp
        )

        // STEP 6: call getRewardUserInfo for wallet1 to verify user reward state after claiming rewards
        getRewardUserInfo(
            wallet1,
            setup.userRewardInfo.balance,   // balanceExpected: LP tokens unchanged
            setup.userRewardInfo.block,     // blockExpected: Block at which wallet1 last changed LP position
            setup.userRewardInfo.debtA + setup.userRewardInfo.unclaimedA,        // debtAExpected: Previous debt + claimed amount
            setup.userRewardInfo.debtB + setup.userRewardInfo.unclaimedB,        // debtBExpected: Previous debt + claimed amount
            setup.userRewardInfo.indexA,      // indexAExpected: User index A unchanged
            setup.userRewardInfo.indexB,      // indexBExpected: User index B unchanged
            0,                                 // unclaimedAExpected: Should be 0 after claiming
            0,                                 // unclaimedBExpected: Should be 0 after claiming
            deployer,
            disp
        )
    });
})