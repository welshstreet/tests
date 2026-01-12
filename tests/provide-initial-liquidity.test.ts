import { describe, it } from "vitest";
import { disp, INITIAL_WELSH, INITIAL_STREET, MINT_AMOUNT, FEE, REV } from "./vitestconfig"
import { getExchangeInfo, provideInitialLiquidity } from "./functions/exchange-helper-functions";
import { streetMint } from "./functions/street-helper-functions";
import { getBalance } from "./functions/shared-read-only-helper-functions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet1 = accounts.get("wallet_1")!;

describe("=== PROVIDE INITIAL LIQUIDITY TESTS ===", () => {
    it("=== PROVIDE INITIAL LIQUIDITY PASS ===", () => {
        // STEP 1: Mint STREET tokens to deployer (fresh test state)
        const amountExpected = MINT_AMOUNT;
        const blockExpected = 3;
        const epochExpected = 0;
        const streetMintedExpected = MINT_AMOUNT;
        streetMint(amountExpected, blockExpected, epochExpected, streetMintedExpected, deployer, disp);

        // STEP 2: Calculate expected values for initial liquidity
        const amountA = INITIAL_WELSH;
        const amountB = INITIAL_STREET;
        const addedAExpected = amountA;
        const addedBExpected = amountB;
        const mintedLpExpected = Math.floor(Math.sqrt(amountA * amountB));

        // STEP 3: Provide initial liquidity
        provideInitialLiquidity(
            amountA,
            amountB,
            addedAExpected,
            addedBExpected,
            mintedLpExpected,
            deployer,
            disp
        );

        // STEP 4: Validate exchange state after providing liquidity
        const availAExpected = amountA;  // reserve-a - locked-a = INITIAL_WELSH - 0
        const availBExpected = amountB; // reserve-b - locked-b = INITIAL_STREET - 0
        const feeExpected = FEE;               // default fee from vitestconfig
        const lockedAExpected = 0;             // no locked liquidity initially
        const lockedBExpected = 0;             // no locked liquidity initially
        const reserveAExpected = amountA; // reserves now contain the liquidity
        const reserveBExpected = amountB;
        const revenueExpected = REV;           // default revenue from vitestconfig
        const taxExpected = FEE;               // default tax (same as fee) from vitestconfig

        getExchangeInfo(
            availAExpected,
            availBExpected,
            feeExpected,
            lockedAExpected,
            lockedBExpected,
            reserveAExpected,
            reserveBExpected,
            revenueExpected,
            taxExpected,
            deployer,
            disp
        );

        // STEP 5: Validate LP token balance
        getBalance(mintedLpExpected, 'credit', deployer, deployer, disp);
    });

    it("=== ERR_ZERO_AMOUNT - AMOUNT A ===", () => {
        // Fresh test state - mint STREET tokens first
        const amountExpected = MINT_AMOUNT;
        const blockExpected = 3;
        const epochExpected = 0;
        const streetMintedExpected = MINT_AMOUNT;
        streetMint(amountExpected, blockExpected, epochExpected, streetMintedExpected, deployer, disp);

        // Test with zero amount A
        const amountA = 0;  // Zero amount (should trigger ERR_ZERO_AMOUNT)
        const amountB = INITIAL_STREET;
        const addedAExpected = 0;  // Won't be used due to error
        const addedBExpected = 0;  // Won't be used due to error
        const mintedLpExpected = 0; // Won't be used due to error

        provideInitialLiquidity(
            amountA,
            amountB,
            addedAExpected,
            addedBExpected,
            mintedLpExpected,
            deployer,
            disp
        );
    });

    it("=== ERR_ZERO_AMOUNT - AMOUNT B ===", () => {
        // Fresh test state - mint STREET tokens first
        const amountExpected = MINT_AMOUNT;
        const blockExpected = 3;
        const epochExpected = 0;
        const streetMintedExpected = MINT_AMOUNT;
        streetMint(amountExpected, blockExpected, epochExpected, streetMintedExpected, deployer, disp);

        // Test with zero amount B
        const amountA = INITIAL_WELSH;
        const amountB = 0;  // Zero amount (should trigger ERR_ZERO_AMOUNT)
        const addedAExpected = 0;  // Won't be used due to error
        const addedBExpected = 0;  // Won't be used due to error
        const mintedLpExpected = 0; // Won't be used due to error

        provideInitialLiquidity(
            amountA,
            amountB,
            addedAExpected,
            addedBExpected,
            mintedLpExpected,
            deployer,
            disp
        );
    });

    it("=== ERR_NOT_CONTRACT_OWNER ===", () => {
        // Fresh test state - mint STREET tokens first (but to wallet1 for this test)
        const amountExpected = MINT_AMOUNT;
        const blockExpected = 3;
        const epochExpected = 0;
        const streetMintedExpected = MINT_AMOUNT;
        streetMint(amountExpected, blockExpected, epochExpected, streetMintedExpected, deployer, disp);

        // Test with unauthorized sender (wallet1 instead of deployer)
        const amountA = INITIAL_WELSH;
        const amountB = INITIAL_STREET;
        const addedAExpected = 0;  // Won't be used due to error
        const addedBExpected = 0;  // Won't be used due to error
        const mintedLpExpected = 0; // Won't be used due to error

        provideInitialLiquidity(
            amountA,
            amountB,
            addedAExpected,
            addedBExpected,
            mintedLpExpected,
            wallet1,  // Unauthorized sender
            disp
        );
    });
    
    it("=== ERR_ALREADY_INITIALIZED ===", () => {
        // Fresh test state - mint STREET tokens first
        const amountExpected = MINT_AMOUNT;
        const blockExpected = 3;
        const epochExpected = 0;
        const streetMintedExpected = MINT_AMOUNT;
        streetMint(amountExpected, blockExpected, epochExpected, streetMintedExpected, deployer, disp);

        // STEP 1: Provide initial liquidity successfully (first time)
        const amountA = INITIAL_WELSH;
        const amountB = INITIAL_STREET;
        const addedAExpected = amountA;
        const addedBExpected = amountB;
        const mintedLpExpected = Math.floor(Math.sqrt(amountA * amountB));

        provideInitialLiquidity(
            amountA,
            amountB,
            addedAExpected,
            addedBExpected,
            mintedLpExpected,
            deployer,
            disp
        );

        // STEP 2: Try to provide initial liquidity again (should fail with ERR_ALREADY_INITIALIZED)
        const secondAmountA = INITIAL_WELSH;
        const secondAmountB = INITIAL_STREET;
        const secondAddedAExpected = 0;  // Won't be used due to error
        const secondAddedBExpected = 0;  // Won't be used due to error
        const secondMintedLpExpected = 0; // Won't be used due to error

        provideInitialLiquidity(
            secondAmountA,
            secondAmountB,
            secondAddedAExpected,
            secondAddedBExpected,
            secondMintedLpExpected,
            deployer,
            disp
        );
    });
});