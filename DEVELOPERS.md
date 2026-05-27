# Guardianía RMZ Developer Notes

Guardianía RMZ is the first public live proof that RMZ can work as an on-chain access key for xolosArmy Network.

The app uses `@xolosarmy/tonalli-core` as the domain boundary and a local `ChronikAdapter` as the eCash Mainnet implementation. The verification logic must stay adapter-driven: UI code asks whether an address owns the required token, while chain-specific details stay outside the React flow.

## Current Stack

- Frontend: React + Vite
- Domain package: `@xolosarmy/tonalli-core` v0.1.0
- Chain adapter: `src/lib/chronikAdapter.ts`
- Indexer: Chronik
- Network: eCash Mainnet
- RMZ token ID: `c923bd0f09c630c5e9980cf518c8d34b6353802a3cb7c3f34fa7cc85c9305908`

## BlockchainAdapter Pattern

`@xolosarmy/tonalli-core` exposes the `BlockchainAdapter` contract used by Guardianía. The important boundary is:

```ts
async getTokenBalance(address: string, tokenId: string): Promise<TokenBalance | null>
```

The app should depend on this contract, not directly on Chronik. That keeps access verification portable:

- Chronik can be replaced or mirrored without rewriting the UI.
- Tests can use a fake adapter with deterministic balances.
- Future modules can reuse the same access model for other token-gated surfaces.
- Chain errors can degrade to "no verified balance" without leaking provider complexity into product code.

## ChronikAdapter Responsibilities

`ChronikAdapter` translates Chronik UTXO responses into the small shape expected by `tonalli-core`.

It currently:

- Calls `chronik.address(address).utxos()`.
- Handles Chronik responses shaped as direct arrays, `{ scriptUtxos }`, or `{ utxos }`.
- Reads token IDs from `utxo.token.tokenId` or `utxo.slpMeta.tokenId`.
- Reads token amounts from `utxo.token.atoms`, `utxo.token.amount`, or `utxo.slpToken.amount`.
- Sums matching token amounts with `BigInt`.
- Returns `null` when the address has no RMZ balance or when Chronik cannot be queried.

## Lessons Learned

Chronik response shapes can vary by client version and endpoint behavior. The adapter should normalize response structures before applying access rules.

Token amount fields may arrive as strings or `bigint` values. Keep arithmetic in `BigInt` and serialize at the adapter boundary.

Do not treat a missing amount the same as a zero balance. The adapter should only sum a UTXO when the token ID matches and the amount field exists.

Provider failures are not the same as failed ownership. Guardianía currently returns `null` on Chronik errors so the UI can deny verification safely without changing access logic.

The RMZ token ID must remain explicit and auditable. Avoid hiding it behind opaque configuration when documenting public proofs.

## Development Rules

- Do not place Chronik-specific parsing inside React components.
- Do not change Guardianía verification logic while editing documentation or deployment config.
- Keep adapter return values compatible with `@xolosarmy/tonalli-core`.
- Prefer fake `BlockchainAdapter` implementations for unit tests over live Chronik calls.
- Treat eCash Mainnet as the production source of truth for RMZ access.

## Basic Checks

Run these before publishing changes:

```bash
npm run lint
npm run build
```
