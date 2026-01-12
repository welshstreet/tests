import { Cl } from "@stacks/transactions";
import { expect } from "vitest";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;

export function claimRewards(
    balanceLpExpected: number,
    blockLpExpected: number,
    claimedAExpected: number,
    claimedBExpected: number,
    debtAExpected: number,
    debtBExpected: number,
    globalIndexAExpected: number,
    globalIndexBExpected: number,
    indexAExpected: number,
    indexBExpected: number,
    sender: any,
    disp: boolean = false
){
    const test = simnet.callPublicFn(
        "rewards",
        "claim-rewards",
        [],
        sender
    );

    if (test.result.type === 'err') {
        const errorCode = Number((test.result as any).value.value);
        expect(test.result).toEqual(Cl.error(Cl.uint(errorCode)));
        if (disp) {
            console.log(`☑️ Claim rewards failed with error: ${errorCode}`);
        }
        return false;
    }

    expect(test.result).toEqual(
        Cl.ok(
            Cl.tuple({
                "balance-lp": Cl.uint(balanceLpExpected),
                "block-lp": Cl.uint(blockLpExpected),
                "claimed-a": Cl.uint(claimedAExpected),
                "claimed-b": Cl.uint(claimedBExpected),
                "debt-a": Cl.uint(debtAExpected),
                "debt-b": Cl.uint(debtBExpected),
                "global-index-a": Cl.uint(globalIndexAExpected),
                "global-index-b": Cl.uint(globalIndexBExpected),
                "index-a": Cl.uint(indexAExpected),
                "index-b": Cl.uint(indexBExpected),
            })
        )
    );

    if (disp && test.result.type === 'ok') {
        console.log(`✅ Claim rewards successful`);
    }
    return true;
}

export function cleanupRewards(
    cleanupAExpected: number,
    cleanupBExpected: number,
    sender: any,
    disp: boolean = false
){
    const test = simnet.callPublicFn(
        "rewards",
        "cleanup-rewards",
        [],
        sender
    );

    if (sender != deployer) {
        expect(test.result).toEqual(Cl.error(Cl.uint(801)));
        if (disp) {
            console.log(`☑️ Not contract owner: Expected ERR_NOT_CONTRACT_OWNER (801) - cleanup-rewards result:`, test.result);
        }
        return false;
    }

    if (test.result.type === 'err') {
        const errorCode = Number((test.result as any).value.value);
        expect(test.result).toEqual(Cl.error(Cl.uint(errorCode)));
        if (disp) {
            console.log(`☑️ Cleanup rewards failed with error: ${errorCode}`);
        }
        return false;
    }

    expect(test.result).toEqual(
        Cl.ok(
            Cl.tuple({
                "cleanup-a": Cl.uint(cleanupAExpected),
                "cleanup-b": Cl.uint(cleanupBExpected),
            })
        )
    );

    if (disp && test.result.type === 'ok') {
        console.log(`✅ Cleanup rewards successful`);
    }
    return true;
}

export function donateRewards(
    amountA: number,
    amountB: number,
    sender: any,
    disp: boolean = false
){
    const test = simnet.callPublicFn(
        "rewards",
        "donate-rewards",
        [Cl.uint(amountA), Cl.uint(amountB)],
        sender
    );

    if (test.result.type === 'err') {
        const errorCode = Number((test.result as any).value.value);
        expect(test.result).toEqual(Cl.error(Cl.uint(errorCode)));
        if (disp) {
            console.log(`☑️ Donate rewards failed with error: ${errorCode}`);
        }
        return false;
    }

    expect(test.result).toEqual(
        Cl.ok(
            Cl.tuple({
                "donate-a": Cl.uint(amountA),
                "donate-b": Cl.uint(amountB),
            })
        )
    );

    if (disp && test.result.type === 'ok') {
        console.log(`✅ Donate rewards successful: ${amountA} WELSH, ${amountB} STREET`);
    }
    return true;
}

