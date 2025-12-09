# Smart Stripe Integration - Setup Guide

**Project:** Frith AI - Legal AI Platform  
**Date:** December 9, 2025  
**Commit:** `1182e76`

---

## 🎉 What Changed?

**BEFORE (Manual Setup):**
- ❌ Create products in Stripe dashboard
- ❌ Create prices for each tier
- ❌ Copy price IDs to environment variables
- ❌ Update env vars when prices change
- ❌ Requires 3+ environment variables

**AFTER (Smart/Dynamic):**
- ✅ **Zero Stripe dashboard setup**
- ✅ **Zero price IDs needed**
- ✅ **Only 2 environment variables**
- ✅ **Unlimited scalability**
- ✅ **Change prices in code instantly**

---

## 🚀 How It Works

### **Dynamic Price Creation**

Instead of pre-creating products in Stripe, we use Stripe's `price_data` API to create prices on-the-fly:

```typescript
// Old way (manual):
line_items: [{ price: 'price_1234abcd', quantity: 1 }]

// New way (dynamic):
line_items: [{
  price_data: {
    currency: 'usd',
    unit_amount: 4900, // $49.00 - from our database/code
    recurring: { interval: 'month' },
    product_data: {
      name: 'Frith AI Pro Plan',
      description: 'For individual legal professionals',
      metadata: { tier: 'pro' }
    }
  },
  quantity: 1
}]
```

### **Metadata-Driven Identification**

We store the tier in metadata, not price IDs:

```typescript
metadata: {
  userId: 'user_123',
  tier: 'pro',
  plan_name: 'Pro'
}
```

Then in webhooks, we read the metadata:

```typescript
const tier = subscription.metadata.tier // 'pro'
// Update user to Pro tier
```

---

## 📋 Setup Instructions

### **1. Get Stripe API Keys**

1. Go to https://dashboard.stripe.com/test/apikeys
2. Copy these 2 keys:
   - **Secret key** (starts with `sk_test_...`)
   - Create a webhook endpoint and get **Webhook secret** (starts with `whsec_...`)

### **2. Add to Vercel Environment Variables**

```env
STRIPE_SECRET_KEY=sk_test_51...
STRIPE_WEBHOOK_SECRET=whsec_...
```

**That's it!** No product IDs, no price IDs.

### **3. Setup Webhook Endpoint**

1. Go to Stripe Dashboard → Developers → Webhooks
2. Click "Add endpoint"
3. URL: `https://fri-three.vercel.app/api/stripe/webhook`
4. Select events:
   - `checkout.session.completed`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `customer.subscription.deleted`
   - `customer.subscription.updated`
5. Copy the webhook signing secret → `STRIPE_WEBHOOK_SECRET`

---

## 🎯 Pricing Configuration

All pricing is in `lib/stripe/stripe-service.ts`:

```typescript
export const PRICING_PLANS = {
  PRO: {
    name: 'Pro',
    price: 49,              // $49/month
    interval: 'month',
    description: 'For individual legal professionals',
    features: [...]
  },
  PROFESSIONAL: {
    name: 'Professional',
    price: 149,             // $149/month
    interval: 'month',
    description: 'For small to medium law firms',
    features: [...]
  },
  ENTERPRISE: {
    name: 'Enterprise',
    price: 499,             // $499/month
    interval: 'month',
    description: 'For large law firms',
    features: [...]
  }
}
```

### **To Change Pricing:**

1. Edit the `price` field in code
2. Commit and push to GitHub
3. Vercel auto-deploys
4. **Done!** New checkouts use new price instantly

### **To Add New Tier:**

```typescript
ULTIMATE: {
  name: 'Ultimate',
  price: 999,
  interval: 'month',
  description: 'For mega law firms',
  features: [
    'Everything in Enterprise',
    'White-label option',
    'Dedicated account manager'
  ]
}
```

Commit, push, deploy. **That's it!**

---

## 🧪 Testing

### **Test Checkout Flow:**

```
1. Visit: https://fri-three.vercel.app/dashboard/billing
2. Click "Upgrade" on Pro plan
3. Use test card: 4242 4242 4242 4242
4. Exp: 12/34, CVC: 123
5. Complete checkout
6. Verify:
   - Redirected to success page
   - User tier updated to 'pro'
   - Transaction recorded in database
   - Can access Pro features
```

### **Test Webhook:**

```bash
# Install Stripe CLI
stripe login

# Forward webhooks to local
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Trigger test event
stripe trigger checkout.session.completed
```

---

## 💡 Benefits

### **For Developers:**

✅ **No manual Stripe setup** - Just add 2 API keys  
✅ **Easy price updates** - Edit code, commit, deploy  
✅ **Unlimited plans** - Add as many as you want  
✅ **Version control** - Pricing history in Git  
✅ **Test mode friendly** - Works immediately  
✅ **No sync issues** - Single source of truth

### **For Business:**

✅ **Fast experimentation** - Test different price points  
✅ **A/B testing ready** - Easy to add variants  
✅ **Promotional pricing** - Use Stripe coupons  
✅ **Geographic pricing** - Can adjust by region  
✅ **No Stripe limits** - Not constrained by product limits

---

## 🔄 How Checkout Works

