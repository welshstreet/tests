import { describe, it } from "vitest";
import { disp, EMISSION_AMOUNT, PRECISION } from "./vitestconfig";
import { setupInitialLiquidity } from "./functions/setup-helper-functions";
import { updateEmissionRewards } from "./functions/rewards-helper-functions";
import { emissionMint, mineBurnBlock } from "./functions/street-helper-functions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet1 = accounts.get("wallet_1")!;

describe("=== UPDATE EMISSION REWARDS TESTS ===", () => {
    it("=== UPDATE EMISSION REWARDS PASS ===", () => {
        // STEP 1: Setup initial liquidity to create LP tokens
        const setup = setupInitialLiquidity(disp);
        
        // STEP 2: Call emission-mint to create current epoch
        const amountExpected = EMISSION_AMOUNT;
        const blockExpected = 3;
        const epochExpected = 1;
        const totalSupplyLpExpected = setup.mintedLpExpected;
        
        emissionMint(
            amountExpected,
            blockExpected,
            epochExpected,
            totalSupplyLpExpected,
            deployer,
            disp
        );
        
        // STEP 3: Mine burn block to advance to next epoch
        mineBurnBlock(4, disp);
        
        // STEP 4: Calculate expected global index B after emission update
        const totalLpSupply = setup.mintedLpExpected;
        const expectedGlobalIndexB = Math.floor((EMISSION_AMOUNT * PRECISION) / totalLpSupply);
        
        // STEP 5: Call update-emission-rewards
        updateEmissionRewards(
            EMISSION_AMOUNT,
            expectedGlobalIndexB,
            deployer,
            disp
        );
    });

    it("=== ERR_NOT_CONTRACT_OWNER ===", () => {
        // STEP 1: Setup initial liquidity to create LP tokens
        const setup = setupInitialLiquidity(disp);
        
        // STEP 2: Call emission-mint to create current epoch
        const amountExpected = EMISSION_AMOUNT;
        const blockExpected = 3;
        const epochExpected = 1;
        const totalSupplyLpExpected = setup.mintedLpExpected;
        
        emissionMint(
            amountExpected,
            blockExpected,
            epochExpected,
            totalSupplyLpExpected,
            deployer,
            disp
        );
        
        // STEP 3: Mine burn block to advance to next epoch
        mineBurnBlock(4, disp);
        
        // STEP 4: Try to call update-emission-rewards with unauthorized sender (wallet1)
        updateEmissionRewards(
            0, // Should fail before calculating
            0, // Should fail before calculating
            wallet1,
            disp
        );
    });

    it("=== ERR_EMISSION_INTERVAL ===", () => {
        // STEP 1: Setup initial liquidity to create LP tokens
        const setup = setupInitialLiquidity(disp);
        
        // STEP 2: Call emission-mint to create current epoch
        const amountExpected = EMISSION_AMOUNT;
        const blockExpected = 3;
        const epochExpected = 1;
        const totalSupplyLpExpected = setup.mintedLpExpected;
        
        emissionMint(
            amountExpected,
            blockExpected,
            epochExpected,
            totalSupplyLpExpected,
            deployer,
            disp
        );
        
        // STEP 3: Mine burn block to advance to next epoch
        mineBurnBlock(4, disp);
        
        // STEP 4: Call update-emission-rewards once (success)
        const expectedGlobalIndexB = Math.floor((EMISSION_AMOUNT * PRECISION) / totalSupplyLpExpected);
        updateEmissionRewards(
            EMISSION_AMOUNT,
            expectedGlobalIndexB,
            deployer,
            disp
        );
        
        // STEP 5: Try to call update-emission-rewards again without new emission-mint (should fail)
        updateEmissionRewards(
            0, // Should fail before calculating
            0, // Should fail before calculating
            deployer,
            disp
        );
    });
});