export function updateEmissionRewards(
    emittedAmountExpected: number,
    globalIndexBExpected: number,
    sender: any,
    disp: boolean = false
){
    const test = simnet.callPublicFn(
        "rewards",
        "update-emission-rewards",
        [],
        sender
    );

    if (sender != deployer) {
        expect(test.result).toEqual(Cl.error(Cl.uint(801)));
        if (disp) {
            console.log(`☑️ Not contract owner: Expected ERR_NOT_CONTRACT_OWNER (801) - update-emission-rewards result:`, test.result);
        }
        return false;
    }

    if (test.result.type === 'err') {
        const errorCode = Number((test.result as any).value.value);
        expect(test.result).toEqual(Cl.error(Cl.uint(errorCode)));
        if (disp) {
            console.log(`☑️ Update emission rewards failed with error: ${errorCode}`);
        }
        return false;
    }

    expect(test.result).toEqual(
        Cl.ok(
            Cl.tuple({
                "emitted-amount": Cl.uint(emittedAmountExpected),
                "global-index-b": Cl.uint(globalIndexBExpected),
            })
        )
    );

    if (disp && test.result.type === 'ok') {
        console.log(`✅ Update emission rewards successful`);
    }
    return true;
}

export function updateRewardsA(
    amount: number,
    sender: any,
    disp: boolean = false
){
    // Handle contract principal senders
    let actualSender;
    if (typeof sender === 'object' && sender.address && sender.contractName) {
        // Contract principal
        actualSender = `${sender.address}.${sender.contractName}`;
    } else {
        // Regular principal
        actualSender = sender;
    }
    
    const test = simnet.callPublicFn(
        "rewards",
        "update-rewards-a",
        [Cl.uint(amount)],
        actualSender
    );

    // Handle error cases - check what error was returned
    if (test.result.type === 'err') {
        const errorCode = Number((test.result as any).value.value);
        
        if (errorCode === 803) {
            // ERR_NOT_AUTHORIZED - authorization check happens first
            expect(test.result).toEqual(Cl.error(Cl.uint(803)));
            if (disp) {
                console.log(`☑️ Not authorized: Expected ERR_NOT_AUTHORIZED (803) - update-rewards-a result:`, test.result);
            }
            return false;
        } else if (errorCode === 800) {
            // ERR_ZERO_AMOUNT - only possible if caller is authorized but amount is 0
            expect(test.result).toEqual(Cl.error(Cl.uint(800)));
            if (disp) {
                console.log(`☑️ Zero amount: Expected ERR_ZERO_AMOUNT (800) - update-rewards-a result:`, test.result);
            }
            return false;
        } else {
            // Any other error
            if (disp) {
                console.log(`☑️ Update rewards A failed with error: ${errorCode}`);
            }
            expect(test.result).toEqual(Cl.error(Cl.uint(errorCode)));
            return false;
        }
    }

    // Success case - function returned ok
    expect(test.result).toEqual(Cl.ok(Cl.bool(true)));

    if (disp && test.result.type === 'ok') {
        console.log(`✅ Update rewards A successful: ${amount}`);
    }
    return true;
}

export function updateRewardsB(
    amount: number,
    sender: any,
    disp: boolean = false
){
    // Handle contract principal senders
    let actualSender;
    if (typeof sender === 'object' && sender.address && sender.contractName) {
        // Contract principal
        actualSender = `${sender.address}.${sender.contractName}`;
    } else {
        // Regular principal
        actualSender = sender;
    }
    
    const test = simnet.callPublicFn(
        "rewards",
        "update-rewards-b",
        [Cl.uint(amount)],
        actualSender
    );

    // Handle error cases - check what error was returned
    if (test.result.type === 'err') {
        const errorCode = Number((test.result as any).value.value);
        
        if (errorCode === 803) {
            // ERR_NOT_AUTHORIZED - authorization check happens first
            expect(test.result).toEqual(Cl.error(Cl.uint(803)));
            if (disp) {
                console.log(`☑️ Not authorized: Expected ERR_NOT_AUTHORIZED (803) - update-rewards-b result:`, test.result);
            }
            return false;
        } else if (errorCode === 800) {
            // ERR_ZERO_AMOUNT - only possible if caller is authorized but amount is 0
            expect(test.result).toEqual(Cl.error(Cl.uint(800)));
            if (disp) {
                console.log(`☑️ Zero amount: Expected ERR_ZERO_AMOUNT (800) - update-rewards-b result:`, test.result);
            }
            return false;
        } else {
            // Any other error
            if (disp) {
                console.log(`☑️ Update rewards B failed with error: ${errorCode}`);
            }
            expect(test.result).toEqual(Cl.error(Cl.uint(errorCode)));
            return false;
        }
    }

    // Success case - function returned ok
    expect(test.result).toEqual(Cl.ok(Cl.bool(true)));

    if (disp && test.result.type === 'ok') {
        console.log(`✅ Update rewards B successful: ${amount}`);
    }
    return true;
}

