import { disp, FEE_BASIS, INITIAL_WELSH, INITIAL_STREET, MINT_AMOUNT, PRECISION, TRANSFER_WELSH, TRANSFER_STREET, SWAP_WELSH, SWAP_STREET } from "../vitestconfig";
import { streetMint } from "./street-helper-functions";
import { provideInitialLiquidity, provideLiquidity, swapAB, swapBA } from "./exchange-helper-functions";
import { getRewardPoolInfo, getRewardUserInfo } from "./rewards-helper-functions";
import { getBalance } from "./shared-read-only-helper-functions";
import { transfer } from "./transfer-helper-function";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet1 = accounts.get("wallet_1")!;
const wallet2 = accounts.get("wallet_2")!

export function setupInitialLiquidity(disp: boolean = false) {
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
    const actualMintedLp = provideInitialLiquidity(
        amountA,
        amountB,
        addedAExpected,
        addedBExpected,
        mintedLpExpected,
        deployer,
        disp
    );

    return {
        streetMinted: MINT_AMOUNT,
        amountA,
        amountB,
        addedAExpected,
        addedBExpected,
        mintedLpExpected: actualMintedLp,
        availAExpected: amountA,
        availBExpected: amountB,
        feeExpected: 100,
        lockedAExpected: 0,
        lockedBExpected: 0,
        reserveAExpected: amountA,
        reserveBExpected: amountB,
        revenueExpected: 100,
        taxExpected: 100,
    };
}

export function setupMintStreet(disp: boolean = false) {
    const amountExpected = MINT_AMOUNT;
    const blockExpected = 3;
    const epochExpected = 0;
    const streetMintExpected = MINT_AMOUNT;
    
    streetMint(amountExpected, blockExpected, epochExpected, streetMintExpected, deployer, disp);
    
    return {
        streetMintExpected
    }
}

export function setupExchangeLiquidity(disp: boolean = false) {
    // STEP 1: Setup initial liquidity (deployer provides initial liquidity)
    const initialSetup = setupInitialLiquidity(disp);
    
    // STEP 2: Transfer tokens to wallet1 and wallet2 so they can participate
    // Transfer WELSH tokens (welshcorgicoin)
    transfer(TRANSFER_WELSH, 'welshcorgicoin', deployer, wallet1, disp);
    transfer(TRANSFER_WELSH, 'welshcorgicoin', deployer, wallet2, disp);
    
    // Transfer STREET tokens
    transfer(TRANSFER_STREET, 'street', deployer, wallet1, disp);
    transfer(TRANSFER_STREET, 'street', deployer, wallet2, disp);
    
    // STEP 3: Calculate exact values for wallet1 liquidity provision
    const amountA = INITIAL_WELSH;
    const currentReserveA = initialSetup.reserveAExpected;
    const currentReserveB = initialSetup.reserveBExpected;
    const currentLpSupply = initialSetup.mintedLpExpected;
    
    // Calculate exact amount B needed: amountB = (amountA * reserveB) / reserveA
    const amountB = Math.floor((amountA * currentReserveB) / currentReserveA);
    
    // Calculate exact LP tokens: mintedLp = (amountA * totalSupply) / reserveA
    const mintedLpWallet = Math.floor((amountA * currentLpSupply) / currentReserveA);
    
    // STEP 4: Wallet1 provides liquidity (exact values)
    provideLiquidity(amountA, amountA, amountB, mintedLpWallet, wallet1, disp);
    
    // STEP 5: Update state after wallet1's liquidity provision
    const reserveAAfterWallet1 = currentReserveA + amountA;
    const reserveBAfterWallet1 = currentReserveB + amountB;
    const lpSupplyAfterWallet1 = currentLpSupply + mintedLpWallet;
    
    // STEP 6: Calculate exact values for wallet2 liquidity provision (same amount as wallet1)
    const amountB2 = Math.floor((amountA * reserveBAfterWallet1) / reserveAAfterWallet1);
    const mintedLpWallet2 = Math.floor((amountA * lpSupplyAfterWallet1) / reserveAAfterWallet1);
    
    // STEP 7: Wallet2 provides liquidity (same amount as wallet1)
    provideLiquidity(amountA, amountA, amountB2, mintedLpWallet2, wallet2, disp);
    
    // STEP 8: Final state after both wallets add liquidity
    const reserveAAfterWallet2 = reserveAAfterWallet1 + amountA;
    const reserveBAfterWallet2 = reserveBAfterWallet1 + amountB2;
    const lpSupplyAfterWallet2 = lpSupplyAfterWallet1 + mintedLpWallet2;
    
    // Return state information (both wallet1 and wallet2 have provided liquidity)
    return {
        availAExpected: reserveAAfterWallet2,     // available = reserves (no locked liquidity yet)
        availBExpected: reserveBAfterWallet2,     // available = reserves (no locked liquidity yet)
        feeExpected: initialSetup.feeExpected,                         // default fee unchanged
        lockedAExpected: initialSetup.lockedAExpected,                       // no locked liquidity yet
        lockedBExpected: initialSetup.lockedBExpected,                       // no locked liquidity yet
        reserveAExpected: reserveAAfterWallet2,   // final reserves after both wallets liquidity
        reserveBExpected: reserveBAfterWallet2,   // final reserves after both wallets liquidity
        revenueExpected: initialSetup.revenueExpected,                     // default revenue unchanged
        taxExpected: initialSetup.taxExpected,                          // default tax unchanged
        totalLpSupply: lpSupplyAfterWallet2
    };
}

