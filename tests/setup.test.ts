import { describe, it } from "vitest";
import { setupExchangeLiquidity, setupGenesis, setupRewards } from "./functions/setup-helper-functions";
import { getExchangeInfo } from "./functions/exchange-helper-functions";
import { getBalance } from "./functions/shared-read-only-helper-functions";
import { disp, TRANSFER_WELSH } from './vitestconfig';

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet1 = accounts.get("wallet_1")!
const wallet2 = accounts.get("wallet_2")!

describe("=== SETUP TESTS ===", () => {
    it("=== SETUP EXCHANGE LIQUIDITY PASS ===", () => {
        const setup = setupExchangeLiquidity(disp);

        // STEP 2: Verify the setup exchange info by calling getExchangeInfo
        getExchangeInfo(
            setup.availAExpected,
            setup.availBExpected,
            setup.feeExpected,
            setup.lockedAExpected,
            setup.lockedBExpected,
            setup.reserveAExpected,
            setup.reserveBExpected,
            setup.revenueExpected,
            setup.taxExpected,
            deployer,
            disp
        );
    });

    it("=== SETUP GENESIS PASS ===", () => {
        const setup = setupGenesis(disp);
        getBalance(TRANSFER_WELSH, 'welshcorgicoin', wallet1, deployer, disp);
        getBalance(TRANSFER_WELSH, 'welshcorgicoin', wallet2, deployer, disp);
        getBalance(setup.streetMintExpected, 'street', {address: deployer, contractName: 'genesis' }, deployer, disp);
    });

    it("=== SETUP REWARDS PASS ===", () => {
        const setup = setupRewards(disp);
        getBalance(setup.rewardPoolInfo.rewardsA, 'welshcorgicoin', {address: deployer, contractName: 'rewards' }, deployer, disp);
        getBalance(setup.rewardPoolInfo.rewardsB, 'street', {address: deployer, contractName: 'rewards' }, deployer, disp);
    })

});