```
User clicks "Upgrade to Pro"
     ↓
POST /api/stripe/checkout { tier: 'PRO' }
     ↓
Get PRICING_PLANS['PRO'] from code
     ↓
Create checkout session with price_data:
  - name: "Frith AI Pro Plan"
  - price: $49 (from PRICING_PLANS)
  - recurring: monthly
  - metadata: { tier: 'pro' }
     ↓
Redirect to Stripe Checkout
     ↓
User enters payment info
     ↓
Stripe processes payment
     ↓
Webhook: checkout.session.completed
     ↓
Read metadata.tier from session
     ↓
Update user.subscriptionTier = 'pro'
     ↓
Create transaction record
     ↓
Send confirmation email (optional)
     ↓
Redirect to /dashboard/billing?success=true
```

---

## 📊 Comparison

| Feature | Manual Setup | Smart Setup |
|---------|--------------|-------------|
| **Stripe Products** | Create manually | None needed |
| **Price IDs** | Copy to env vars | None needed |
| **Environment Variables** | 5+ required | 2 required |
| **Add New Plan** | Create in Stripe + update env | Edit code only |
| **Change Price** | Create new price + update env | Edit code only |
| **Setup Time** | 15-20 minutes | 2 minutes |
| **Scalability** | Limited by manual work | Unlimited |
| **Version Control** | Env vars not versioned | Fully in Git |
| **Rollback** | Manual | Git revert |

---

## 🔐 Security

### **Price Validation:**

```typescript
// Server-side validation
const plan = PRICING_PLANS[tier]
if (!plan || plan.price === 0) {
  throw new Error('Invalid tier')
}

// Never trust client-submitted prices!
const session = await stripe.checkout.sessions.create({
  line_items: [{
    price_data: {
      unit_amount: plan.price * 100 // From server, not client
    }
  }]
})
```

### **Webhook Verification:**

```typescript
// Always verify webhook signature
const event = stripe.webhooks.constructEvent(
  body,
  signature,
  webhookSecret
)
```

---

## 🎓 Advanced Features

### **One-Time Payments:**

```typescript
LIFETIME: {
  name: 'Lifetime Access',
  price: 1999,
  interval: null, // null = one-time payment
  description: 'Pay once, use forever'
}
```

### **Annual Billing:**

```typescript
PRO_ANNUAL: {
  name: 'Pro Annual',
  price: 490, // 2 months free!
  interval: 'year',
  description: 'Save 17% with annual billing'
}
```

### **Custom Pricing:**

```typescript
// For enterprise custom quotes
async function createCustomCheckout(userId, customPrice) {
  const session = await stripe.checkout.sessions.create({
    line_items: [{
      price_data: {
        currency: 'usd',
        unit_amount: customPrice * 100,
        product_data: {
          name: 'Custom Enterprise Plan',
          metadata: { tier: 'custom', custom_price: customPrice }
        }
      }
    }]
  })
}
```

### **Bundle Pricing:**

```typescript
// Multiple products in one checkout
line_items: [
  { price_data: { /* Pro plan */ } },
  { price_data: { /* Add-on: Extra tokens */ } },
  { price_data: { /* Add-on: Priority support */ } }
]
```

---

## 🐛 Troubleshooting

### **Error: "Invalid tier"**

**Cause:** Tier name doesn't match PRICING_PLANS keys  
**Fix:** Ensure tier is 'PRO', 'PROFESSIONAL', or 'ENTERPRISE'

### **Error: "Webhook signature verification failed"**

**Cause:** Wrong webhook secret or modified payload  
**Fix:** 
1. Check `STRIPE_WEBHOOK_SECRET` in Vercel
2. Verify raw body parsing enabled
3. Use correct webhook endpoint URL

### **Subscription not updating**

**Cause:** Webhook not receiving events  
**Fix:**
1. Check webhook endpoint in Stripe dashboard
2. Verify URL is correct
3. Check webhook logs for errors
4. Ensure events are selected

### **Test card not working**

**Cause:** Using live keys instead of test keys  
**Fix:** Ensure using `sk_test_` not `sk_live_`

---

## 📝 Migration Notes

### **If You Have Existing Stripe Products:**

Don't delete them! They'll continue working. The smart system only applies to new checkouts.

### **To Migrate Existing Subscriptions:**

1. Current subscriptions keep using old prices
2. New subscriptions use dynamic pricing
3. On subscription renewal, can migrate to dynamic
4. Or let them naturally expire and resubscribe

---

## 🚀 Deployment Checklist

- [ ] Remove old price ID environment variables from Vercel
- [ ] Add STRIPE_SECRET_KEY to Vercel
- [ ] Add STRIPE_WEBHOOK_SECRET to Vercel
- [ ] Setup webhook endpoint in Stripe dashboard
- [ ] Test checkout with test card
- [ ] Verify webhook receives events
- [ ] Confirm subscription tier updates
- [ ] Check transaction records created
- [ ] Test upgrade/downgrade flow
- [ ] Test subscription cancellation

---

## 📖 Resources

**Stripe Docs:**
- Dynamic Pricing: https://stripe.com/docs/api/checkout/sessions#create_checkout_session-line_items-price_data
- Webhooks: https://stripe.com/docs/webhooks
- Test Cards: https://stripe.com/docs/testing

**Our Docs:**
- Phase 1.4 Complete: `prod/PHASE-1.4-COMPLETE.md`
- Vercel Setup: `prod/VERCEL-SETUP-GUIDE.md`

---

## ✅ Summary

**Old Setup:** Create Stripe products → Get price IDs → Add to env vars → Deploy  
**New Setup:** Add 2 API keys → Deploy → **Done!**

**To change pricing:** Edit PRICING_PLANS → Commit → Push → **Done!**

**No Stripe dashboard setup required. Ever.** 🎉

---

© 2025 Frith AI. All rights reserved.
