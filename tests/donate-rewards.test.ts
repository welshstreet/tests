import { describe, it } from "vitest";
import { disp, DONATE_STREET, DONATE_WELSH, PRECISION } from "./vitestconfig";
import { setupInitialLiquidity } from "./functions/setup-helper-functions";
import { getRewardPoolInfo, donateRewards } from "./functions/rewards-helper-functions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;

describe("=== CLAIM REWARDS TESTS ===", () => {
    it("=== CLAIM REWARDS PASS ===", () => {
        // STEP 1: Setup exchange with initial liquidity state (multi-user)
        const setup = setupInitialLiquidity(disp);

        getRewardPoolInfo(
            0,
            0,
            0,
            0,
            deployer,
            disp
        )

        // STEP 2: Deployer donates rewards to rewards contract
        donateRewards(DONATE_WELSH, DONATE_STREET, deployer, disp)

        // Calculate expected global indexes after donation
        const totalLpSupply = setup.mintedLpExpected;
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
