import { describe, it } from "vitest";
import { disp, DONATE_STREET, DONATE_WELSH, PRECISION } from "./vitestconfig";
import { setupExchangeLiquidity } from "./functions/setup-helper-functions";
import { getRewardPoolInfo, cleanupRewards } from "./functions/rewards-helper-functions";
import { transfer } from "./functions/transfer-helper-function";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;

describe("=== CLEANUP REWARDS TESTS ===", () => {
    it("=== CLEANUP REWARDS PASS ===", () => {
        // STEP 1: Setup exchange with initial liquidity state (multi-user)
        const setup = setupExchangeLiquidity(disp);

        // getRewardPoolInfo()

        // STEP 2: Deployer transfer rewards instead of donates rewards to rewards contract
        transfer(DONATE_WELSH, 'welshcorgicoin', deployer, {address: deployer, contractName: 'rewards' }, disp);
        transfer(DONATE_STREET, 'street', deployer, {address: deployer, contractName: 'rewards' }, disp);

        cleanupRewards(DONATE_WELSH, DONATE_STREET, deployer, disp)

        // Calculate expected global indexes after cleanup
        const totalLpSupply = setup.totalLpSupply;
        const expectedGlobalIndexA = Math.floor((DONATE_WELSH * PRECISION) / totalLpSupply);
        const expectedGlobalIndexB = Math.floor((DONATE_STREET * PRECISION) / totalLpSupply);

        getRewardPoolInfo(
            expectedGlobalIndexA,
            expectedGlobalIndexB,
            DONATE_WELSH,
            DONATE_STREET,
            deployer,
            disp
        )
    })
});