export function updateUserRewards(
    userPrincipal: string | { address: string; contractName: string },
    sender: string | { address: string; contractName: string },
    disp: boolean = false
){
    // Handle contract principal for userPrincipal parameter
    let userArg;
    if (typeof userPrincipal === 'string') {
        userArg = Cl.principal(userPrincipal);
    } else {
        userArg = Cl.contractPrincipal(userPrincipal.address, userPrincipal.contractName);
    }
    
    // Handle contract principal senders
    let actualSender: string;
    if (typeof sender === 'object' && sender.address && sender.contractName) {
        // Contract principal
        actualSender = `${sender.address}.${sender.contractName}`;
    } else {
        // Regular principal
        actualSender = sender as string;
    }
    
    const test = simnet.callPublicFn(
        "rewards",
        "update-user-rewards",
        [userArg],
        actualSender
    );

    // Check if caller is not exchange contract (will fail authorization)
    if (test.result.type === 'err') {
        const errorCode = Number((test.result as any).value.value);
        if (errorCode === 803) {
            expect(test.result).toEqual(Cl.error(Cl.uint(803)));
            if (disp) {
                console.log(`☑️ Not authorized: Expected ERR_NOT_AUTHORIZED (803) - update-user-rewards result:`, test.result);
            }
            return false;
        } else {
            if (disp) {
                console.log(`☑️ Update user rewards failed with error: ${errorCode}`);
            }
            expect(test.result).toEqual(Cl.error(Cl.uint(errorCode)));
            return false;
        }
    }

    expect(test.result).toEqual(Cl.ok(Cl.bool(true)));

    if (disp && test.result.type === 'ok') {
        const displayName = typeof userPrincipal === 'string' ? userPrincipal : `${userPrincipal.address}.${userPrincipal.contractName}`;
        console.log(`✅ Update user rewards successful for user: ${displayName}`);
    }
    return true;
}

export function getCleanupRewards(
    actualAExpected: number,
    actualBExpected: number,
    claimedAExpected: number,
    claimedBExpected: number,
    distributedAExpected: number,
    distributedBExpected: number,
    outstandingAExpected: number,
    outstandingBExpected: number,
    cleanupAExpected: number,
    cleanupBExpected: number,
    sender: any,
    disp: boolean = false
) {
    const test = simnet.callReadOnlyFn("rewards", "get-cleanup-rewards", [], sender);
    const info = (test.result as any).value.value;
    const receivedActualA = Number(info['actual-a'].value);
    const receivedActualB = Number(info['actual-b'].value);
    const receivedClaimedA = Number(info['claimed-a'].value);
    const receivedClaimedB = Number(info['claimed-b'].value);
    const receivedDistributedA = Number(info['distributed-a'].value);
    const receivedDistributedB = Number(info['distributed-b'].value);
    const receivedOutstandingA = Number(info['outstanding-a'].value);
    const receivedOutstandingB = Number(info['outstanding-b'].value);
    const receivedCleanupA = Number(info['cleanup-a'].value);
    const receivedCleanupB = Number(info['cleanup-b'].value);

    // Validate all expected values
    expect(receivedActualA).toEqual(actualAExpected);
    expect(receivedActualB).toEqual(actualBExpected);
    expect(receivedClaimedA).toEqual(claimedAExpected);
    expect(receivedClaimedB).toEqual(claimedBExpected);
    expect(receivedDistributedA).toEqual(distributedAExpected);
    expect(receivedDistributedB).toEqual(distributedBExpected);
    expect(receivedOutstandingA).toEqual(outstandingAExpected);
    expect(receivedOutstandingB).toEqual(outstandingBExpected);
    expect(receivedCleanupA).toEqual(cleanupAExpected);
    expect(receivedCleanupB).toEqual(cleanupBExpected);

    const allMatch = (
        receivedActualA === actualAExpected &&
        receivedActualB === actualBExpected &&
        receivedClaimedA === claimedAExpected &&
        receivedClaimedB === claimedBExpected &&
        receivedDistributedA === distributedAExpected &&
        receivedDistributedB === distributedBExpected &&
        receivedOutstandingA === outstandingAExpected &&
        receivedOutstandingB === outstandingBExpected &&
        receivedCleanupA === cleanupAExpected &&
        receivedCleanupB === cleanupBExpected
    );

    if (disp) {
        if (allMatch) {
            console.log(`✅ getCleanupRewards Pass: All values match expected`);
        } else {
            console.log(`☑️ getCleanupRewards Fail: Values mismatch`);
        }
        // Display all values line-by-line for clarity
        console.log(`Cleanup Rewards Info:`);
        console.log(`  actual-a: ${receivedActualA}`);
        console.log(`  actual-b: ${receivedActualB}`);
        console.log(`  claimed-a: ${receivedClaimedA}`);
        console.log(`  claimed-b: ${receivedClaimedB}`);
        console.log(`  distributed-a: ${receivedDistributedA}`);
        console.log(`  distributed-b: ${receivedDistributedB}`);
        console.log(`  outstanding-a: ${receivedOutstandingA}`);
        console.log(`  outstanding-b: ${receivedOutstandingB}`);
        console.log(`  cleanup-a: ${receivedCleanupA}`);
        console.log(`  cleanup-b: ${receivedCleanupB}`);
    }

    return {
        actualA: receivedActualA,
        actualB: receivedActualB,
        claimedA: receivedClaimedA,
        claimedB: receivedClaimedB,
        distributedA: receivedDistributedA,
        distributedB: receivedDistributedB,
        outstandingA: receivedOutstandingA,
        outstandingB: receivedOutstandingB,
        cleanupA: receivedCleanupA,
        cleanupB: receivedCleanupB
    };
}

