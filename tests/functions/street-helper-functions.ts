import { Cl } from "@stacks/transactions";
import { expect } from "vitest";
import { MINT_CAP } from "../vitestconfig";
import { getTotalSupply } from "./shared-read-only-helper-functions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;

export function emissionMint(
  amountExpected: number,
  blockExpected: number,
  epochExpected: number,
  totalSupplyLpExpected: number,
  sender: any,
  disp: boolean = false
  ){
  const creditSupply = getTotalSupply(totalSupplyLpExpected, 'credit', sender, false);
  const test = simnet.callPublicFn(
    "street",
    "emission-mint",
    [],
    sender
  );
  if (sender != deployer) {
    expect(test.result).toEqual(Cl.error(Cl.uint(901)));
    if (disp) {
      console.log(`☑️ Unauthorized sender: Expected ERR_NOT_CONTRACT_OWNER (901)`);
    }
    return 0;
  }
  if (creditSupply <= 0) {
    expect(test.result).toEqual(Cl.error(Cl.uint(906)));
    if (disp) {
      console.log(`☑️ No liquidity: Expected ERR_NO_LIQUIDITY (906)`);
    }
    return 0;
  }
  if (test.result.type === 'err') {
    const errorCode = Number((test.result as any).value.value);
    if (disp) {
      console.log(`☑️ Emission mint failed with error: ${errorCode}`);
    }
    expect(test.result).toEqual(Cl.error(Cl.uint(errorCode)));
    return 0;
  }
  expect(test.result).toEqual(
    Cl.ok(
      Cl.tuple({
        "amount": Cl.uint(amountExpected),
        "block": Cl.uint(blockExpected),
        "epoch": Cl.uint(epochExpected),
      })
    )
  );
  if (disp) {
    console.log(`✅ Emission mint successful: ${amountExpected}`);
  }
  return amountExpected;
}

export function mineBurnBlock(
  blockExpected: number,
  disp: boolean = false
  ){
  const test = simnet.mineEmptyBurnBlock();

  if (test === blockExpected) {
    expect(test).toEqual(blockExpected);
    if (disp) {
      console.log(`✅ Mine burn block successful: Expected ${blockExpected}, Received ${test}`);
    }
  } else {
    expect(test).not.toEqual(blockExpected);
    if (disp) {
      console.log(`☑️ Mine burn block failed: Expected ${blockExpected}, Received ${test}`);
    }
  }
  return test;
}

export function setKillSwitch(
  sender: any,
  disp: boolean = false
) {
  const test = simnet.callPublicFn(
    "street",
    "set-kill-switch",
    [],
    sender
  );
  expect(test.result).toEqual(
    Cl.ok(
      Cl.tuple({
        "kill-switch": Cl.bool(true),
      })
    )
  );
  if (disp) {
    console.log("flipKillSwitch result:");
    console.dir(test.result, { depth: null });
  }
  return test.result;
}

export function streetMint(
  amountExpected: number,
  blockExpected: number,
  epochExpected: number,
  streetMintedExpected: number,
  sender: any,
  disp: boolean = false
  ){
  const test = simnet.callPublicFn(
    "street",
    "street-mint",
    [Cl.uint(amountExpected)],
    sender
  );
  if (amountExpected <= 0) {
    expect(test.result).toEqual(Cl.error(Cl.uint(900)));
    if (disp) {
      console.log(`☑️ Zero amount: Expected ERR_ZERO_AMOUNT (900) - street-mint result:`, test.result);
    }
    return 0;
  }
  if (sender != deployer) {
    expect(test.result).toEqual(Cl.error(Cl.uint(901)));
    if (disp) {
      console.log(`☑️ Unauthorized sender: Expected ERR_NOT_CONTRACT_OWNER (901) - street-mint result:`, test.result);
    }
    return 0;
  }

  const streetMintedReceived = getStreetMinted(streetMintedExpected, sender, false);
  if (streetMintedReceived + amountExpected > MINT_CAP) {
    expect(test.result).toEqual(Cl.error(Cl.uint(905)));
    if (disp) {
      console.log(`☑️ Exceeds street mint cap: Expected ERR_EXCEEDS_MINT_CAP (905) - street-mint result:`, test.result);
    }
    return 0;
  }
  expect(test.result).toEqual(
    Cl.ok(
      Cl.tuple({
        "amount": Cl.uint(amountExpected),
        "block": Cl.uint(blockExpected),
        "epoch": Cl.uint(epochExpected),
      })
    )
  );
  if (disp && test.result.type === 'ok') {
    console.log(`✅ Street mint successful: ${amountExpected}`);
    const resultValue = (test.result as any).value;
    console.log("street-mint result:", resultValue);
  }
  return Number(amountExpected);
}

export function getCurrentEpoch(
  epochExpected: number,
  sender: any,
  disp: boolean = false
  ){
  const test = simnet.callReadOnlyFn(
    "street",
    "get-current-epoch",
    [],
    sender);
  expect(test.result).toEqual(Cl.ok(Cl.uint(epochExpected)));

  if (test.result.type === 'ok') {
    const epochValue = Number((test.result as any).value.value);
    if (disp) {
      console.log(`✅ getCurrentEpoch Pass: Expected ${epochExpected}, Received ${epochValue}`);
    }
    return epochValue;
  } else {
    if (disp) {
      console.log(`☑️ getCurrentEpoch Fail: Expected ${epochExpected}, Received error`);
    }
  }
  return 0;
}

export function getLastMintBlock(
  blockExpected: number,
  sender: any,
  disp: boolean = false
  ){
  const test = simnet.callReadOnlyFn(
    "street",
    "get-last-mint-block",
    [],
    sender);
  expect(test.result).toEqual(Cl.ok(Cl.uint(blockExpected)));

  if (test.result.type === 'ok') {
    const blockValue = Number((test.result as any).value.value);
    if (disp) {
      console.log(`✅ getLastMintBlock Pass: Expected ${blockExpected}, Received ${blockValue}`);
    }
    return blockValue;
  } else {
    if (disp) {
      console.log(`☑️ getLastMintBlock Fail: Expected ${blockExpected}, Received error`);
    }
  }
  return 0;
}

export function getKillSwitch(
  expected: boolean,
  sender: any,
  disp: boolean = false
) {
  const test = simnet.callReadOnlyFn(
    "street",
    "get-kill-switch",
    [],
    sender
  );
  expect(test.result).toEqual(Cl.ok(Cl.bool(expected)));
  if (disp) {
    console.log("getKillSwitch result:", test.result);
  }
  return test.result;
}

export function getStreetMinted(
  streetMintedExpected: number,
  sender: any,
  disp: boolean = false
  ){
  const test = simnet.callReadOnlyFn(
    "street",
    "get-street-minted",
    [],
    sender);
  expect(test.result).toEqual(Cl.ok(Cl.uint(streetMintedExpected)));

  if (test.result.type === 'ok') {
    const streetMintedValue = Number((test.result as any).value.value);
    if (disp) {
      console.log(`get-street-minted: Expected ${streetMintedExpected}, Received ${streetMintedValue}`);
    }
    return streetMintedValue;
  }
  return 0;
}
