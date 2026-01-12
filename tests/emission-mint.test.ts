import { describe, it } from "vitest";
import { disp, EMISSION_AMOUNT, EMISSION_AMOUNT_KILL_SWITCH_TEST, TOTAL_SUPPLY_STREET } from "./vitestconfig";
import { emissionMint, getKillSwitch, mineBurnBlock, setKillSwitch } from "./functions/street-helper-functions";
import { setupInitialLiquidity } from "./functions/setup-helper-functions";
import { getBalance } from "./functions/shared-read-only-helper-functions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet1 = accounts.get("wallet_1")!;

describe("=== EMISSION MINT TESTS ===", () => {
    it("=== MINE BURN BLOCK PASS ===", () => {
        const blockExpected = 4;
        mineBurnBlock(blockExpected, disp);
    });

    it("=== MINE BURN BLOCK FAIL ===", () => {
        const blockExpected = 3;
        mineBurnBlock(blockExpected, disp);
    });

    it("=== EMISSION MINT ONCE PASS ===", () => {
        // STEP 1: Setup initial liquidity
        const setup = setupInitialLiquidity(disp);

        // STEP 2: Call Emission Mint Once
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

        // STEP 3: Validate rewards contract received the emitted tokens
        const rewardsBalanceExpected = amountExpected; // Tokens minted to rewards contract
        getBalance(rewardsBalanceExpected, 'street', { address: deployer, contractName: "rewards" }, deployer, disp);
    });

    it("=== EMISSION MINT TWICE PASS ===", () => {
    // STEP 1: Setup initial liquidity
    const setup = setupInitialLiquidity(disp);

    // STEP 2: Call Emission Mint Once
    let amountExpected = EMISSION_AMOUNT;
    let blockExpected = 3;
    let epochExpected = 1;
    let totalSupplyLpExpected = setup.mintedLpExpected;

    emissionMint(
        amountExpected,
        blockExpected,
        epochExpected,
        totalSupplyLpExpected,
        deployer,
        disp
    );

    // STEP 3: Validate rewards contract received the emitted tokens
    let rewardsBalanceExpected = amountExpected; // Tokens minted to rewards contract
    getBalance(rewardsBalanceExpected, 'street', { address: deployer, contractName: "rewards" }, deployer, disp);

    // STEP 4: Mine Burn Blocks to reach next emission interval
    blockExpected = 4;
    mineBurnBlock(blockExpected, disp);

    // STEP 5: Call Emission Mint Second Time
    amountExpected = EMISSION_AMOUNT;
    epochExpected = 2;
    totalSupplyLpExpected = setup.mintedLpExpected;

    emissionMint(
        amountExpected,
        blockExpected,
        epochExpected,
        totalSupplyLpExpected,
        deployer,
        disp
    );

    // STEP 6: Validate rewards contract received the emitted tokens
    rewardsBalanceExpected = amountExpected * epochExpected; // Tokens minted to rewards contract
    getBalance(rewardsBalanceExpected, 'street', { address: deployer, contractName: "rewards" }, deployer, disp);
    });

    it("=== ERR_NOT_CONTRACT_OWNER ===", () => {
    // STEP 1: Setup initial liquidity
        const setup = setupInitialLiquidity(disp);

        // STEP 2: Call Emission Mint Once
        const amountExpected = 0;
        const blockExpected = 3;
        const epochExpected = 1;
        const totalSupplyLpExpected = setup.mintedLpExpected;

        emissionMint(
            amountExpected,
            blockExpected,
            epochExpected,
            totalSupplyLpExpected,
            wallet1,
            disp
        );

        // STEP 3: Validate rewards contract received the emitted tokens
        const rewardsBalanceExpected = amountExpected; // Tokens minted to rewards contract
        getBalance(rewardsBalanceExpected, 'street', { address: deployer, contractName: "rewards" }, deployer, disp);
    })

    it("=== ERR_EMISSION_INTERVAL ===", () => {
        // STEP 1: Setup initial liquidity
        const setup = setupInitialLiquidity(disp);

        // STEP 2: Call Emission Mint Once
        let amountExpected = EMISSION_AMOUNT;
        let blockExpected = 3;
        let epochExpected = 1; // First emission mint increments to epoch 1
        let totalSupplyLpExpected = setup.mintedLpExpected;

        let results = emissionMint(
            amountExpected,
            blockExpected,
            epochExpected,
            totalSupplyLpExpected,
            deployer,
            disp
        );

        // STEP 3: Call Emission Mint Again
        amountExpected = EMISSION_AMOUNT;
        blockExpected = 4;
        epochExpected = 1; // First emission mint increments to epoch 1
        totalSupplyLpExpected = setup.mintedLpExpected; // Use actual LP supply from setup

        results = emissionMint(
            amountExpected,
            blockExpected,
            epochExpected,
            totalSupplyLpExpected,
            deployer,
            disp
        );

        // STEP 4: Validate rewards contract received the emitted tokens
        const rewardsBalanceExpected = amountExpected; // Tokens minted to rewards contract
        getBalance(rewardsBalanceExpected, 'street', { address: deployer, contractName: "rewards" }, deployer, disp);
    });

    it("=== ERR_NO_LIQUIDITY ===", () => {
        // STEP 1: Call Emission Mint Once
        const amountExpected = 0;
        const blockExpected = 3;
        const epochExpected = 1;
        const totalSupplyLpExpected = 0

        emissionMint(
            amountExpected,
            blockExpected,
            epochExpected,
            totalSupplyLpExpected,
            deployer,
            disp
        );

        // STEP 2: Validate rewards contract received the emitted tokens
        const rewardsBalanceExpected = amountExpected; // Tokens minted to rewards contract
        getBalance(rewardsBalanceExpected, 'street', { address: deployer, contractName: "rewards" }, deployer, disp);
    })

return;
// AI This return statement is too ignore the tests below as they will not pass without changing the contract constant
//- --- AI IGNORE ---
// ;;(define-constant EMISSION_AMOUNT u1000000000000000)
    it("=== EMISSION EXCEEDS SUPPLY LIMIT - KILL SWITCH NOT FLIPPED ===", () => {
        // MUST CHANGE THE LINE (define-constant EMISSION_AMOUNT u1000000000000000) IN THE CONTRACT FOR TESTING
        // STEP 1: Setup initial liquidity
        const setup = setupInitialLiquidity(disp);

        // STEP 2: Perform 9 successful emissions (90% of supply)
        let totalEmitted = 0;
        for (let i = 1; i <= 9; i++) {
            const amountExpected = EMISSION_AMOUNT_KILL_SWITCH_TEST;
            const blockExpected = 2 + i; // Block advances with each emission
            const epochExpected = i;
            const totalSupplyLpExpected = setup.mintedLpExpected;

            if (i > 1) {
                mineBurnBlock(blockExpected, disp); // Mine to next block
            }

            emissionMint(
                amountExpected,
                blockExpected,
                epochExpected,
                totalSupplyLpExpected,
                deployer,
                disp
            );

            totalEmitted += EMISSION_AMOUNT_KILL_SWITCH_TEST;
        }

        // STEP 3: Validate 90% of supply has been emitted
        const rewardsBalanceExpected = totalEmitted;
        getBalance(rewardsBalanceExpected, 'street', { address: deployer, contractName: "rewards" }, deployer, disp);

        // STEP 4: Mine to next block for final emission attempt
        mineBurnBlock(12);

        // STEP 5: 10th emission should succeed (exactly at limit)
        emissionMint(
            EMISSION_AMOUNT_KILL_SWITCH_TEST,
            12,
            10,
            setup.mintedLpExpected,
            deployer,
            disp
        );

        // STEP 6: Validate 100% of supply has been emitted
        getBalance(TOTAL_SUPPLY_STREET, 'street', { address: deployer, contractName: "rewards" }, deployer, disp);

        // STEP 7: Mine to next block and try 11th emission
        mineBurnBlock(13);

        // STEP 8: 11th emission should pass
        emissionMint(
            EMISSION_AMOUNT_KILL_SWITCH_TEST,
            13,
            11, // Epoch doesn't increment on failure
            setup.mintedLpExpected,
            deployer,
            disp
        );

        // STEP 9: Validate over 100% of supply has been emitted
        getBalance(TOTAL_SUPPLY_STREET + EMISSION_AMOUNT_KILL_SWITCH_TEST, 'street', { address: deployer, contractName: "rewards" }, deployer, true);
    });

    it("=== EMISSION EXCEEDS SUPPLY LIMIT - KILL SWITCH FLIPPED ===", () => {
        // MUST CHANGE THE LINE (define-constant EMISSION_AMOUNT u1000000000000000) IN THE CONTRACT FOR TESTING
        // STEP 1: Setup initial liquidity
        const setup = setupInitialLiquidity(disp);

        // STEP 2: Perform 9 successful emissions (90% of supply)
        let totalEmitted = 0;
        for (let i = 1; i <= 9; i++) {
            const amountExpected = EMISSION_AMOUNT_KILL_SWITCH_TEST;
            const blockExpected = 2 + i; // Block advances with each emission
            const epochExpected = i;
            const totalSupplyLpExpected = setup.mintedLpExpected;

            if (i > 1) {
                mineBurnBlock(blockExpected, disp); // Mine to next block
            }

            emissionMint(
                amountExpected,
                blockExpected,
                epochExpected,
                totalSupplyLpExpected,
                deployer,
                disp
            );

            totalEmitted += EMISSION_AMOUNT_KILL_SWITCH_TEST;
        }

        // STEP 3: Validate 90% of supply has been emitted
        const rewardsBalanceExpected = totalEmitted;
        getBalance(rewardsBalanceExpected, 'street', { address: deployer, contractName: "rewards" }, deployer, disp);

        // STEP 4: Mine to next block for final emission attempt
        mineBurnBlock(12);

        // STEP 5: 10th emission should succeed (exactly at limit)
        emissionMint(
            EMISSION_AMOUNT_KILL_SWITCH_TEST,
            12,
            10,
            setup.mintedLpExpected,
            deployer,
            disp
        );

        // STEP 6: Validate 100% of supply has been emitted
        getBalance(TOTAL_SUPPLY_STREET, 'street', { address: deployer, contractName: "rewards" }, deployer, disp);

        // STEP 7: Mine to next block and try 11th emission
        mineBurnBlock(13);

        // STEP 8: Flip the kill switch
        setKillSwitch(deployer, true);
        getKillSwitch(true, deployer, true);

        // STEP 9: 11th emission should fail due to kill switch
        emissionMint(
            0,
            13,
            10, // Epoch doesn't increment on failure
            setup.mintedLpExpected,
            deployer,
            disp
        );

        // STEP 10: Validate over 100% of supply has been emitted
        getBalance(TOTAL_SUPPLY_STREET, 'street', { address: deployer, contractName: "rewards" }, deployer, disp);
    });
});