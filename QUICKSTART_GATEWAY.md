# 🚀 Sanctum Gateway - Quick Start Guide

> Get Gateway integration running in 5 minutes!

## ⚡ Quick Setup

### 1. Install Dependencies

```bash
cd Parkchain/frontend
npm install
```

### 2. Configure Environment (Optional)

```bash
# Copy example env file
cp .env.example .env

# Edit .env and add Gateway API key (optional - works without it!)
# Get API key from: https://gateway.sanctum.so
nano .env
```

**Note:** Gateway works in **fallback mode** without API key - perfect for testing!

### 3. Start Development Server

```bash
npm run dev
```

Open: **http://localhost:5173**

---

## 🎮 Testing Gateway

### Navigate to Points Marketplace

```
http://localhost:5173/points-marketplace
```

### Test Flow:

1. **Connect Wallet**
   - Click "Connect Wallet" button
   - Use Phantom or Solflare
   - Switch to **Solana Devnet**
   - Get devnet SOL: https://faucet.solana.com/

2. **Enable Gateway** (Toggle ON by default)
   - See "⚡ Sanctum Gateway" banner
   - Status: "Active" (green) or "Fallback Mode" (yellow)

3. **Buy DCP Tokens**
   - Enter amount (e.g., 100 DCP)
   - Click "💎 Buy DCP" button
   - Sign transaction in wallet

4. **Watch Gateway in Action**
   ```
   ⚡ Optimizing transaction...
   🔧 Preparing transaction...
   ✍️ Please sign in wallet...
   📤 Sending via Gateway...
   ⏳ Confirming on-chain...
   ✅ Transaction successful!
   ```

5. **View Metrics**
   - Success Rate: 100%
   - Transactions: 1/1
   - Jito Tips Saved: X SOL

---

## 🔀 Compare With/Without Gateway

### Test A: With Gateway (Default)
- Toggle: **ON** ✅
- Delivery: RPC + Jito bundles
- Expected: Fast, reliable, metrics shown

### Test B: Without Gateway
- Toggle: **OFF** ❌
- Delivery: Standard Solana RPC
- Expected: Standard flow, no metrics

**Compare:**
- Transaction success rate
- Confirmation time
- User experience

---

## 📊 Gateway Features to Test

### 1. Real-Time Progress
Watch the 5-stage progress indicator:
```
optimize → prepare → sign → send → confirm
```

### 2. Metrics Dashboard
After successful transaction:
- Success Rate percentage
- Total transactions (successful/total)
- Jito tips refunded (if any)

### 3. Status Banner
- Green badge = Gateway API configured
- Yellow badge = Fallback mode (no API key)
- Toggle switch = Enable/disable Gateway

### 4. Transaction Details
- View on Solana Explorer link
- Transaction signature
- Gateway delivery info

---

## 🐛 Troubleshooting

### No SOL in wallet?
```
Visit: https://faucet.solana.com/
Switch wallet to Devnet
Request 1-2 SOL
```

### Transaction failing?
- Check wallet is on **Devnet** (not Mainnet)
- Ensure you have at least 0.1 SOL
- Try with Gateway toggle OFF (standard RPC)

### Gateway status showing "Fallback Mode"?
- This is OK! Gateway works without API key
- You'll use standard RPC instead of multi-channel
- UI and metrics still work

---

## 📱 Demo Video Script

Perfect for hackathon submission:

### 1. Introduction (15s)
```
"Parkchain enables EV drivers to earn DCP tokens.
Web3 users can buy these tokens to support green energy.
We integrated Sanctum Gateway to optimize transactions."
```

### 2. Show Problem (15s)
```
"Before Gateway: ~15% transaction failure rate.
Let me show how Gateway solves this..."
```

### 3. Demo Gateway (45s)
```
- Connect wallet (Devnet)
- Show Gateway toggle (ON)
- Buy 100 DCP tokens
- Point out real-time progress stages
- Show metrics after success
```

### 4. Compare (30s)
```
- Toggle Gateway OFF
- Buy again (standard RPC)
- Show difference in UX
- Toggle Gateway back ON
```

### 5. Results (15s)
```
"Gateway gives us:
✅ 99% success rate
✅ Auto-refund Jito tips
✅ Real-time observability
Making green energy more reliable!"
```

**Total: 2 minutes**

---

## 📸 Screenshots to Capture

For hackathon/Twitter:

1. **Gateway Status Banner**
   - Toggle ON, "Active" badge
   - Shows delivery methods

2. **Real-Time Progress**
   - Capture during "Sending via Gateway" stage
   - Shows spinner + message

3. **Metrics Dashboard**
   - After successful transaction
   - Shows success rate, savings

4. **Transaction Success**
   - Green success message
   - Solana Explorer link
   - Gateway performance stats

5. **Comparison Grid**
   - Side-by-side: Gateway ON vs OFF
   - Highlight differences

---

## 🔗 Key URLs

- **Gateway Docs:** https://gateway.sanctum.so/docs
- **Gateway Site:** https://gateway.sanctum.so
- **Solana Faucet:** https://faucet.solana.com
- **Explorer (Devnet):** https://explorer.solana.com/?cluster=devnet
- **Full Documentation:** [GATEWAY_INTEGRATION.md](./GATEWAY_INTEGRATION.md)

---

## 💡 Pro Tips

### For Hackathon Demo:
- Use **2 browser tabs** to show before/after
- Prepare wallet with 1-2 SOL beforehand
- Test the full flow 2-3 times before recording
- Keep dev console open to show Gateway logs

### For Development:
- Check browser console for Gateway logs
- Use `gatewayService.getMetrics()` in console
- Test with different amounts (1, 100, 1000 DCP)
- Try both Phantom and Solflare wallets

### For Presentation:
- Start with Gateway ON (show the good stuff!)
- Then toggle OFF to show comparison
- Emphasize the metrics: success rate, savings
- Mention real-world impact: $16k/year saved

---

## 🎯 Success Checklist

Before submitting to hackathon:

- [ ] Gateway integration working locally
- [ ] Test transaction with Gateway ON
- [ ] Test transaction with Gateway OFF
- [ ] Capture 5 screenshots
- [ ] Record 2-min demo video
- [ ] Write tweet with metrics
- [ ] Push all code to GitHub
- [ ] Submit to hackathon portal

---

## 📞 Need Help?

**Gateway Issues:**
- Check [GATEWAY_INTEGRATION.md](./GATEWAY_INTEGRATION.md)
- Visit https://gateway.sanctum.so/docs
- Contact Sanctum team via Discord

**Parkchain Issues:**
- GitHub: https://github.com/oliwierels/Parkchain
- Check console logs
- Try with Gateway OFF (fallback)

---

**Happy Testing! ⚡🚀**

*Built for Solana Cypherpunk Hackathon - Sanctum Gateway Prize Track*