export function setupGenesis(disp: boolean = false) {
    // STEP 1: Mint Street
    const setup = setupMintStreet(disp);

    // STEP 2: deployer transfer WELSH to wallet1 and wallet2
    transfer(TRANSFER_WELSH, 'welshcorgicoin', deployer, wallet1, disp);
    transfer(TRANSFER_WELSH, 'welshcorgicoin', deployer, wallet2, disp);

    // STEP 3: transfer STREET tokens to the genesis contract
    transfer(setup.streetMintExpected, 'street', deployer, {address: deployer, contractName: 'genesis' }, disp);

    return { ...setup }
}

export function setupRewards(disp: boolean = false) {
    // STEP 1: Setup exchange with initial liquidity state (multi-user)
    const setup = setupExchangeLiquidity(disp);

    // STEP 2: Call getRewardPoolInfo() and getRewardUserInfo(wallet1) to verify initial rewards state
    // Initially: no rewards distributed, so all values should be 0
    const initialGlobalIndexA = 0;
    const initialGlobalIndexB = 0;
    const initialRewardsA = 0;
    const initialRewardsB = 0;

    getRewardPoolInfo(
        initialGlobalIndexA,
        initialGlobalIndexB,
        initialRewardsA,
        initialRewardsB,
        deployer,
        disp
    );

    // Check wallet1's initial reward info
    const initialBalanceLp = getBalance(setup.totalLpSupply /3, 'credit', wallet1, deployer, disp)
    const initialBlockLp = 10; // Block at which wallet1 last changed their LP position (corrected from blockchain state)
    const initialDebtA = 0;
    const initialDebtB = 0;
    const initialEarnedA = 0;
    const initialEarnedB = 0;
    const initialIndexA = 0;
    const initialIndexB = 0;
    const initialUnclaimedA = 0;
    const initialUnclaimedB = 0;

    getRewardUserInfo(
        wallet1,
        initialBalanceLp,
        initialBlockLp,
        initialDebtA,
        initialDebtB,
        initialEarnedA,
        initialEarnedB,
        initialIndexA,
        initialIndexB,
        initialUnclaimedA,
        initialUnclaimedB,
        deployer,
        disp
    );

    // STEP 3: wallet1 performs WELSH to STREET swap to generate fees/revenue
    const feeAExpected = Math.floor((SWAP_WELSH * setup.feeExpected) / FEE_BASIS); // FEE_BASIS = FEE_BASIS
    const revAExpected = Math.floor((SWAP_WELSH * setup.revenueExpected) / FEE_BASIS);
    const amountANet = SWAP_WELSH - feeAExpected - revAExpected;

    // AMM calculation for amount out
    const amountOutB = Math.floor((amountANet * setup.reserveBExpected) / (setup.reserveAExpected + amountANet));
    
    // New reserve values after swap
    const resANew = setup.reserveAExpected + amountANet;
    const resBNew = setup.reserveBExpected - amountOutB;

    swapAB(
        SWAP_WELSH,
        SWAP_WELSH,
        amountOutB,
        feeAExpected,
        setup.reserveAExpected,
        resANew,
        setup.reserveBExpected,
        resBNew,
        revAExpected,
        wallet1,
        disp
    );

    // STEP 4: Call getRewardPoolInfo() and getRewardUserInfo(wallet1) to verify rewards state after Welsh swap
    // After swap: fees should be distributed to rewards contract, and global index should be updated

    let globalIndexA = Math.floor((feeAExpected * PRECISION) / setup.totalLpSupply);

    getRewardPoolInfo(
        globalIndexA, // Should be updated based on fee distribution
        initialGlobalIndexB,        // Should remain 0 (no STREET fees yet)
        feeAExpected,
        0,
        deployer,
        disp
    );

    // Check wallet1's reward info after first swap
    const wallet1EarnedA = Math.floor((initialBalanceLp * (globalIndexA - initialIndexA)) / PRECISION);

    getRewardUserInfo(
        wallet1,
        initialBalanceLp,
        initialBlockLp,
        initialDebtA,
        initialDebtB,
        wallet1EarnedA,
        initialEarnedB,
        initialIndexA,
        initialIndexB,
        wallet1EarnedA,
        initialUnclaimedB,
        deployer,
        disp
    );

    // STEP 5: wallet1 performs STREET to WELSH swap to generate more fees/revenue
    const feeBExpected = Math.floor((SWAP_STREET * setup.feeExpected) / FEE_BASIS);
    const revBExpected = Math.floor((SWAP_STREET * setup.revenueExpected) / FEE_BASIS);
    const amountBNet = SWAP_STREET - feeBExpected - revBExpected;

    // AMM calculation using updated reserves from first swap
    const amountOutA = Math.floor((amountBNet * resANew) / (resBNew + amountBNet));

    const resA = resANew - amountOutA;
    const resB = resBNew + amountBNet;

    swapBA(
        SWAP_STREET,
        SWAP_STREET,
        amountOutA,
        feeBExpected,
        resANew,
        resA,
        resBNew,
        resB,
        revBExpected,
        wallet1,
        disp
    );

    let globalIndexB = Math.floor((feeBExpected * PRECISION) / setup.totalLpSupply);


    // STEP 6: Call getRewardPoolInfo() and getRewardUserInfo(wallet1) to verify final rewards state
    // After both swaps: both WELSH and STREET fees should be in rewards

    const rewardPoolInfo = getRewardPoolInfo(
        globalIndexA,
        globalIndexB,
        feeAExpected,
        feeBExpected,
        deployer,
        disp
    );

    // Check wallet1's final reward info
    const wallet1EarnedB = Math.floor((initialBalanceLp * (globalIndexB - initialIndexB)) / PRECISION);

    const userRewardInfo = getRewardUserInfo(
        wallet1,
        initialBalanceLp,
        initialBlockLp,
        initialDebtA,
        initialDebtB,
        wallet1EarnedA,
        wallet1EarnedB,
        initialIndexA,
        initialIndexB,
        wallet1EarnedA,
        wallet1EarnedB,
        deployer,
        disp
    );

    return {
        ...setup,
        feeAExpected,
        feeBExpected,
        resA,
        resB,
        rewardPoolInfo,
        userRewardInfo
    };
}