export function getRewardPoolInfo(
    globalIndexAExpected: number,     // Expected return value
    globalIndexBExpected: number,     // Expected return value
    rewardsAExpected: number,         // Expected return value
    rewardsBExpected: number,         // Expected return value
    sender: any,                      // Transaction sender
    disp: boolean = false             // Optional with default false
) {
    const test = simnet.callReadOnlyFn("rewards", "get-reward-pool-info", [], sender);
    const info = (test.result as any).value.value;
    const receivedGlobalIndexA = Number(info['global-index-a'].value);
    const receivedGlobalIndexB = Number(info['global-index-b'].value);
    const receivedRewardsA = Number(info['rewards-a'].value);
    const receivedRewardsB = Number(info['rewards-b'].value);

    // Validate all expected values
    expect(receivedGlobalIndexA).toEqual(globalIndexAExpected);
    expect(receivedGlobalIndexB).toEqual(globalIndexBExpected);
    expect(receivedRewardsA).toEqual(rewardsAExpected);
    expect(receivedRewardsB).toEqual(rewardsBExpected);

    const allMatch = (
        receivedGlobalIndexA === globalIndexAExpected &&
        receivedGlobalIndexB === globalIndexBExpected &&
        receivedRewardsA === rewardsAExpected &&
        receivedRewardsB === rewardsBExpected
    );

    if (disp) {
        if (allMatch) {
            console.log(`✅ getRewardPoolInfo Pass: All values match expected`);
        } else {
            console.log(`☑️ getRewardPoolInfo Fail: Values mismatch`);
        }
        // Display all values line-by-line for clarity
        console.log(`Reward Pool Info:`);
        console.log(`  global-index-a: ${receivedGlobalIndexA}`);
        console.log(`  global-index-b: ${receivedGlobalIndexB}`);
        console.log(`  rewards-a: ${receivedRewardsA}`);
        console.log(`  rewards-b: ${receivedRewardsB}`);
    }

    return {
        globalIndexA: receivedGlobalIndexA,
        globalIndexB: receivedGlobalIndexB,
        rewardsA: receivedRewardsA,
        rewardsB: receivedRewardsB
    };
}

