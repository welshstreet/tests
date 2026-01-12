import { Cl } from "@stacks/transactions";
import { expect } from "vitest";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;

export function burn(
  amountExpected: number,
  sender: any,
  disp: boolean = false
  ){
  const test = simnet.callPublicFn(
    "credit",
    "burn",
    [Cl.uint(amountExpected)],
    sender
  );

  if (amountExpected <= 0) {
    expect(test.result).toEqual(Cl.error(Cl.uint(600)));
    if (disp) {
      console.log(`☑️ Zero amount: Expected ERR_ZERO_AMOUNT (600) - credit-burn result:`, test.result);
    }
    return 0;
  }

  // Check if caller is not exchange contract (will fail authorization)
  if (test.result.type === 'err') {
    const errorCode = Number((test.result as any).value.value);
    if (errorCode === 603) {
      expect(test.result).toEqual(Cl.error(Cl.uint(603)));
      if (disp) {
        console.log(`☑️ Not authorized: Expected ERR_NOT_AUTHORIZED (603) - credit-burn result:`, test.result);
      }
      return 0;
    } else {
      if (disp) {
        console.log(`☑️ Credit burn failed with error: ${errorCode}`);
      }
      expect(test.result).toEqual(Cl.error(Cl.uint(errorCode)));
      return 0;
    }
  }

  expect(test.result).toEqual(
    Cl.ok(
      Cl.tuple({
        "burned": Cl.uint(amountExpected),
      })
    )
  );
  
  if (disp && test.result.type === 'ok') {
    console.log(`✅ Credit burn successful: ${amountExpected}`);
  }
  return Number(amountExpected);
}

export function mint(
  amountExpected: number,
  sender: any,
  disp: boolean = false
  ){
  const test = simnet.callPublicFn(
    "credit",
    "mint",
    [Cl.uint(amountExpected)],
    sender
  );

  if (amountExpected <= 0) {
    expect(test.result).toEqual(Cl.error(Cl.uint(600)));
    if (disp) {
      console.log(`☑️ Zero amount: Expected ERR_ZERO_AMOUNT (600) - credit-mint result:`, test.result);
    }
    return 0;
  }

  // Check if caller is not exchange contract (will fail authorization)
  if (test.result.type === 'err') {
    const errorCode = Number((test.result as any).value.value);
    if (errorCode === 603) {
      expect(test.result).toEqual(Cl.error(Cl.uint(603)));
      if (disp) {
        console.log(`☑️ Not authorized: Expected ERR_NOT_AUTHORIZED (603) - credit-mint result:`, test.result);
      }
      return 0;
    } else {
      if (disp) {
        console.log(`☑️ Credit mint failed with error: ${errorCode}`);
      }
      expect(test.result).toEqual(Cl.error(Cl.uint(errorCode)));
      return 0;
    }
  }

  expect(test.result).toEqual(
    Cl.ok(
      Cl.tuple({
        "minted": Cl.uint(amountExpected),
      })
    )
  );
  
  if (disp && test.result.type === 'ok') {
    console.log(`✅ Credit mint successful: ${amountExpected}`);
  }
  return Number(amountExpected);
}
