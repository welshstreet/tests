// all constants are micro units.  comments are in natural units.
export const MINT_AMOUNT = 1_000_000_000_000_000 // 1 billion natural units
export const MINT_CAP = 5_000_000_000_000_000    // 5 billion natural units
export const TOTAL_SUPPLY_STREET = 10_000_000_000_000_000 // 10 billion natural units
export const TOTAL_SUPPLY_WELSH = 10_000_000_000_000_000 // 10 billion natural units
export const RATIO = 100; // 1:100
export const DECIMALS = 1000000; // 6 decimals
export const PRECISION = 1000000000; // 9 decimals

export const DONATE_WELSH = 100_000_000_000; // 100,000 natural units
export const DONATE_STREET = DONATE_WELSH * RATIO; // 100,000,000 natural units (1:100 ratio)

export const EMISSION_AMOUNT_KILL_SWITCH_TEST = 1_000_000_000_000_000 // 1 billion natural units
export const EMISSION_AMOUNT = 10_000_000_000 // 
export const EMISSION_EPOCHS= 10;

export const FEE_BASIS = 10000; // 100% = 10000, 1% = 100, 0.01% = 1

export const INITIAL_WELSH = 1_000_000_000_000; // 1,000,000 natural units
export const INITIAL_STREET = INITIAL_WELSH * RATIO; //100,000,000 natural units
export const INITIAL_LP = 0;

export const LOCK_WELSH = INITIAL_WELSH

export const PROVIDE_WELSH = 1_000_000_000_000; // 1,000,000 natural units

export const SWAP_WELSH = 100_000_000 // 100 natural units
export const SWAP_STREET = SWAP_WELSH * RATIO;

export const TRANSFER_WELSH = INITIAL_WELSH * 2; // 2,000,000 natural units
export const TRANSFER_STREET = INITIAL_STREET * 2;

export const CONTRIBUTE_WELSH = INITIAL_WELSH; // 1,000,000 natural units

export const FEE = 100 // basis points, so 1%
export const REV = 100 // basis points, so 1%
export const TAX = 100 // basis points, so 1%

export const disp = false;