export function getRewardUserInfo(
    user: any,                        // Contract input - user principal
    balanceLpExpected: number,        // Expected return value
    blockLpExpected: number,          // Expected return value
    debtAExpected: number,            // Expected return value
    debtBExpected: number,            // Expected return value
    earnedAExpected: number,          // Expected return value
    earnedBExpected: number,          // Expected return value
    indexAExpected: number,           // Expected return value
    indexBExpected: number,           // Expected return value
    unclaimedAExpected: number,       // Expected return value
    unclaimedBExpected: number,       // Expected return value
    sender: any,                      // Transaction sender
    disp: boolean = false             // Optional with default false
) {
    const test = simnet.callReadOnlyFn("rewards", "get-reward-user-info", [Cl.principal(user)], sender);
    const info = (test.result as any).value.value;
    const receivedBalanceLp = Number(info['balance-lp'].value);
    const receivedBlockLp = Number(info['block-lp'].value);
    const receivedDebtA = Number(info['debt-a'].value);
    const receivedDebtB = Number(info['debt-b'].value);
    const receivedEarnedA = Number(info['earned-a'].value);
    const receivedEarnedB = Number(info['earned-b'].value);
    const receivedIndexA = Number(info['index-a'].value);
    const receivedIndexB = Number(info['index-b'].value);
    const receivedUnclaimedA = Number(info['unclaimed-a'].value);
    const receivedUnclaimedB = Number(info['unclaimed-b'].value);

    // Validate all expected values
    expect(receivedBalanceLp).toEqual(balanceLpExpected);
    expect(receivedBlockLp).toEqual(blockLpExpected);
    expect(receivedDebtA).toEqual(debtAExpected);
    expect(receivedDebtB).toEqual(debtBExpected);
    expect(receivedEarnedA).toEqual(earnedAExpected);
    expect(receivedEarnedB).toEqual(earnedBExpected);
    expect(receivedIndexA).toEqual(indexAExpected);
    expect(receivedIndexB).toEqual(indexBExpected);
    expect(receivedUnclaimedA).toEqual(unclaimedAExpected);
    expect(receivedUnclaimedB).toEqual(unclaimedBExpected);

    const allMatch = (
        receivedBalanceLp === balanceLpExpected &&
        receivedBlockLp === blockLpExpected &&
        receivedDebtA === debtAExpected &&
        receivedDebtB === debtBExpected &&
        receivedEarnedA === earnedAExpected &&
        receivedEarnedB === earnedBExpected &&
        receivedIndexA === indexAExpected &&
        receivedIndexB === indexBExpected &&
        receivedUnclaimedA === unclaimedAExpected &&
        receivedUnclaimedB === unclaimedBExpected
    );

    if (disp) {
        if (allMatch) {
            console.log(`✅ getRewardUserInfo Pass: All values match expected for user ${user}`);
        } else {
            console.log(`☑️ getRewardUserInfo Fail: Values mismatch for user ${user}`);
        }
        // Display all values line-by-line for clarity
        console.log(`Reward User Info for ${user}:`);
        console.log(`  balance-lp: ${receivedBalanceLp}`);
        console.log(`  block-lp: ${receivedBlockLp}`);
        console.log(`  debt-a: ${receivedDebtA}`);
        console.log(`  debt-b: ${receivedDebtB}`);
        console.log(`  earned-a: ${receivedEarnedA}`);
        console.log(`  earned-b: ${receivedEarnedB}`);
        console.log(`  index-a: ${receivedIndexA}`);
        console.log(`  index-b: ${receivedIndexB}`);
        console.log(`  unclaimed-a: ${receivedUnclaimedA}`);
        console.log(`  unclaimed-b: ${receivedUnclaimedB}`);
    }

    return {
        balanceLp: receivedBalanceLp,
        blockLp: receivedBlockLp,
        debtA: receivedDebtA,
        debtB: receivedDebtB,
        earnedA: receivedEarnedA,
        earnedB: receivedEarnedB,
        indexA: receivedIndexA,
        indexB: receivedIndexB,
        unclaimedA: receivedUnclaimedA,
        unclaimedB: receivedUnclaimedB
    };
}

