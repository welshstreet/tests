# Welsh Street Contracts

A novel decentralized exchange (DEX) to support $STREET, the world's first dedicated _meme rewards token_, built on Stacks blockchain. The DEX enables swaps between Welsh Corgi Coin (WELSH) and Street Token (STREET), liquidity provisioning, and a dedicated emission and rewards system for liquidity providers.

## Core Contracts

### [`credit.clar`](contracts/credit.clar)

- **LP Tokens**: Manages liquidity provider (LP) token issuance and tracking
- CRED tokens represent proportional ownership of liquidity pools
- Handles minting, burning, and balance management for LP positions

### [`exchange.clar`](contracts/exchange.clar)

- **Core DEX**: Automated Market Maker (AMM) for WELSH/STREET trading
- Supports liquidity provision, removal with anti-whale provisions, and token swaps
- Implements slippage protection and fee collection (0.5% per side)
- Initial liquidity ratio: 1 WELSH : 100 STREET for testing.

### [`genesis.clar`](contracts/genesis.clar)

- **Liquidity Generation Event**
- Facilitates the transfer of WELSH to the genesis-address
- Seed round to raise funds for the initial liquidity pool
- 1,000,000,000 (10% of total supply) $STREET tokens distributed to participants
- Initial liquidity burned by deployer over time to insure fair distribution of initial liquidity

### [`rewards.clar`](contracts/rewards.clar)

- **Rewards Distribution**: Distributes trading fees and emissions to LP token holders
- Tracks reward debt and accumulates rewards per share for fair distribution
- Supports claiming of both WELSH and STREET token rewards
- Handles pending rewards when no LP tokens existcd ..

### [`street.clar`](contracts/street.clar)

- **STREET Token**: Secondary fungible token (10B total supply)
- Features emission-based minting with epochs and community mint cap (4B)
- Automatic emissions every block interval for rewards distribution

### [`welshcorgicoin.clar`](contracts/welshcorgicoin.clar)

- **WELSH Token**: Main fungible token (10B total supply)
- A replica of the `welshcorgicoin.clar` for testing and development purposes.
- Implements SIP-010 standard with transfer, balance, and metadata functions
- Pre-minted supply allocated to contract creator and distributed to community through CTO

## Key Features

- **AMM Trading**: Constant product formula (x*y=k) with fee integration
- **Liquidity Mining**: LP token holders earn trading fees from both tokens
- **Emission Rewards**: STREET token emissions distributed to liquidity providers
- **Tax Mechanism**: 10% tax on liquidity removal, tokens are burned
- **Slippage Protection**: Configurable slippage limits for trades

## Architecture

The contracts form an integrated DeFi ecosystem where:
- Users provide WELSH/STREET liquidity and receive CRED LP tokens
- Trading fees and STREET emissions accumulate in the rewards contract
- LP token holders can claim proportional rewards at any time
- The system maintains token reserves and reward distributions automatically

