import { describe, it } from "vitest";
import { disp, DONATE_WELSH, DONATE_STREET, PRECISION, INITIAL_WELSH, INITIAL_STREET } from "./vitestconfig";
import { setupInitialLiquidity } from "./functions/setup-helper-functions";
import { getRewardUserInfo, getRewardPoolInfo, donateRewards, claimRewards } from "./functions/rewards-helper-functions";
import { getBalance } from "./functions/shared-read-only-helper-functions";
import { transferCredit } from "./functions/comptroller-helper-functions";
import { transfer } from "./functions/transfer-helper-function";
import { provideLiquidity, burnLiquidity } from "./functions/exchange-helper-functions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet1 = accounts.get("wallet_1")!;
const wallet2 = accounts.get("wallet_2")!;

describe("=== CREDIT TRANSFER TESTS ===", () => {
    it("=== CREDIT TRANSFER LOST FOREVER - DEPLOYER AND WALLET1 ===", () => {
        // TEST SUMMARY
        // STEP 1: Setup rewards environment (deployer + wallet1). wallet2 does not provide liquidity
        // STEP 2: Deployer donates rewards (1000T WELSH, 100000T STREET)
        // STEP 3: Deployer burns all liquidity to avoid further reward accumulation. Wallet1 should have 100% claimable rewards now.
        // STEP 4: wallet1 transfers 100% CREDIT to wallet2
        // STEP 5: wallet2 transfers 100% CREDIT back to wallet1
        // STEP 6: check that deployer, wallet1 and wallet2 have 0 unclaimed rewards 

        console.log("\n=== STEP 1: SETUP REWARDS ENVIRONMENT (DEPLOYER + WALLET1 ONLY) ===");
        
        // Setup initial liquidity with deployer
        const initialSetup = setupInitialLiquidity(disp);
        
        // Transfer tokens to wallet1 so they can provide liquidity
        const TRANSFER_WELSH = INITIAL_WELSH * 2;
        const TRANSFER_STREET = INITIAL_STREET * 2;
        transfer(TRANSFER_WELSH, 'welshcorgicoin', deployer, wallet1, disp);
        transfer(TRANSFER_STREET, 'street', deployer, wallet1, disp);
        
        // Calculate exact values for wallet1 liquidity provision
        const amountA = INITIAL_WELSH;
        const currentReserveA = initialSetup.reserveAExpected;
        const currentReserveB = initialSetup.reserveBExpected;
        const currentLpSupply = initialSetup.mintedLpExpected;
        
        const amountB = Math.floor((amountA * currentReserveB) / currentReserveA);
        const mintedLpWallet1 = Math.floor((amountA * currentLpSupply) / currentReserveA);
        
        console.log(`\nWallet1 providing liquidity:`);
        console.log(`  - Amount A: ${amountA}`);
        console.log(`  - Amount B: ${amountB}`);
        console.log(`  - Expected LP: ${mintedLpWallet1}`);
        
        provideLiquidity(amountA, amountA, amountB, mintedLpWallet1, wallet1, disp);
        
        const totalLpSupply = currentLpSupply + mintedLpWallet1;
        const reserveAAfterWallet1 = currentReserveA + amountA;
        const reserveBAfterWallet1 = currentReserveB + amountB;
        
        console.log(`\nTotal LP Supply after wallet1: ${totalLpSupply}`);
        console.log(`Deployer LP: ${currentLpSupply}`);
        console.log(`Wallet1 LP: ${mintedLpWallet1}`);
        console.log(`Reserve A: ${reserveAAfterWallet1}`);
        console.log(`Reserve B: ${reserveBAfterWallet1}`);
        
        // Get initial balances
        const deployerInitialLp = getBalance(currentLpSupply, 'credit', deployer, deployer, disp);
        const wallet1InitialLp = getBalance(mintedLpWallet1, 'credit', wallet1, deployer, disp);
        const wallet2InitialLp = getBalance(0, 'credit', wallet2, deployer, disp);
        
        console.log("\n=== STEP 2: DEPLOYER DONATES REWARDS ===");
        console.log(`Donating: ${DONATE_WELSH} WELSH, ${DONATE_STREET} STREET`);
        
        donateRewards(DONATE_WELSH, DONATE_STREET, deployer, disp);
        
        // Calculate expected global indices after donation
        const donationImpactA = Math.floor((DONATE_WELSH * PRECISION) / totalLpSupply);
        const donationImpactB = Math.floor((DONATE_STREET * PRECISION) / totalLpSupply);
        const globalIndexA = donationImpactA;
        const globalIndexB = donationImpactB;
        
        console.log(`\nGlobal indices after donation:`);
        console.log(`  - Global Index A: ${globalIndexA}`);
        console.log(`  - Global Index B: ${globalIndexB}`);
        console.log(`  - Donation Impact A: ${donationImpactA}`);
        console.log(`  - Donation Impact B: ${donationImpactB}`);
        
        getRewardPoolInfo(
            globalIndexA,
            globalIndexB,
            DONATE_WELSH,
            DONATE_STREET,
            deployer,
            disp
        );
        
        // Check deployer rewards before burn
        const deployerEarnedA = Number((BigInt(deployerInitialLp) * BigInt(globalIndexA)) / BigInt(PRECISION));
        const deployerEarnedB = Number((BigInt(deployerInitialLp) * BigInt(globalIndexB)) / BigInt(PRECISION));
        
        console.log(`\nDeployer rewards before burn:`);
        console.log(`  - Earned A: ${deployerEarnedA}`);
        console.log(`  - Earned B: ${deployerEarnedB}`);
        console.log(`  - Deployer LP: ${deployerInitialLp}`);
        console.log(`  - Global Index A: ${globalIndexA}`);
        console.log(`  - Global Index B: ${globalIndexB}`);
        console.log(`  - Calculation: (${deployerInitialLp} * ${globalIndexB}) / ${PRECISION} = ${deployerEarnedB}`);
        
        getRewardUserInfo(
            deployer,
            deployerInitialLp,
            5, // block when deployer provided initial liquidity
            0,
            0,
            deployerEarnedA,
            deployerEarnedB,
            0,
            0,
            deployerEarnedA,
            deployerEarnedB,
            deployer,
            disp
        );
        
        // Check wallet1 rewards before deployer burns
        const wallet1EarnedA = Number((BigInt(wallet1InitialLp) * BigInt(globalIndexA)) / BigInt(PRECISION));
        const wallet1EarnedB = Number((BigInt(wallet1InitialLp) * BigInt(globalIndexB)) / BigInt(PRECISION));
        
        console.log(`\nWallet1 rewards before deployer burns:`);
        console.log(`  - Earned A: ${wallet1EarnedA}`);
        console.log(`  - Earned B: ${wallet1EarnedB}`);
        
        getRewardUserInfo(
            wallet1,
            wallet1InitialLp,
            8, // block when wallet1 provided liquidity (after deployer)
            0,
            0,
            wallet1EarnedA,
            wallet1EarnedB,
            0,
            0,
            wallet1EarnedA,
            wallet1EarnedB,
            deployer,
            disp
        );
        
        console.log("\n=== STEP 3: DEPLOYER BURNS ALL LIQUIDITY ===");
        console.log(`Deployer burning all ${deployerInitialLp} LP tokens`);
        
        // Deployer burns all their liquidity
        burnLiquidity(deployerInitialLp, deployerInitialLp, deployer, disp);
        
        // After burn, deployer forfeits their unclaimed rewards which redistribute to wallet1
        const deployerForfeitedA = deployerEarnedA;
        const deployerForfeitedB = deployerEarnedB;
        const wallet1LpSupply = wallet1InitialLp; // only wallet1 has LP now
        
        // Calculate redistribution increase to global indices
        const redistIncreaseA = Number((BigInt(deployerForfeitedA) * BigInt(PRECISION)) / BigInt(wallet1LpSupply));
        const redistIncreaseB = Number((BigInt(deployerForfeitedB) * BigInt(PRECISION)) / BigInt(wallet1LpSupply));
        const newGlobalIndexA = globalIndexA + redistIncreaseA;
        const newGlobalIndexB = globalIndexB + redistIncreaseB;
        
        console.log(`\nAfter deployer burn - redistribution to wallet1:`);
        console.log(`  - Deployer forfeited A: ${deployerForfeitedA}`);
        console.log(`  - Deployer forfeited B: ${deployerForfeitedB}`);
        console.log(`  - Redistribution increase A: ${redistIncreaseA}`);
        console.log(`  - Redistribution increase B: ${redistIncreaseB}`);
        console.log(`  - New Global Index A: ${newGlobalIndexA}`);
        console.log(`  - New Global Index B: ${newGlobalIndexB}`);
        
        getRewardPoolInfo(
            newGlobalIndexA,
            newGlobalIndexB,
            DONATE_WELSH,
            DONATE_STREET,
            deployer,
            disp
        );
        
        // Verify deployer has 0 LP and 0 rewards
        getBalance(0, 'credit', deployer, deployer, disp);
        
        getRewardUserInfo(
            deployer,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            deployer,
            disp
        );
        
        // Wallet1 should now have 100% of all rewards
        const wallet1TotalEarnedA = Number((BigInt(wallet1InitialLp) * BigInt(newGlobalIndexA)) / BigInt(PRECISION));
        const wallet1TotalEarnedB = Number((BigInt(wallet1InitialLp) * BigInt(newGlobalIndexB)) / BigInt(PRECISION));
        
        console.log(`\nWallet1 after deployer burn (100% of rewards):`);
        console.log(`  - Total Earned A: ${wallet1TotalEarnedA}`);
        console.log(`  - Total Earned B: ${wallet1TotalEarnedB}`);
        console.log(`  - Expected to equal DONATE_WELSH: ${wallet1TotalEarnedA} === ${DONATE_WELSH}? ${wallet1TotalEarnedA === DONATE_WELSH}`);
        console.log(`  - Expected to equal DONATE_STREET: ${wallet1TotalEarnedB} === ${DONATE_STREET}? ${wallet1TotalEarnedB === DONATE_STREET}`);
        
        getRewardUserInfo(
            wallet1,
            wallet1InitialLp,
            8,
            0,
            0,
            wallet1TotalEarnedA,
            wallet1TotalEarnedB,
            0,
            0,
            wallet1TotalEarnedA,
            wallet1TotalEarnedB,
            deployer,
            disp
        );
        
        console.log("\n=== STEP 4: WALLET1 TRANSFERS 100% CREDIT TO WALLET2 ===");
        console.log(`Transferring all ${wallet1InitialLp} LP tokens from wallet1 to wallet2`);
        
        transferCredit(
            wallet1InitialLp,
            wallet1,
            wallet2,
            wallet1,
            disp
        );
        
        // After transfer:
        // - wallet1 forfeits ALL unclaimed rewards (100% transfer)
        // - BUG: wallet2 is the ONLY LP holder now, but the contract calculates:
        //   other-lp = total-lp - old-balance = 10T - 10T = 0
        //   When other-lp = 0, NO redistribution happens!
        //   The forfeited rewards are LOST FOREVER!
        
        const wallet1ForfeitsA = wallet1TotalEarnedA;
        const wallet1ForfeitsB = wallet1TotalEarnedB;
        
        // BUG: No redistribution because other-lp = 0
        const redistToWallet2A = 0; // Should be 100000000 but is 0 due to bug
        const redistToWallet2B = 0; // Should be 10000000000 but is 0 due to bug
        const finalGlobalIndexA = newGlobalIndexA; // Stays at 100000000
        const finalGlobalIndexB = newGlobalIndexB; // Stays at 10000000000
        
        console.log(`\nAfter wallet1 -> wallet2 transfer:`);
        console.log(`  - Wallet1 forfeits A: ${wallet1ForfeitsA}`);
        console.log(`  - Wallet1 forfeits B: ${wallet1ForfeitsB}`);
        console.log(`  - 🚨 BUG: other-lp = total-lp - old-balance = 10T - 10T = 0`);
        console.log(`  - 🚨 BUG: No redistribution when other-lp = 0!`);
        console.log(`  - Redistribution to wallet2 A: ${redistToWallet2A} (should be 100000000)`);
        console.log(`  - Redistribution to wallet2 B: ${redistToWallet2B} (should be 10000000000)`);
        console.log(`  - Final Global Index A: ${finalGlobalIndexA} (unchanged)`);
        console.log(`  - Final Global Index B: ${finalGlobalIndexB} (unchanged)`);
        console.log(`  - 💀 REWARDS LOST: ${wallet1ForfeitsA + wallet1ForfeitsB} tokens GONE!`);
        
        getRewardPoolInfo(
            finalGlobalIndexA,
            finalGlobalIndexB,
            DONATE_WELSH,
            DONATE_STREET,
            deployer,
            disp
        );
        
        // Verify balances
        getBalance(0, 'credit', wallet1, deployer, disp);
        getBalance(wallet1InitialLp, 'credit', wallet2, deployer, disp);
        
        // Wallet1 should have 0 rewards
        getRewardUserInfo(
            wallet1,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            deployer,
            disp
        );
        
        // Wallet2 gets clean start at finalGlobalIndex (no retroactive rewards)
        console.log(`\nWallet2 after receiving transfer (clean start):`);
        console.log(`  - Balance LP: ${wallet1InitialLp}`);
        console.log(`  - Index A: ${finalGlobalIndexA} (clean start)`);
        console.log(`  - Index B: ${finalGlobalIndexB} (clean start)`);
        console.log(`  - Unclaimed A: 0 (no retroactive rewards)`);
        console.log(`  - Unclaimed B: 0 (no retroactive rewards)`);
        console.log(`  - 💀 Lost ${wallet1ForfeitsA} A rewards + ${wallet1ForfeitsB} B rewards from wallet1's forfeit!`);
        
        getRewardUserInfo(
            wallet2,
            wallet1InitialLp,
            11, // block when transfer happened
            0,
            0,
            0,
            0,
            finalGlobalIndexA,
            finalGlobalIndexB,
            0,
            0,
            deployer,
            disp
        );
        
        console.log("\n=== STEP 5: WALLET2 TRANSFERS 100% CREDIT BACK TO WALLET1 ===");
        console.log(`Transferring all ${wallet1InitialLp} LP tokens from wallet2 back to wallet1`);
        
        transferCredit(
            wallet1InitialLp,
            wallet2,
            wallet1,
            wallet2,
            disp
        );
        
        // After return transfer:
        // - wallet2 has NO unclaimed rewards (clean start from previous transfer)
        // - wallet2 forfeits 0
        // - wallet1 receives LP tokens with clean start at current global indices
        // - No redistribution since wallet2 has nothing to forfeit
        
        console.log(`\nAfter wallet2 -> wallet1 transfer:`);
        console.log(`  - Wallet2 forfeits: 0 (had no unclaimed rewards)`);
        console.log(`  - Global indices unchanged: A=${finalGlobalIndexA}, B=${finalGlobalIndexB}`);
        console.log(`  - Wallet1 gets clean start - NO retroactive rewards on transferred tokens!`);
        
        getRewardPoolInfo(
            finalGlobalIndexA,
            finalGlobalIndexB,
            DONATE_WELSH,
            DONATE_STREET,
            deployer,
            disp
        );
        
        // Verify balances
        getBalance(wallet1InitialLp, 'credit', wallet1, deployer, disp);
        getBalance(0, 'credit', wallet2, deployer, disp);
        
        console.log("\n=== STEP 6: VERIFY ALL HAVE 0 UNCLAIMED REWARDS ===");
        
        // Wallet1 gets clean start at finalGlobalIndex (no retroactive rewards)
        console.log(`\nWallet1 after receiving return transfer (clean start):`);
        console.log(`  - Balance LP: ${wallet1InitialLp}`);
        console.log(`  - Index A: ${finalGlobalIndexA} (clean start)`);
        console.log(`  - Index B: ${finalGlobalIndexB} (clean start)`);
        console.log(`  - Unclaimed A: 0 (no retroactive rewards)`);
        console.log(`  - Unclaimed B: 0 (no retroactive rewards)`);
        
        getRewardUserInfo(
            wallet1,
            wallet1InitialLp,
            12, // block when return transfer happened
            0,
            0,
            0,
            0,
            finalGlobalIndexA,
            finalGlobalIndexB,
            0,
            0,
            deployer,
            disp
        );
        
        // Wallet2 has 0 LP and 0 rewards
        getRewardUserInfo(
            wallet2,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            deployer,
            disp
        );
        
        // Deployer already verified to have 0 LP and 0 rewards
        
        console.log("\n╔═══════════════════════════════════════════════════════════╗");
        console.log("║           REWARDS LOST FOREVER - FINAL ANALYSIS           ║");
        console.log("╠═══════════════════════════════════════════════════════════╣");
        console.log(`║ Total Rewards Donated:                                    ║`);
        console.log(`║   WELSH (Token A):   ${DONATE_WELSH.toString().padStart(15)} (1 Trillion)     ║`);
        console.log(`║   STREET (Token B):  ${DONATE_STREET.toString().padStart(15)} (100 Trillion)  ║`);
        console.log(`║   TOTAL:             ${(DONATE_WELSH + DONATE_STREET).toString().padStart(15)} tokens          ║`);
        console.log("╠═══════════════════════════════════════════════════════════╣");
        console.log("║ Current Unclaimed Rewards (after transfer cycle):        ║");
        console.log("║   Deployer:  0 (burned all LP)                           ║");
        console.log("║   Wallet1:   0 (all rewards forfeited & lost)            ║");
        console.log("║   Wallet2:   0 (clean start, no rewards)                 ║");
        console.log("╠═══════════════════════════════════════════════════════════╣");
        console.log("║ 💀 TOTAL LOSS CALCULATION:                                ║");
        console.log(`║   Initial donated:      ${(DONATE_WELSH + DONATE_STREET).toString().padStart(15)} tokens          ║`);
        console.log(`║   Still in contract:    ${(DONATE_WELSH + DONATE_STREET).toString().padStart(15)} tokens          ║`);
        console.log(`║   Claimable by users:                  0 tokens          ║`);
        console.log(`║   PERMANENTLY LOCKED:   ${(DONATE_WELSH + DONATE_STREET).toString().padStart(15)} tokens (100%)   ║`);
        console.log("╠═══════════════════════════════════════════════════════════╣");
        console.log("║ 🚨 BUG MECHANICS:                                          ║");
        console.log("║ 1. Wallet1 had 100% of rewards (1T + 100T)               ║");
        console.log("║ 2. Transfer to wallet2: other-lp = 10T - 10T = 0         ║");
        console.log("║ 3. No redistribution when other-lp = 0                   ║");
        console.log("║ 4. Forfeited rewards vanish (not redistributed!)         ║");
        console.log("║ 5. Wallet2 gets clean start (no retroactive rewards)     ║");
        console.log("║ 6. Return transfer: wallet2 has 0 to forfeit             ║");
        console.log("║ 7. Result: 101 Trillion tokens LOST FOREVER              ║");
        console.log("╚═══════════════════════════════════════════════════════════╝");
        console.log(`\n✅ Test completed - verified rewards loss bug: ${(DONATE_WELSH + DONATE_STREET).toLocaleString()} tokens locked permanently in contract`);
    });

    it("=== CREDIT TRANSFER LOST FOREVER - WALLET1 AND WALLET2 ===", () => {
        // TEST SUMMARY
        // STEP 1: Setup rewards environment (deployer + wallet1 + wallet2) all provide liquidity
        // STEP 2: Deployer donates rewards (1000T WELSH, 100000T STREET)
        // STEP 3: Deployer burns all liquidity to avoid further reward accumulation. wallet1 and wallet2 should have 50% each claimable rewards now.
        // STEP 4: wallet1 transfers 100% CREDIT to wallet2
        // STEP 5: wallet2 transfers 100% CREDIT back to wallet1. check to see unclaimable balance of each account and summarize the result

        console.log("\n=== STEP 1: SETUP REWARDS ENVIRONMENT (ALL 3 PROVIDE LIQUIDITY) ===");
        
        // Setup initial liquidity with deployer
        const initialSetup = setupInitialLiquidity(disp);
        
        // Transfer tokens to wallet1 and wallet2 so they can provide liquidity
        const TRANSFER_WELSH = INITIAL_WELSH * 2;
        const TRANSFER_STREET = INITIAL_STREET * 2;
        transfer(TRANSFER_WELSH, 'welshcorgicoin', deployer, wallet1, disp);
        transfer(TRANSFER_STREET, 'street', deployer, wallet1, disp);
        transfer(TRANSFER_WELSH, 'welshcorgicoin', deployer, wallet2, disp);
        transfer(TRANSFER_STREET, 'street', deployer, wallet2, disp);
        
        // Calculate exact values for wallet1 liquidity provision
        const amountA = INITIAL_WELSH;
        let currentReserveA = initialSetup.reserveAExpected;
        let currentReserveB = initialSetup.reserveBExpected;
        let currentLpSupply = initialSetup.mintedLpExpected;
        
        const amountB1 = Math.floor((amountA * currentReserveB) / currentReserveA);
        const mintedLpWallet1 = Math.floor((amountA * currentLpSupply) / currentReserveA);
        
        console.log(`\nWallet1 providing liquidity:`);
        console.log(`  - Amount A: ${amountA}`);
        console.log(`  - Amount B: ${amountB1}`);
        console.log(`  - Expected LP: ${mintedLpWallet1}`);
        
        provideLiquidity(amountA, amountA, amountB1, mintedLpWallet1, wallet1, disp);
        
        // Update reserves after wallet1
        currentReserveA = currentReserveA + amountA;
        currentReserveB = currentReserveB + amountB1;
        currentLpSupply = currentLpSupply + mintedLpWallet1;
        
        // Calculate exact values for wallet2 liquidity provision
        const amountB2 = Math.floor((amountA * currentReserveB) / currentReserveA);
        const mintedLpWallet2 = Math.floor((amountA * currentLpSupply) / currentReserveA);
        
        console.log(`\nWallet2 providing liquidity:`);
        console.log(`  - Amount A: ${amountA}`);
        console.log(`  - Amount B: ${amountB2}`);
        console.log(`  - Expected LP: ${mintedLpWallet2}`);
        
        provideLiquidity(amountA, amountA, amountB2, mintedLpWallet2, wallet2, disp);
        
        // Update final state
        const totalLpSupply = currentLpSupply + mintedLpWallet2;
        const reserveAAfterAll = currentReserveA + amountA;
        const reserveBAfterAll = currentReserveB + amountB2;
        
        const deployerInitialLp = initialSetup.mintedLpExpected;
        const wallet1InitialLp = mintedLpWallet1;
        const wallet2InitialLp = mintedLpWallet2;
        
        console.log(`\nTotal LP Supply after all: ${totalLpSupply}`);
        console.log(`Deployer LP: ${deployerInitialLp}`);
        console.log(`Wallet1 LP: ${wallet1InitialLp}`);
        console.log(`Wallet2 LP: ${wallet2InitialLp}`);
        console.log(`Reserve A: ${reserveAAfterAll}`);
        console.log(`Reserve B: ${reserveBAfterAll}`);
        
        // Get initial balances
        getBalance(deployerInitialLp, 'credit', deployer, deployer, disp);
        getBalance(wallet1InitialLp, 'credit', wallet1, deployer, disp);
        getBalance(wallet2InitialLp, 'credit', wallet2, deployer, disp);
        
        console.log("\n=== STEP 2: DEPLOYER DONATES REWARDS ===");
        console.log(`Donating: ${DONATE_WELSH} WELSH, ${DONATE_STREET} STREET`);
        console.log(`Total donated: ${DONATE_WELSH + DONATE_STREET} tokens`);
        
        donateRewards(DONATE_WELSH, DONATE_STREET, deployer, disp);
        
        // Calculate expected global indices after donation (split equally among 3 LP holders)
        const donationImpactA = Math.floor((DONATE_WELSH * PRECISION) / totalLpSupply);
        const donationImpactB = Math.floor((DONATE_STREET * PRECISION) / totalLpSupply);
        const globalIndexA = donationImpactA;
        const globalIndexB = donationImpactB;
        
        console.log(`\nGlobal indices after donation:`);
        console.log(`  - Global Index A: ${globalIndexA}`);
        console.log(`  - Global Index B: ${globalIndexB}`);
        
        // Calculate each user's initial earned rewards (equal split)
        const deployerEarnedA = Number((BigInt(deployerInitialLp) * BigInt(globalIndexA)) / BigInt(PRECISION));
        const deployerEarnedB = Number((BigInt(deployerInitialLp) * BigInt(globalIndexB)) / BigInt(PRECISION));
        const wallet1EarnedA = Number((BigInt(wallet1InitialLp) * BigInt(globalIndexA)) / BigInt(PRECISION));
        const wallet1EarnedB = Number((BigInt(wallet1InitialLp) * BigInt(globalIndexB)) / BigInt(PRECISION));
        const wallet2EarnedA = Number((BigInt(wallet2InitialLp) * BigInt(globalIndexA)) / BigInt(PRECISION));
        const wallet2EarnedB = Number((BigInt(wallet2InitialLp) * BigInt(globalIndexB)) / BigInt(PRECISION));
        
        console.log(`\nInitial rewards distribution (equal split among 3):`);
        console.log(`  - Deployer: ${deployerEarnedA} WELSH + ${deployerEarnedB} STREET = ${deployerEarnedA + deployerEarnedB} total`);
        console.log(`  - Wallet1:  ${wallet1EarnedA} WELSH + ${wallet1EarnedB} STREET = ${wallet1EarnedA + wallet1EarnedB} total`);
        console.log(`  - Wallet2:  ${wallet2EarnedA} WELSH + ${wallet2EarnedB} STREET = ${wallet2EarnedA + wallet2EarnedB} total`);
        
        console.log("\n=== STEP 3: DEPLOYER BURNS ALL LIQUIDITY ===");
        console.log(`Deployer burning ${deployerInitialLp} LP tokens`);
        
        // Calculate deployer's forfeit (they forfeit all their unclaimed rewards)
        const deployerForfeitA = deployerEarnedA;
        const deployerForfeitB = deployerEarnedB;
        
        console.log(`\nDeployer forfeits:`);
        console.log(`  - Forfeit A: ${deployerForfeitA}`);
        console.log(`  - Forfeit B: ${deployerForfeitB}`);
        console.log(`  - Total forfeit: ${deployerForfeitA + deployerForfeitB}`);
        
        // Calculate redistribution to wallet1 and wallet2
        const otherLpAfterBurn = totalLpSupply - deployerInitialLp; // 20T remaining between wallet1 and wallet2
        const redistA = Math.floor((deployerForfeitA * PRECISION) / otherLpAfterBurn);
        const redistB = Math.floor((deployerForfeitB * PRECISION) / otherLpAfterBurn);
        
        console.log(`\nRedistribution calculation:`);
        console.log(`  - Other LP (wallet1 + wallet2): ${otherLpAfterBurn}`);
        console.log(`  - Redistribution Index A: ${redistA}`);
        console.log(`  - Redistribution Index B: ${redistB}`);
        
        burnLiquidity(deployerInitialLp, deployerInitialLp, deployer, disp);
        
        // New global indices after burn redistribution
        const globalIndexAAfterBurn = globalIndexA + redistA;
        const globalIndexBAfterBurn = globalIndexB + redistB;
        
        console.log(`\nGlobal indices after deployer burn:`);
        console.log(`  - Global Index A: ${globalIndexA} → ${globalIndexAAfterBurn}`);
        console.log(`  - Global Index B: ${globalIndexB} → ${globalIndexBAfterBurn}`);
        
        getRewardPoolInfo(
            globalIndexAAfterBurn,
            globalIndexBAfterBurn,
            DONATE_WELSH,
            DONATE_STREET,
            deployer,
            disp
        );
        
        // Calculate wallet1 and wallet2 unclaimed after burn redistribution
        const wallet1UnclaimedA = Number((BigInt(wallet1InitialLp) * BigInt(globalIndexAAfterBurn)) / BigInt(PRECISION));
        const wallet1UnclaimedB = Number((BigInt(wallet1InitialLp) * BigInt(globalIndexBAfterBurn)) / BigInt(PRECISION));
        const wallet2UnclaimedA = Number((BigInt(wallet2InitialLp) * BigInt(globalIndexAAfterBurn)) / BigInt(PRECISION));
        const wallet2UnclaimedB = Number((BigInt(wallet2InitialLp) * BigInt(globalIndexBAfterBurn)) / BigInt(PRECISION));
        
        console.log(`\nWallet rewards after deployer burn (each gets 50% of total):`);
        console.log(`  - Wallet1: ${wallet1UnclaimedA} WELSH + ${wallet1UnclaimedB} STREET = ${wallet1UnclaimedA + wallet1UnclaimedB} total`);
        console.log(`  - Wallet2: ${wallet2UnclaimedA} WELSH + ${wallet2UnclaimedB} STREET = ${wallet2UnclaimedA + wallet2UnclaimedB} total`);
        console.log(`  - Combined: ${(wallet1UnclaimedA + wallet1UnclaimedB + wallet2UnclaimedA + wallet2UnclaimedB)} tokens`);
        
        console.log("\n=== STEP 4: WALLET1 TRANSFERS 100% CREDIT TO WALLET2 ===");
        console.log(`Wallet1 transferring ${wallet1InitialLp} LP to wallet2`);
        
        // Calculate wallet1's forfeit
        const wallet1ForfeitA = wallet1UnclaimedA;
        const wallet1ForfeitB = wallet1UnclaimedB;
        
        console.log(`\nWallet1 forfeits:`);
        console.log(`  - Forfeit A: ${wallet1ForfeitA}`);
        console.log(`  - Forfeit B: ${wallet1ForfeitB}`);
        console.log(`  - Total forfeit: ${wallet1ForfeitA + wallet1ForfeitB}`);
        
        // Calculate other-lp for redistribution
        const totalLpBeforeTransfer = wallet1InitialLp + wallet2InitialLp;
        const otherLpForTransfer = totalLpBeforeTransfer - wallet1InitialLp; // = wallet2InitialLp
        
        console.log(`\nRedistribution calculation:`);
        console.log(`  - Total LP before transfer: ${totalLpBeforeTransfer}`);
        console.log(`  - Wallet1 old balance: ${wallet1InitialLp}`);
        console.log(`  - Other LP: ${otherLpForTransfer}`);
        
        // Redistribution to wallet2
        const redistA2 = Math.floor((wallet1ForfeitA * PRECISION) / otherLpForTransfer);
        const redistB2 = Math.floor((wallet1ForfeitB * PRECISION) / otherLpForTransfer);
        
        console.log(`  - Redistribution Index A: ${redistA2}`);
        console.log(`  - Redistribution Index B: ${redistB2}`);
        
        transferCredit(wallet1InitialLp, wallet1, wallet2, wallet1, disp);
        
        // New global indices after wallet1 transfer
        const globalIndexAAfterTransfer = globalIndexAAfterBurn + redistA2;
        const globalIndexBAfterTransfer = globalIndexBAfterBurn + redistB2;
        
        console.log(`\nGlobal indices after wallet1 transfer:`);
        console.log(`  - Global Index A: ${globalIndexAAfterBurn} → ${globalIndexAAfterTransfer}`);
        console.log(`  - Global Index B: ${globalIndexBAfterBurn} → ${globalIndexBAfterTransfer}`);
        
        getBalance(0, 'credit', wallet1, deployer, disp);
        getBalance(wallet1InitialLp + wallet2InitialLp, 'credit', wallet2, deployer, disp);
        
        // Calculate wallet2's preserved unclaimed + redistribution
        const wallet2NewBalance = wallet1InitialLp + wallet2InitialLp;
        const wallet2PreservedA = wallet2UnclaimedA;
        const wallet2PreservedB = wallet2UnclaimedB;
        const wallet2RedistA = Number((BigInt(wallet2InitialLp) * BigInt(redistA2)) / BigInt(PRECISION));
        const wallet2RedistB = Number((BigInt(wallet2InitialLp) * BigInt(redistB2)) / BigInt(PRECISION));
        const wallet2TotalUnclaimedA = wallet2PreservedA + wallet2RedistA;
        const wallet2TotalUnclaimedB = wallet2PreservedB + wallet2RedistB;
        
        console.log(`\nWallet2 after receiving transfer:`);
        console.log(`  - New balance: ${wallet2NewBalance} LP`);
        console.log(`  - Preserved unclaimed A: ${wallet2PreservedA}`);
        console.log(`  - Preserved unclaimed B: ${wallet2PreservedB}`);
        console.log(`  - Redistribution A: ${wallet2RedistA}`);
        console.log(`  - Redistribution B: ${wallet2RedistB}`);
        console.log(`  - Total unclaimed A: ${wallet2TotalUnclaimedA}`);
        console.log(`  - Total unclaimed B: ${wallet2TotalUnclaimedB}`);
        console.log(`  - Total unclaimed: ${wallet2TotalUnclaimedA + wallet2TotalUnclaimedB}`);
        
        console.log("\n=== STEP 5: WALLET2 TRANSFERS 100% CREDIT BACK TO WALLET1 ===");
        console.log(`Wallet2 transferring ${wallet2NewBalance} LP back to wallet1`);
        
        // Calculate wallet2's forfeit
        const wallet2ForfeitA = wallet2TotalUnclaimedA;
        const wallet2ForfeitB = wallet2TotalUnclaimedB;
        
        console.log(`\nWallet2 forfeits:`);
        console.log(`  - Forfeit A: ${wallet2ForfeitA}`);
        console.log(`  - Forfeit B: ${wallet2ForfeitB}`);
        console.log(`  - Total forfeit: ${wallet2ForfeitA + wallet2ForfeitB}`);
        
        // Calculate other-lp for this transfer (should be 0!)
        const otherLpForReturn = wallet2NewBalance - wallet2NewBalance; // = 0
        
        console.log(`\nRedistribution calculation:`);
        console.log(`  - Total LP before transfer: ${wallet2NewBalance}`);
        console.log(`  - Wallet2 old balance: ${wallet2NewBalance}`);
        console.log(`  - Other LP: ${otherLpForReturn}`);
        console.log(`  - ⚠️  BUG: other-lp = 0, so NO REDISTRIBUTION!`);
        
        transferCredit(wallet2NewBalance, wallet2, wallet1, wallet2, disp);
        
        // Global indices remain unchanged (no redistribution when other-lp = 0)
        const finalGlobalIndexA = globalIndexAAfterTransfer;
        const finalGlobalIndexB = globalIndexBAfterTransfer;
        
        console.log(`\nGlobal indices after wallet2 return transfer:`);
        console.log(`  - Global Index A: ${globalIndexAAfterTransfer} → ${finalGlobalIndexA} (unchanged)`);
        console.log(`  - Global Index B: ${globalIndexBAfterTransfer} → ${finalGlobalIndexB} (unchanged)`);
        
        getBalance(wallet2NewBalance, 'credit', wallet1, deployer, disp);
        getBalance(0, 'credit', wallet2, deployer, disp);
        
        console.log("\n=== STEP 6: VERIFY FINAL STATE AND CALCULATE LOST REWARDS ===");
        
        // Wallet1 gets clean start (no retroactive rewards on transferred tokens)
        console.log(`\nWallet1 after receiving return transfer (clean start):`);
        console.log(`  - Balance LP: ${wallet2NewBalance}`);
        console.log(`  - Index A: ${finalGlobalIndexA} (clean start)`);
        console.log(`  - Index B: ${finalGlobalIndexB} (clean start)`);
        console.log(`  - Unclaimed A: 0 (no retroactive rewards)`);
        console.log(`  - Unclaimed B: 0 (no retroactive rewards)`);
        
        getRewardUserInfo(
            wallet1,
            wallet2NewBalance,
            15, // block number (adjusted for 3-user setup)
            0,
            0,
            0,
            0,
            finalGlobalIndexA,
            finalGlobalIndexB,
            0,
            0,
            deployer,
            disp
        );
        
        // Wallet2 has no LP and no rewards
        console.log(`\nWallet2 final state:`);
        console.log(`  - Balance LP: 0`);
        console.log(`  - All state wiped after burning all LP`);
        
        getRewardUserInfo(
            wallet2,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            deployer,
            disp
        );
        
        // Deployer has no LP and no rewards
        console.log(`\nDeployer final state:`);
        console.log(`  - Balance LP: 0`);
        console.log(`  - All state wiped after burning all LP`);
        
        getRewardUserInfo(
            deployer,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            deployer,
            disp
        );
        
        // Calculate total lost rewards
        const totalDonated = DONATE_WELSH + DONATE_STREET;
        const totalClaimable = 0; // All users have 0 unclaimed
        const totalLost = totalDonated - totalClaimable;
        const lossPercentage = ((totalLost / totalDonated) * 100).toFixed(2);
        
        console.log("\n╔═══════════════════════════════════════════════════════════╗");
        console.log("║    REWARDS LOST - FINAL ANALYSIS (WITH WALLET2 LP)       ║");
        console.log("╠═══════════════════════════════════════════════════════════╣");
        console.log(`║ Total Rewards Donated:                                    ║`);
        console.log(`║   WELSH (Token A):   ${DONATE_WELSH.toString().padStart(15)} (1 Trillion)     ║`);
        console.log(`║   STREET (Token B):  ${DONATE_STREET.toString().padStart(15)} (100 Trillion)  ║`);
        console.log(`║   TOTAL:             ${totalDonated.toString().padStart(15)} tokens          ║`);
        console.log("╠═══════════════════════════════════════════════════════════╣");
        console.log("║ Current Unclaimed Rewards (after transfer cycle):        ║");
        console.log("║   Deployer:  0 (burned all LP)                           ║");
        console.log("║   Wallet1:   0 (clean start, no retroactive rewards)     ║");
        console.log("║   Wallet2:   0 (forfeited to nobody when other-lp = 0)   ║");
        console.log("╠═══════════════════════════════════════════════════════════╣");
        console.log("║ 💀 TOTAL LOSS CALCULATION:                                ║");
        console.log(`║   Initial donated:      ${totalDonated.toString().padStart(15)} tokens          ║`);
        console.log(`║   Claimable by users:                  ${totalClaimable} tokens          ║`);
        console.log(`║   PERMANENTLY LOCKED:   ${totalLost.toString().padStart(15)} tokens (${lossPercentage}%)    ║`);
        console.log("╠═══════════════════════════════════════════════════════════╣");
        console.log("║ 🚨 BUG MECHANICS (Different from Test 1):                 ║");
        console.log("║ 1. All 3 users start with equal LP and rewards           ║");
        console.log("║ 2. Deployer burns → forfeits redistributed to W1 + W2    ║");
        console.log("║ 3. W1 transfers to W2 → W1 forfeits to W2 (works!)       ║");
        console.log("║ 4. W2 now has 100% LP and ~100% of rewards               ║");
        console.log("║ 5. W2 transfers back to W1: other-lp = 20T - 20T = 0     ║");
        console.log("║ 6. W2's forfeit has nowhere to go (other-lp = 0)         ║");
        console.log("║ 7. Forfeited rewards VANISH instead of redistributing    ║");
        console.log("║ 8. W1 gets clean start (no retroactive rewards)          ║");
        console.log(`║ 9. Result: ${wallet2ForfeitA + wallet2ForfeitB} tokens LOST in step 5           ║`);
        console.log("╚═══════════════════════════════════════════════════════════╝");
        console.log(`\n✅ Test completed - verified rewards loss bug with initial wallet2 LP: ${totalLost.toLocaleString()} tokens (${lossPercentage}%) locked permanently`);
    })


    it("=== CREDIT TRANSFER WITH CLAIM AND TRANSFER BACK - WALLET1 AND WALLET2 ===", () => {
        // TEST SUMMARY
        // STEP 1: Setup rewards environment (deployer + wallet1 + wallet2) all provide liquidity
        // STEP 2: Deployer donates rewards (1000T WELSH, 100000T STREET)
        // STEP 3: Deployer burns all liquidity to avoid further reward accumulation. wallet1 and wallet2 should have 50% each claimable rewards now.
        // STEP 4: wallet1 transfers 50% CREDIT to wallet2
        // STEP 5: wallet2 claims all rewards
        // STEP 6: wallet2 transfers 100% CREDIT back to wallet1. check to see unclaimable balance of each account and summarize the result

        console.log("\n=== STEP 1: SETUP REWARDS ENVIRONMENT (ALL 3 PROVIDE LIQUIDITY) ===");
        
        // Setup initial liquidity with deployer
        const initialSetup = setupInitialLiquidity(disp);
        
        // Transfer tokens to wallet1 and wallet2 so they can provide liquidity
        const TRANSFER_WELSH = INITIAL_WELSH * 2;
        const TRANSFER_STREET = INITIAL_STREET * 2;
        transfer(TRANSFER_WELSH, 'welshcorgicoin', deployer, wallet1, disp);
        transfer(TRANSFER_STREET, 'street', deployer, wallet1, disp);
        transfer(TRANSFER_WELSH, 'welshcorgicoin', deployer, wallet2, disp);
        transfer(TRANSFER_STREET, 'street', deployer, wallet2, disp);
        
        // Calculate exact values for wallet1 liquidity provision
        const amountA = INITIAL_WELSH;
        let currentReserveA = initialSetup.reserveAExpected;
        let currentReserveB = initialSetup.reserveBExpected;
        let currentLpSupply = initialSetup.mintedLpExpected;
        
        const amountB1 = Math.floor((amountA * currentReserveB) / currentReserveA);
        const mintedLpWallet1 = Math.floor((amountA * currentLpSupply) / currentReserveA);
        
        console.log(`\nWallet1 providing liquidity:`);
        console.log(`  - Amount A: ${amountA}`);
        console.log(`  - Amount B: ${amountB1}`);
        console.log(`  - Expected LP: ${mintedLpWallet1}`);
        
        provideLiquidity(amountA, amountA, amountB1, mintedLpWallet1, wallet1, disp);
        
        // Update reserves after wallet1
        currentReserveA = currentReserveA + amountA;
        currentReserveB = currentReserveB + amountB1;
        currentLpSupply = currentLpSupply + mintedLpWallet1;
        
        // Calculate exact values for wallet2 liquidity provision
        const amountB2 = Math.floor((amountA * currentReserveB) / currentReserveA);
        const mintedLpWallet2 = Math.floor((amountA * currentLpSupply) / currentReserveA);
        
        console.log(`\nWallet2 providing liquidity:`);
        console.log(`  - Amount A: ${amountA}`);
        console.log(`  - Amount B: ${amountB2}`);
        console.log(`  - Expected LP: ${mintedLpWallet2}`);
        
        provideLiquidity(amountA, amountA, amountB2, mintedLpWallet2, wallet2, disp);
        
        // Update final state
        const totalLpSupply = currentLpSupply + mintedLpWallet2;
        const reserveAAfterAll = currentReserveA + amountA;
        const reserveBAfterAll = currentReserveB + amountB2;
        
        const deployerInitialLp = initialSetup.mintedLpExpected;
        const wallet1InitialLp = mintedLpWallet1;
        const wallet2InitialLp = mintedLpWallet2;
        
        console.log(`\nTotal LP Supply after all: ${totalLpSupply}`);
        console.log(`Deployer LP: ${deployerInitialLp}`);
        console.log(`Wallet1 LP: ${wallet1InitialLp}`);
        console.log(`Wallet2 LP: ${wallet2InitialLp}`);
        console.log(`Reserve A: ${reserveAAfterAll}`);
        console.log(`Reserve B: ${reserveBAfterAll}`);
        
        // Get initial balances
        getBalance(deployerInitialLp, 'credit', deployer, deployer, disp);
        getBalance(wallet1InitialLp, 'credit', wallet1, deployer, disp);
        getBalance(wallet2InitialLp, 'credit', wallet2, deployer, disp);
        
        console.log("\n=== STEP 2: DEPLOYER DONATES REWARDS ===");
        console.log(`Donating: ${DONATE_WELSH} WELSH, ${DONATE_STREET} STREET`);
        console.log(`Total donated: ${DONATE_WELSH + DONATE_STREET} tokens`);
        
        donateRewards(DONATE_WELSH, DONATE_STREET, deployer, disp);
        
        // Calculate expected global indices after donation (split equally among 3 LP holders)
        const donationImpactA = Math.floor((DONATE_WELSH * PRECISION) / totalLpSupply);
        const donationImpactB = Math.floor((DONATE_STREET * PRECISION) / totalLpSupply);
        const globalIndexA = donationImpactA;
        const globalIndexB = donationImpactB;
        
        console.log(`\nGlobal indices after donation:`);
        console.log(`  - Global Index A: ${globalIndexA}`);
        console.log(`  - Global Index B: ${globalIndexB}`);
        
        // Calculate each user's initial earned rewards (equal split)
        const deployerEarnedA = Number((BigInt(deployerInitialLp) * BigInt(globalIndexA)) / BigInt(PRECISION));
        const deployerEarnedB = Number((BigInt(deployerInitialLp) * BigInt(globalIndexB)) / BigInt(PRECISION));
        const wallet1EarnedA = Number((BigInt(wallet1InitialLp) * BigInt(globalIndexA)) / BigInt(PRECISION));
        const wallet1EarnedB = Number((BigInt(wallet1InitialLp) * BigInt(globalIndexB)) / BigInt(PRECISION));
        const wallet2EarnedA = Number((BigInt(wallet2InitialLp) * BigInt(globalIndexA)) / BigInt(PRECISION));
        const wallet2EarnedB = Number((BigInt(wallet2InitialLp) * BigInt(globalIndexB)) / BigInt(PRECISION));
        
        console.log(`\nInitial rewards distribution (equal split among 3):`);
        console.log(`  - Deployer: ${deployerEarnedA} WELSH + ${deployerEarnedB} STREET = ${deployerEarnedA + deployerEarnedB} total`);
        console.log(`  - Wallet1:  ${wallet1EarnedA} WELSH + ${wallet1EarnedB} STREET = ${wallet1EarnedA + wallet1EarnedB} total`);
        console.log(`  - Wallet2:  ${wallet2EarnedA} WELSH + ${wallet2EarnedB} STREET = ${wallet2EarnedA + wallet2EarnedB} total`);
        
        console.log("\n=== STEP 3: DEPLOYER BURNS ALL LIQUIDITY ===");
        console.log(`Deployer burning ${deployerInitialLp} LP tokens`);
        
        // Calculate deployer's forfeit (they forfeit all their unclaimed rewards)
        const deployerForfeitA = deployerEarnedA;
        const deployerForfeitB = deployerEarnedB;
        
        console.log(`\nDeployer forfeits:`);
        console.log(`  - Forfeit A: ${deployerForfeitA}`);
        console.log(`  - Forfeit B: ${deployerForfeitB}`);
        console.log(`  - Total forfeit: ${deployerForfeitA + deployerForfeitB}`);
        
        // Calculate redistribution to wallet1 and wallet2
        const otherLpAfterBurn = totalLpSupply - deployerInitialLp; // 20T remaining between wallet1 and wallet2
        const redistA = Math.floor((deployerForfeitA * PRECISION) / otherLpAfterBurn);
        const redistB = Math.floor((deployerForfeitB * PRECISION) / otherLpAfterBurn);
        
        console.log(`\nRedistribution calculation:`);
        console.log(`  - Other LP (wallet1 + wallet2): ${otherLpAfterBurn}`);
        console.log(`  - Redistribution Index A: ${redistA}`);
        console.log(`  - Redistribution Index B: ${redistB}`);
        
        burnLiquidity(deployerInitialLp, deployerInitialLp, deployer, disp);
        
        // New global indices after burn redistribution
        const globalIndexAAfterBurn = globalIndexA + redistA;
        const globalIndexBAfterBurn = globalIndexB + redistB;
        
        console.log(`\nGlobal indices after deployer burn:`);
        console.log(`  - Global Index A: ${globalIndexA} → ${globalIndexAAfterBurn}`);
        console.log(`  - Global Index B: ${globalIndexB} → ${globalIndexBAfterBurn}`);
        
        getRewardPoolInfo(
            globalIndexAAfterBurn,
            globalIndexBAfterBurn,
            DONATE_WELSH,
            DONATE_STREET,
            deployer,
            disp
        );
        
        // Calculate wallet1 and wallet2 unclaimed after burn redistribution
        const wallet1UnclaimedA = Number((BigInt(wallet1InitialLp) * BigInt(globalIndexAAfterBurn)) / BigInt(PRECISION));
        const wallet1UnclaimedB = Number((BigInt(wallet1InitialLp) * BigInt(globalIndexBAfterBurn)) / BigInt(PRECISION));
        const wallet2UnclaimedA = Number((BigInt(wallet2InitialLp) * BigInt(globalIndexAAfterBurn)) / BigInt(PRECISION));
        const wallet2UnclaimedB = Number((BigInt(wallet2InitialLp) * BigInt(globalIndexBAfterBurn)) / BigInt(PRECISION));
        
        console.log(`\nWallet rewards after deployer burn (each gets 50% of total):`);
        console.log(`  - Wallet1: ${wallet1UnclaimedA} WELSH + ${wallet1UnclaimedB} STREET = ${wallet1UnclaimedA + wallet1UnclaimedB} total`);
        console.log(`  - Wallet2: ${wallet2UnclaimedA} WELSH + ${wallet2UnclaimedB} STREET = ${wallet2UnclaimedA + wallet2UnclaimedB} total`);
        console.log(`  - Combined: ${(wallet1UnclaimedA + wallet1UnclaimedB + wallet2UnclaimedA + wallet2UnclaimedB)} tokens`);
        
        console.log("\n=== STEP 4: WALLET1 TRANSFERS 50% CREDIT TO WALLET2 ===");
        const transferAmount = Math.floor(wallet1InitialLp / 2); // 50% transfer
        console.log(`Wallet1 transferring ${transferAmount} LP (50%) to wallet2`);
        
        // Calculate wallet1's forfeit (proportional to transfer amount)
        const wallet1ForfeitA = Math.floor((wallet1UnclaimedA * transferAmount) / wallet1InitialLp);
        const wallet1ForfeitB = Math.floor((wallet1UnclaimedB * transferAmount) / wallet1InitialLp);
        
        // Wallet1 keeps the remaining rewards
        const wallet1KeptA = wallet1UnclaimedA - wallet1ForfeitA;
        const wallet1KeptB = wallet1UnclaimedB - wallet1ForfeitB;
        
        console.log(`\nWallet1 forfeits (50% of unclaimed):`);
        console.log(`  - Forfeit A: ${wallet1ForfeitA}`);
        console.log(`  - Forfeit B: ${wallet1ForfeitB}`);
        console.log(`  - Total forfeit: ${wallet1ForfeitA + wallet1ForfeitB}`);
        console.log(`  - Kept A: ${wallet1KeptA}`);
        console.log(`  - Kept B: ${wallet1KeptB}`);
        console.log(`  - Total kept: ${wallet1KeptA + wallet1KeptB}`);
        
        // Calculate other-lp for redistribution (should be wallet2's LP)
        const totalLpBeforeTransfer = wallet1InitialLp + wallet2InitialLp;
        const otherLpForTransfer = totalLpBeforeTransfer - wallet1InitialLp; // = wallet2InitialLp
        
        console.log(`\nRedistribution calculation:`);
        console.log(`  - Total LP before transfer: ${totalLpBeforeTransfer}`);
        console.log(`  - Wallet1 old balance: ${wallet1InitialLp}`);
        console.log(`  - Other LP (wallet2): ${otherLpForTransfer}`);
        
        // Redistribution to wallet2
        const redistA2 = Math.floor((wallet1ForfeitA * PRECISION) / otherLpForTransfer);
        const redistB2 = Math.floor((wallet1ForfeitB * PRECISION) / otherLpForTransfer);
        
        console.log(`  - Redistribution Index A: ${redistA2}`);
        console.log(`  - Redistribution Index B: ${redistB2}`);
        
        transferCredit(transferAmount, wallet1, wallet2, wallet1, disp);
        
        // New global indices after wallet1 transfer
        const globalIndexAAfterTransfer = globalIndexAAfterBurn + redistA2;
        const globalIndexBAfterTransfer = globalIndexBAfterBurn + redistB2;
        
        console.log(`\nGlobal indices after wallet1 transfer:`);
        console.log(`  - Global Index A: ${globalIndexAAfterBurn} → ${globalIndexAAfterTransfer}`);
        console.log(`  - Global Index B: ${globalIndexBAfterBurn} → ${globalIndexBAfterTransfer}`);
        
        const wallet1NewBalance = wallet1InitialLp - transferAmount;
        const wallet2NewBalance = wallet2InitialLp + transferAmount;
        
        getBalance(wallet1NewBalance, 'credit', wallet1, deployer, disp);
        getBalance(wallet2NewBalance, 'credit', wallet2, deployer, disp);
        
        // Calculate wallet2's preserved unclaimed + redistribution
        const wallet2PreservedA = wallet2UnclaimedA;
        const wallet2PreservedB = wallet2UnclaimedB;
        const wallet2RedistA = Number((BigInt(wallet2InitialLp) * BigInt(redistA2)) / BigInt(PRECISION));
        const wallet2RedistB = Number((BigInt(wallet2InitialLp) * BigInt(redistB2)) / BigInt(PRECISION));
        const wallet2TotalUnclaimedA = wallet2PreservedA + wallet2RedistA;
        const wallet2TotalUnclaimedB = wallet2PreservedB + wallet2RedistB;
        
        console.log(`\nWallet2 after receiving transfer:`);
        console.log(`  - New balance: ${wallet2NewBalance} LP`);
        console.log(`  - Preserved unclaimed A: ${wallet2PreservedA}`);
        console.log(`  - Preserved unclaimed B: ${wallet2PreservedB}`);
        console.log(`  - Redistribution A: ${wallet2RedistA}`);
        console.log(`  - Redistribution B: ${wallet2RedistB}`);
        console.log(`  - Total unclaimed A: ${wallet2TotalUnclaimedA}`);
        console.log(`  - Total unclaimed B: ${wallet2TotalUnclaimedB}`);
        console.log(`  - Total unclaimed: ${wallet2TotalUnclaimedA + wallet2TotalUnclaimedB}`);
        
        console.log("\n=== STEP 5: WALLET2 CLAIMS ALL REWARDS ===");
        console.log(`Wallet2 claiming ${wallet2TotalUnclaimedA} WELSH + ${wallet2TotalUnclaimedB} STREET`);
        
        // The claim function will use actual contract calculations which may differ slightly
        claimRewards(
            wallet2NewBalance,
            14, // block number when claim happens
            749999970000, // actual claimed A from contract
            74999999970000, // actual claimed B from contract
            749999970000, // debt-a after claim
            74999999970000, // debt-b after claim
            globalIndexAAfterTransfer,
            globalIndexBAfterTransfer,
            25000000, // index-a after claim
            2500000000, // index-b after claim
            wallet2,
            disp
        );
        
        // After claim, wallet2 should have 0 unclaimed
        console.log(`\nWallet2 after claiming rewards:`);
        console.log(`  - Unclaimed A: 0`);
        console.log(`  - Unclaimed B: 0`);
        console.log(`  - Claimed A: 749999970000`);
        console.log(`  - Claimed B: 74999999970000`);
        
        console.log("\n=== STEP 6: WALLET2 TRANSFERS 100% CREDIT BACK TO WALLET1 ===");
        console.log(`Wallet2 transferring ${wallet2NewBalance} LP back to wallet1`);
        
        // Calculate wallet2's forfeit (should be 0 since they just claimed)
        const wallet2ForfeitA = 0;
        const wallet2ForfeitB = 0;
        
        console.log(`\nWallet2 forfeits:`);
        console.log(`  - Forfeit A: ${wallet2ForfeitA} (already claimed)`);
        console.log(`  - Forfeit B: ${wallet2ForfeitB} (already claimed)`);
        console.log(`  - Total forfeit: ${wallet2ForfeitA + wallet2ForfeitB}`);
        
        // Calculate other-lp for this transfer
        const otherLpForReturn = wallet1NewBalance; // wallet1 still has their remaining LP
        
        console.log(`\nRedistribution calculation:`);
        console.log(`  - Total LP before transfer: ${wallet2NewBalance + wallet1NewBalance}`);
        console.log(`  - Wallet2 old balance: ${wallet2NewBalance}`);
        console.log(`  - Other LP (wallet1): ${otherLpForReturn}`);
        
        // Since wallet2 has no unclaimed rewards, no redistribution
        console.log(`  - No redistribution (wallet2 has 0 unclaimed after claim)`);
        
        transferCredit(wallet2NewBalance, wallet2, wallet1, wallet2, disp);
        
        // Global indices remain unchanged
        const finalGlobalIndexA = globalIndexAAfterTransfer;
        const finalGlobalIndexB = globalIndexBAfterTransfer;
        
        console.log(`\nGlobal indices after wallet2 return transfer:`);
        console.log(`  - Global Index A: ${globalIndexAAfterTransfer} → ${finalGlobalIndexA} (unchanged)`);
        console.log(`  - Global Index B: ${globalIndexBAfterTransfer} → ${finalGlobalIndexB} (unchanged)`);
        
        const wallet1FinalBalance = wallet1NewBalance + wallet2NewBalance;
        
        getBalance(wallet1FinalBalance, 'credit', wallet1, deployer, disp);
        getBalance(0, 'credit', wallet2, deployer, disp);
        
        console.log("\n=== FINAL STATE VERIFICATION ===");
        
        // Wallet1 should preserve their kept unclaimed + clean start on returned tokens
        const wallet1PreserveIdx = Math.floor((wallet1KeptA * PRECISION) / wallet1FinalBalance);
        const wallet1FinalIndexA = finalGlobalIndexA - wallet1PreserveIdx;
        const wallet1PreserveIdxB = Math.floor((wallet1KeptB * PRECISION) / wallet1FinalBalance);
        const wallet1FinalIndexB = finalGlobalIndexB - wallet1PreserveIdxB;
        
        console.log(`\nWallet1 final state:`);
        console.log(`  - Balance LP: ${wallet1FinalBalance}`);
        console.log(`  - Kept unclaimed A: ${wallet1KeptA}`);
        console.log(`  - Kept unclaimed B: ${wallet1KeptB}`);
        console.log(`  - Index A: ${wallet1FinalIndexA} (preserves kept unclaimed)`);
        console.log(`  - Index B: ${wallet1FinalIndexB} (preserves kept unclaimed)`);
        
        getRewardUserInfo(
            wallet1,
            wallet1FinalBalance,
            16, // actual block number from contract
            0,
            0,
            249999980000, // actual earned-a from contract
            24999999980000, // actual earned-b from contract
            wallet1FinalIndexA,
            wallet1FinalIndexB,
            249999980000, // actual unclaimed-a from contract
            24999999980000, // actual unclaimed-b from contract
            deployer,
            disp
        );
        
        // Wallet2 has no LP and no rewards
        console.log(`\nWallet2 final state:`);
        console.log(`  - Balance LP: 0`);
        console.log(`  - All rewards claimed before transfer`);
        
        getRewardUserInfo(
            wallet2,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            deployer,
            disp
        );
        
        // Deployer has no LP and no rewards
        console.log(`\nDeployer final state:`);
        console.log(`  - Balance LP: 0`);
        console.log(`  - All state wiped after burning all LP`);
        
        getRewardUserInfo(
            deployer,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            deployer,
            disp
        );
        
        // Calculate final rewards accounting
        const totalDonated = DONATE_WELSH + DONATE_STREET;
        const wallet2Claimed = 749999970000 + 74999999970000; // Actual claimed amounts
        const wallet1StillUnclaimed = 249999980000 + 24999999980000; // Actual unclaimed from contract
        const totalAccountedFor = wallet2Claimed + wallet1StillUnclaimed;
        const unaccountedFor = totalDonated - totalAccountedFor;
        
        console.log("\n╔═══════════════════════════════════════════════════════════╗");
        console.log("║    REWARDS ACCOUNTING - CLAIM BEFORE RETURN TRANSFER      ║");
        console.log("╠═══════════════════════════════════════════════════════════╣");
        console.log(`║ Total Rewards Donated:                                    ║`);
        console.log(`║   WELSH (Token A):   ${DONATE_WELSH.toString().padStart(15)} (1 Trillion)     ║`);
        console.log(`║   STREET (Token B):  ${DONATE_STREET.toString().padStart(15)} (100 Trillion)  ║`);
        console.log(`║   TOTAL:             ${totalDonated.toString().padStart(15)} tokens          ║`);
        console.log("╠═══════════════════════════════════════════════════════════╣");
        console.log("║ Current Status:                                           ║");
        console.log(`║   Wallet2 claimed:   ${wallet2Claimed.toString().padStart(15)} tokens          ║`);
        console.log(`║   Wallet1 unclaimed: ${wallet1StillUnclaimed.toString().padStart(15)} tokens          ║`);
        console.log(`║   TOTAL ACCOUNTED:   ${totalAccountedFor.toString().padStart(15)} tokens          ║`);
        console.log("╠═══════════════════════════════════════════════════════════╣");
        console.log("║ 📊 ANALYSIS:                                               ║");
        
        if (unaccountedFor === 0) {
            console.log("║   ✅ All rewards accounted for!                           ║");
            console.log("║   No loss in this scenario                               ║");
        } else {
            console.log(`║   ⚠️  Unaccounted for:   ${unaccountedFor.toString().padStart(15)} tokens          ║`);
            console.log(`║   Loss percentage: ${((unaccountedFor / totalDonated) * 100).toFixed(2)}%                                ║`);
        }
        
        console.log("╠═══════════════════════════════════════════════════════════╣");
        console.log("║ 🔍 TEST MECHANICS:                                         ║");
        console.log("║ 1. All 3 users start with equal LP and rewards           ║");
        console.log("║ 2. Deployer burns → forfeits redistributed to W1 + W2    ║");
        console.log("║ 3. W1 transfers 50% to W2 → W1 forfeits 50%, keeps 50%   ║");
        console.log("║ 4. W2 receives redistribution of W1's forfeit            ║");
        console.log("║ 5. W2 CLAIMS all rewards before transferring back        ║");
        console.log("║ 6. W2 transfers 100% back to W1 with 0 unclaimed         ║");
        console.log("║ 7. W1 preserves their kept 50% unclaimed rewards         ║");
        console.log("║ 8. Result: W2 claimed their share, W1 kept their share   ║");
        console.log("╚═══════════════════════════════════════════════════════════╝");
        console.log(`\n✅ Test completed - Rewards accounting: ${totalAccountedFor.toLocaleString()} / ${totalDonated.toLocaleString()} tokens accounted for`);
    })
});