export function updateBurnRewards(
    user: any,
    oldBalance: number,
    sender: any,
    disp: boolean = false
) {
    const test = simnet.callPublicFn(
        "rewards",
        "update-burn-rewards",
        [Cl.principal(user.address), Cl.uint(oldBalance)],
        sender
    );

    if (sender != deployer) {
        expect(test.result).toEqual(Cl.error(Cl.uint(803))); // ERR_NOT_AUTHORIZED
        if (disp) {
            console.log(`☑️ updateBurnRewards Fail: Unauthorized sender - Expected ERR_NOT_AUTHORIZED (803)`);
        }
        return false;
    }

    if (test.result.type === 'err') {
        const errorCode = Number((test.result as any).value.value);
        if (disp) {
            console.log(`☑️ updateBurnRewards Fail: Error ${errorCode}`);
        }
        expect(test.result).toEqual(Cl.error(Cl.uint(errorCode)));
        return false;
    }

    expect(test.result).toEqual(Cl.ok(Cl.bool(true)));

    if (disp && test.result.type === 'ok') {
        console.log(`✅ updateBurnRewards Pass: User rewards cleared for complete exit`);
    }
    
    return true;
}

export function updateSenderRewards(
    sender: any,
    transferAmount: number,
    caller: any,
    disp: boolean = false
) {
    if (disp) {
        console.log(`\n=== updateSenderRewards: ${transferAmount} ===`);
        console.log(`Sender: ${sender}, Caller: ${caller}`);
    }

    const test = simnet.callPublicFn(
        "rewards",
        "update-sender-rewards",
        [
            Cl.principal(sender),
            Cl.uint(transferAmount)
        ],
        caller
    );

    if (disp) {
        console.log(`Result type: ${test.result.type}`);
    }

    // Check for authorization errors (ERR_NOT_AUTHORIZED - 803)
    if (test.result.type === 'err') {
        const errorCode = Number((test.result as any).value.value);
        if (errorCode === 803) {
            expect(test.result).toEqual(Cl.error(Cl.uint(803)));
            if (disp) {
                console.log(`☑️ Not authorized: Expected ERR_NOT_AUTHORIZED (803)`);
            }
            return false;
        } else if (errorCode === 800) {
            expect(test.result).toEqual(Cl.error(Cl.uint(800)));
            if (disp) {
                console.log(`☑️ Zero amount: Expected ERR_ZERO_AMOUNT (800)`);
            }
            return false;
        } else {
            if (disp) {
                console.log(`☑️ Update sender rewards failed with error: ${errorCode}`);
            }
            expect(test.result).toEqual(Cl.error(Cl.uint(errorCode)));
            return false;
        }
    }

    // Success case - expect (ok true)
    expect(test.result).toEqual(Cl.ok(Cl.bool(true)));
    
    if (disp && test.result.type === 'ok') {
        console.log(`✅ Update sender rewards successful for ${sender}`);
    }
    
    return true;
}

export function updateRecipientRewards(
    recipient: any,
    transferAmount: number,
    caller: any,
    disp: boolean = false
) {
    if (disp) {
        console.log(`\n=== updateRecipientRewards: ${transferAmount} to ${recipient} ===`);
        console.log(`Caller: ${caller}`);
    }

    const test = simnet.callPublicFn(
        "rewards",
        "update-recipient-rewards",
        [
            Cl.principal(recipient),
            Cl.uint(transferAmount)
        ],
        caller
    );

    if (disp) {
        console.log(`Result type: ${test.result.type}`);
    }

    // Check for authorization errors (ERR_NOT_AUTHORIZED - 803)
    if (test.result.type === 'err') {
        const errorCode = Number((test.result as any).value.value);
        if (errorCode === 803) {
            expect(test.result).toEqual(Cl.error(Cl.uint(803)));
            if (disp) {
                console.log(`☑️ Not authorized: Expected ERR_NOT_AUTHORIZED (803)`);
            }
            return false;
        } else if (errorCode === 800) {
            expect(test.result).toEqual(Cl.error(Cl.uint(800)));
            if (disp) {
                console.log(`☑️ Zero amount: Expected ERR_ZERO_AMOUNT (800)`);
            }
            return false;
        } else {
            if (disp) {
                console.log(`☑️ Update recipient rewards failed with error: ${errorCode}`);
            }
            expect(test.result).toEqual(Cl.error(Cl.uint(errorCode)));
            return false;
        }
    }

    // Success case - expect (ok true)
    expect(test.result).toEqual(Cl.ok(Cl.bool(true)));
    
    if (disp && test.result.type === 'ok') {
        console.log(`✅ Update recipient rewards successful for ${recipient}`);
    }
    
    return true;
}