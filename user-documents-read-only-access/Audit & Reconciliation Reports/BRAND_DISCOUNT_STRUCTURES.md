# BRAND DISCOUNT & MARGIN ARCHITECTURE GUIDE
**SKIL LIFESTYLE LLP &mdash; Complete Dealership Pricing, Discount & Margin Specifications**

*Last Updated: 21-11-2026*

---

## 1. Executive Summary & Brand Overview

SKIL Lifestyle LLP operates distribution across three footwear manufacturing brands, each operating on a distinct commercial pricing and discount model:

```
                            SKIL LIFESTYLE LLP
                                    │
       ┌────────────────────────────┼────────────────────────────┐
       ▼                            ▼                            ▼
  AJANTA SHOES               XPANIA FOOTCARE             CUBIX FOOTCARE
  (Contractual Primary +     (Tier-Based Fixed Rate:     (High-Margin Footwear:
   Backend Schemes Matrix)    38%, 40%, 42% Margins)      58% Inward, 42% Outward)
```

---

## 2. Cubix Footcare &mdash; Discount & Margin Structure

### 2.1 Inward Purchase Structure (Received from Supplier)
* **Supplier**: Cubix Footcare, Kozhikode, Kerala (GSTIN: `32AANFC7817J1Z8`).
* **Basic Purchase Discount**: **`58.05%`** average discount from MRP before GST.
  $$\text{Purchase Basic Rate} \approx \text{MRP} \times (1 - 0.5805) = \text{MRP} \times 0.4195$$
* **Landed Purchase Discount (with 5% IGST)**: **`55.95%`** discount from MRP.
  $$\text{Landed Cost} = \text{Basic Rate} \times 1.05 = \text{MRP} \times 0.4405 \implies \mathbf{55.95\% \text{ Net Landed Discount}}$$

### 2.2 Outward Sales Structure (Billed to Retailers e.g. Famous Footwear)
* **Standard Wholesale Discount**: **`42.00%`** gross discount from MRP.
* **Pricing Formula**:
  $$\text{Target Landed Price to Customer (incl. 5% GST)} = \text{MRP} \times (1 - 0.42) = \text{MRP} \times 0.58$$
  $$\text{Billed Taxable Rate in Tally} = \frac{\text{Target Landed Price}}{1.05} = \frac{\text{MRP} \times 0.58}{1.05}$$
  *(This produces exact rounded rupee landed prices like ₹185, ₹191, ₹197, ₹220, ₹226, ₹249, ₹266 per pair).*

### 2.3 Customer Cash Discount (CD) Standard
* **Prompt Settlement Discount**: **5.00% on Taxable Value** (deducted upon prompt payment).
* **Net Effective Customer Discount**:
  * Before GST: **47.48%** net discount from MRP.
  * After GST (Net Cash): **44.72%** net landed discount from MRP.

### 2.4 SKIL Trading Margins on Cubix Footcare
* **Gross Markup on Cost**: **`+31.76%`**
* **Gross Margin on Sales**: **`24.11%`**
* **Net Retained Margin (After allowing 5% CD)**: **`19.11%`** net profit on turnover.

---

## 3. Xpania Footcare LLP &mdash; Tier-Based Discount Architecture

### 3.1 Customer Pricing Tiers
Xpania footwear is billed on a structured tier system based on customer volume and partnership history:

| Customer Tier | Qualifying Accounts | Trade Discount from MRP | Pricing Formula (Gross Landed) | Billed Base Rate in Tally |
| :--- | :--- | :---: | :---: | :---: |
| **Tier 1 (Wholesale Distributor)** | M/S Sushila Boot House (Jharsuguda) | **38.00%** | $\text{MRP} \times 0.62$ | $(\text{MRP} \times 0.62) / 1.05$ |
| **Tier 2 (Semi-Wholesaler)** | Mahavir Shoe House (Dhenkanal) | **40.00%** | $\text{MRP} \times 0.60$ | $(\text{MRP} \times 0.60) / 1.05$ |
| **Tier 3 (Retailers & New Accounts)** | Famous Footwear, Shree Aditya, Rajan Traders | **42.00%** | $\text{MRP} \times 0.58$ | $(\text{MRP} \times 0.58) / 1.05$ |

### 3.2 Cash Discount on Xpania
* In addition to the invoice trade discount (38% / 40% / 42%), eligible customers settling promptly receive **5.00% Cash Discount on Taxable Value**.

---

## 4. Ajanta Shoes (India) Pvt. Ltd. &mdash; The "37.5% + 5%" Structure

