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
        console.log("Rewards setup completed:", setup);

        // STEP 2: Verify initial balances in rewards contract
        getBalance(setup.feeAExpected, 'welshcorgicoin', {address: deployer, contractName: 'rewards' }, deployer, disp);
        getBalance(setup.feeBExpected, 'street', {address: deployer, contractName: 'rewards' }, deployer, disp);

        // STEP 3: wallet1 claims rewards
        claimRewards(
            setup.userRewardInfo.balanceLp,
            setup.userRewardInfo.blockLp,
            setup.userRewardInfo.earnedA,
            setup.userRewardInfo.earnedB,
            setup.userRewardInfo.earnedA,
            setup.userRewardInfo.earnedB,
            setup.rewardPoolInfo.globalIndexA,
            setup.rewardPoolInfo.globalIndexB,
            setup.userRewardInfo.indexA,
            setup.userRewardInfo.indexB,
            wallet1,
            disp
        )

        // STEP 4: Verify final balances in rewards contract after claim
        getBalance(setup.feeAExpected - setup.userRewardInfo.earnedA, 'welshcorgicoin', {address: deployer, contractName: 'rewards' }, deployer, disp);
        getBalance(setup.feeBExpected - setup.userRewardInfo.earnedB, 'street', {address: deployer, contractName: 'rewards' }, deployer, disp);

        // STEP 5: call getRewardPoolInfo to verify reward pool state after claiming rewards
        getRewardPoolInfo(
            setup.rewardPoolInfo.globalIndexA,
            setup.rewardPoolInfo.globalIndexB,
            setup.feeAExpected - setup.userRewardInfo.earnedA,
            setup.feeBExpected - setup.userRewardInfo.earnedB,
            deployer,
            disp
        )

        // STEP 6: call getRewardUserInfo for wallet1 to verify user reward state after claiming rewards
        getRewardUserInfo(
            wallet1,
            setup.userRewardInfo.balanceLp,
            setup.userRewardInfo.blockLp,
            setup.userRewardInfo.earnedA,
            setup.userRewardInfo.earnedB,
            setup.userRewardInfo.earnedA,
            setup.userRewardInfo.earnedB,
            setup.userRewardInfo.indexA,
            setup.userRewardInfo.indexB,
            0,
            0,
            deployer,
            disp
        )
    });
})