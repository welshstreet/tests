import { describe, it } from "vitest";
import { setupInitialLiquidity, setupExchangeLiquidity } from "./functions/setup-helper-functions";
import { disp, INITIAL_WELSH, INITIAL_STREET } from "./vitestconfig"
import { getExchangeInfo, provideLiquidity, removeLiquidity, provideInitialLiquidity } from "./functions/exchange-helper-functions";
import { getBalance, getTotalSupply } from "./functions/shared-read-only-helper-functions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet1 = accounts.get("wallet_1")!;
const wallet2 = accounts.get("wallet_2")!;

describe("=== PROVIDE LIQUIDITY TESTS ===", () => {
    it("=== FIXED: Locked Funds Properly Accounted During Re-initialization ===", () => {
        // TEST SUMMARY:
        // This test validates the fix for provide-initial-liquidity
        // STEP 1: Setup exchange liquidity (deployer, wallet1, wallet2 all have LP)
        // STEP 2: All participants remove their liquidity (1% tax locks funds)
        // STEP 3: deployer calls provideInitialLiquidity with SAME amounts
        // STEP 4: FIX VERIFIED: Re-initialization uses geometric mean, locked funds accounted in reserves
        //
        // SOLUTION: Always use sqrt(amount-a * amount-b) when total-supply-lp = 0
        //           Set reserves to (amount + locked) so avail = amount provided
        
        // STEP 1: Setup exchange liquidity
        const setup = setupExchangeLiquidity(disp);
        
        if (disp) {
            console.log("\n=== STEP 1 COMPLETE: Initial Setup ===");
            console.log(`Total LP supply: ${setup.totalLpSupply}`);
            console.log(`Reserve A: ${setup.reserveAExpected}`);
            console.log(`Reserve B: ${setup.reserveBExpected}`);
            console.log(`Each participant has: ${setup.totalLpSupply / 3} LP`);
        }
        
        // Verify total LP supply after setup
        getTotalSupply(setup.totalLpSupply, "credit", deployer, disp);
        
        // Query actual exchange state to get precise values
        const exchangeInfo = getExchangeInfo(
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
            false
        );
        
        // STEP 2: All participants remove their liquidity
        const lpPerParticipant = Number(BigInt(setup.totalLpSupply) / BigInt(3)); // Each of 3 participants has equal share
        
        // Calculate expected amounts from remove-liquidity using actual contract values
        // Use BigInt to avoid precision loss with large numbers
        // Contract applies 1% tax: user receives 99% of proportional share
        const removeA = Number((BigInt(lpPerParticipant) * BigInt(exchangeInfo.availA)) / BigInt(setup.totalLpSupply));
        const removeB = Number((BigInt(lpPerParticipant) * BigInt(exchangeInfo.availB)) / BigInt(setup.totalLpSupply));
        const taxA = Number((BigInt(removeA) * BigInt(100)) / BigInt(10000)); // 1% tax
        const taxB = Number((BigInt(removeB) * BigInt(100)) / BigInt(10000)); // 1% tax
        const userA = removeA - taxA;
        const userB = removeB - taxB;
        
        if (disp) {
            console.log("\n=== STEP 2: Removing All Liquidity (Tax Creates Locked Funds) ===");
            console.log(`Each participant removes: ${lpPerParticipant} LP`);
            console.log(`Tax per removal: ${taxA} WELSH, ${taxB} STREET (1% of removed amount)`);
            console.log(`Expected to receive per user: ${userA} WELSH, ${userB} STREET (after 1% tax)`);
            console.log(`⚠️  These taxes will be LOCKED and persist after all LP is removed`);
        }
        
        // deployer removes liquidity
        removeLiquidity(lpPerParticipant, lpPerParticipant, taxA, taxB, userA, userB, deployer, disp);
        
        // wallet1 removes liquidity
        removeLiquidity(lpPerParticipant, lpPerParticipant, taxA, taxB, userA, userB, wallet1, disp);
        
        // wallet2 removes liquidity
        removeLiquidity(lpPerParticipant, lpPerParticipant, taxA, taxB, userA, userB, wallet2, disp);
        
        // Verify LP supply is now 0
        getTotalSupply(0, "credit", deployer, disp);
        
        // STEP 3: deployer provides initial liquidity again
        // Note: After removing all liquidity, locked funds from taxes remain
        // The contract will use ratio-based LP calculation based on these reserves
        const amountA = INITIAL_WELSH;
        const amountB = INITIAL_STREET;
        const addedAExpected = amountA;
        const addedBExpected = amountB;
        
        // After all removals, locked funds equal total tax collected from 3 participants
        const remainingLockedA = 3 * taxA;
        const remainingLockedB = 3 * taxB;
        
        if (disp) {
            console.log("\n=== STEP 2 COMPLETE: All Liquidity Removed ===");
            console.log(`Total LP supply: 0`);
            console.log(`⚠️  But locked funds persist: ${remainingLockedA} WELSH + ${remainingLockedB} STREET`);
        }
        
        // LP calculation now uses geometric mean (sqrt) regardless of locked funds
        // LP = sqrt(amount-a * amount-b)
        const mintedLpExpected = Math.floor(Math.sqrt(amountA * amountB));
        
        if (disp) {
            console.log("\n=== STEP 3: Pool Re-initialization (FIXED) ===");
            console.log(`Deployer provides: ${amountA} WELSH, ${amountB} STREET (SAME as initial amounts)`);
            console.log(`Existing locked funds: ${remainingLockedA} WELSH, ${remainingLockedB} STREET`);
            console.log(`\n🔍 LP Calculation Details:`);
            console.log(`  Formula: sqrt(amount-a × amount-b)`);
            console.log(`  LP = sqrt(${amountA} × ${amountB}) = ${mintedLpExpected}`);
            console.log(`  ✅ Locked funds do NOT affect LP calculation`);
        }
        
        provideInitialLiquidity(
            amountA,
            amountB,
            addedAExpected,
            addedBExpected,
            mintedLpExpected,
            deployer,
            disp
        );
        
        // Verify LP supply after re-initialization
        getTotalSupply(mintedLpExpected, "credit", deployer, disp);
        
        // After adding liquidity with the fix:
        // - Reserves are SET to: amount-provided + existing-locked
        // - Locked funds remain unchanged
        // - Available liquidity: avail = reserve - locked = (amount + locked) - locked = amount
        const expectedReserveA = amountA + remainingLockedA;
        const expectedReserveB = amountB + remainingLockedB;
        const expectedAvailA = amountA; // avail = (amount + locked) - locked = amount
        const expectedAvailB = amountB;
        
        getExchangeInfo(
            expectedAvailA,         // availA = amount provided (locked funds cancel out)
            expectedAvailB,         // availB = amount provided
            100,                    // fee
            remainingLockedA,       // lockedA (unchanged, persists from removal taxes)
            remainingLockedB,       // lockedB (unchanged, persists from removal taxes)
            expectedReserveA,       // reserveA = amount-a + locked-a
            expectedReserveB,       // reserveB = amount-b + locked-b
            100,                    // revenue
            100,                    // tax
            deployer,
            disp
        );
        
        // STEP 4: Validate the fix works correctly
        if (disp) {
            const initialLpPerParticipant = setup.totalLpSupply / 3;
            
            console.log("\n=== STEP 4: FIX VALIDATION ===");
            console.log(`\n🔵 First Initial Liquidity (Step 1 - Fresh Pool):`);
            console.log(`  Input: ${INITIAL_WELSH} WELSH, ${INITIAL_STREET} STREET`);
            console.log(`  LP Minted: ${initialLpPerParticipant} (per participant)`);
            console.log(`  Formula: sqrt(amount-a * amount-b)`);
            console.log(`\n🟢 Second Initial Liquidity (Step 3 - After Full Removal, FIXED):`);
            console.log(`  Input: ${amountA} WELSH, ${amountB} STREET (SAME AMOUNTS)`);
            console.log(`  LP Minted: ${mintedLpExpected} ✅`);
            console.log(`  Formula: sqrt(amount-a * amount-b) - same formula!`);
            console.log(`  Locked funds: ${remainingLockedA} WELSH, ${remainingLockedB} STREET`);
            console.log(`\n✅ FIX CONFIRMED:`);
            console.log(`  Same liquidity input: ${amountA} WELSH + ${amountB} STREET`);
            console.log(`  Initial LP:      ${initialLpPerParticipant}`);
            console.log(`  Re-init LP:      ${mintedLpExpected}`);
            console.log(`  Result:          SAME LP tokens minted! ✅`);
            console.log(`\n📊 How The Fix Works:`);
            console.log(`  • LP calculation: Always uses sqrt(amount-a × amount-b) when total-supply = 0`);
            console.log(`  • Locked funds: Persist but don't affect LP calculation`);
            console.log(`  • Reserves: Set to (amount-provided + locked-existing)`);
            console.log(`  • Available: avail = reserve - locked = amount-provided`);
            console.log(`  • Result: Fair LP minting, locked funds properly accounted`);
            console.log(`\n💡 Economic Impact:`);
            console.log(`  • Pool re-initialization now economically fair ✅`);
            console.log(`  • Historical locked funds don't dilute new LPs ✅`);
            console.log(`  • Locked funds remain available for future rewards distribution ✅`);
        }

        // STEP 5: Check deployer LP balance
        const deployerLpBalance = getBalance(
            mintedLpExpected,
            "credit",
            deployer,
            deployer,
            disp
        );
    });
})