The commonly referenced **"37.5% + 5%"** formula for Ajanta Shoes has two distinct commercial dimensions:

### 4.1 Dimension 1: Outward Customer Billing (SKIL &rarr; Retailers)
* **Primary Invoice Trade Discount**: **`37.50%`**
  * Rate in Tally = Taxable MRP (`MRP / 1.05`), Discount Column = **37.50%**.
  * Net Landed Invoice Price to Customer = $\text{MRP} \times 0.625$.
* **Plus (+) 5% Customer Cash Discount (CD)**:
  * Allowed @ **5% on Taxable Value** upon prompt payment.
  * Net Realized Customer Landed Discount = **`40.63%`** from MRP.
  $$\text{Net Landed Factor} = 0.625 \times (1 - 0.05) = 0.59375 \implies \mathbf{40.63\% \text{ Net Realized Discount}}$$

---

### 4.2 Dimension 2: Inward Supplier Agreement (Ajanta &rarr; SKIL Lifestyle)

#### A. The 37.50% Contractual Invoice Margin
* Under the signed Distributorship Agreement (01.08.2026), the basic price gap on Hawaii/EVA footwear is **40.48%**:
  $$\text{Basic Purchase Price} = \text{MRP} \times (1 - 0.4048) = \text{MRP} \times 0.5952$$
  $$\text{Landed Cost (with 5\% GST)} = \text{Basic Price} \times 1.05 = \text{MRP} \times 0.5952 \times 1.05 = \text{MRP} \times 0.62496$$
  $$\mathbf{\text{Net Landed Invoice Discount}} = 1 - 0.62496 = \mathbf{37.50\%}$$

#### B. The Plus (+) Backend Schemes Matrix (Additional 8.78% to 14.78% Received via Credit Notes)
On top of the primary 37.50% invoice discount, Ajanta compensates SKIL via monthly and quarterly credit notes:

| Incentive Head | Entitled Rate | Frequency | Basis | Purpose |
| :--- | :---: | :---: | :--- | :--- |
| **Cash Discount (CD)** | **3.00%** | Monthly | Prompt payment settlement | Primary Cash Discount |
| **Retailer Scheme (HW+FTW)** | **3.78%** | Monthly | Hawaii & Footwear purchases | Trade / Retail promotion |
| **Quarterly Turnover Bonus (QTB)** | **2.00%** | Quarterly | Total quarterly basic turnover | Volume achievement |
| **Monthly Target Bonus** | **3.00%** | Quarterly | On achieving ₹10L/month basic | Target achievement |
| **Annual Turnover Bonus (ATB)** | **3.00%** | Annual | On achieving ₹1.20 Cr annual target | Annual loyalty bonus |
| **Higher Volume Upgrade Slabs** | **+0.50% to +1.50%** | Milestone | Monthly ₹30L+ / ₹50L+ | Volume accelerator |

> [!TIP]
> **Total Effective Realized Margin from Ajanta**:
> * Front-end Invoice Discount: **37.50%**
> * Guaranteed Monthly Schemes (3% CD + 3.78% Retail): **+6.78%**
> * Quarterly & Annual Bonuses (2% QTB + 3% Target + 3% ATB): **+8.00%**
> * **Gross Earning Potential from Ajanta**: **`46.28% to 52.28%`** from MRP!

---

## 5. Master Comparison Table across All 3 Brands

| Metric | Ajanta Shoes | Xpania Footcare | Cubix Footcare |
| :--- | :---: | :---: | :---: |
| **Primary Inward Discount from MRP** | **37.50%** Landed | **38.00% &mdash; 42.00%** | **58.05%** Basic *(55.95% Landed)* |
| **Customer Outward Invoice Discount** | **37.50%** Landed | **38% / 40% / 42%** *(Tier-based)* | **42.00%** Landed *(Formula: MRP × 0.58)* |
| **Customer Cash Discount (CD)** | **5% on Taxable** | **5% on Taxable** | **5% on Taxable** |
| **Supplier Backend Schemes** | **3% CD + 3.78% Retail + 2% QTB + 3% Target** | Direct Net Rates | Direct Net Rates |
| **SKIL Front-End Trading Margin** | Flow-through to retailer | Direct Margin on Tier spread | **+31.76% Markup (24.11% Gross Spread)** |
| **SKIL Net Profit Margin (After CD)** | Retains all Backend Schemes (~6.78%&ndash;14.78%) | Retained Tier Margin | **19.11% Net Cash Margin** |
