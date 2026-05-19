# ArcSplit — Crypto Bill Splitting

Toss/KakaoPay-style bill splitting dApp on Arc blockchain (USDC native gas).

**Live**: [arc-pay.vercel.app](https://arc-pay.vercel.app)
**Contract**: `0x1da6091dcd4572ee686e8756addd6c2b5145398b` (Arc Testnet)

## x402 Paid API — AI Receipt Scanner

External AI agents can scan receipts via the x402 nanopayment protocol.

**Endpoint**: `POST https://arc-pay.vercel.app/api/parse-receipt-paid`
**Price**: $0.02 per call (USDC via x402)
**Network**: Arc Testnet (`eip155:5042002`)

### Discovery (no payment needed)

```
GET /api/parse-receipt-paid
```

Returns service info, pricing, and usage instructions.

### Usage

```
POST /api/parse-receipt-paid
Content-Type: application/json
X-PAYMENT: <x402 payment payload>

{
  "image": "data:image/jpeg;base64,..."
}
```

### Response

```json
{
  "title": "Store Name",
  "items": [{"name": "Coffee", "price": 5500}],
  "total": 5500,
  "currency": "KRW",
  "_payment": {
    "protocol": "x402",
    "price": "$0.02",
    "payer": "0x...",
    "network": "eip155:5042002",
    "transaction": "0x..."
  }
}
```

### For AI Agents (Claude Code, Cursor, etc.)

This endpoint is x402-compatible. Agents with a Circle Agent Wallet can call it directly — the x402 client SDK handles payment automatically.
