# Comprehensive Ajanta Purchase & Outward Sales Audit (November 2026 Invoices)

**Audit Date**: 22 November 2026  
**Auditor**: SKIL Master Autonomous Audit Engine  
**Subject**: Inward Purchases #87–#94, Outward Sales #SKIL-088–#SKIL-090, Missing Vouchers, and Article-Level Under-Margin Discrepancies  
**Reference Supplier**: Ajanta Shoes (India) Pvt. Ltd. (Dealer Code: `93081`)

---

## 1. Executive Summary & Inventory Flow Overview

On 19 November 2026, Ajanta Shoes billed 8 outward consignments to SKIL Lifestyle LLP (Dealer 93081) totaling **82 Cartons**, **3,366 Pairs**, with a cumulative taxable value of **₹4,41,378.66** and gross invoice value of **₹4,63,448.00**.

### Master Consignment Reconciliation Table

| # | Ajanta Inv No. | Date | Consignee (Retail Dealer) | Cartons | Pairs | Taxable (₹) | Gross Total (₹) | Tally Purchase | Tally Sales | Status |
|:---:|:---:|:---:|:---|:---:|:---:|:---:|:---:|:---:|:---:|:---|
| 1 | `1900428077` | 19-11-2026 | K G N FOOTWARE (PVM) | 4 | 240 | 19,164.00 | 20,122.00 | #87 (OK) | SKIL-088 | Under-Margin (-₹171.00) |
| 2 | `1900428078` | 19-11-2026 | M/S SHREE FOOTWEAR (SKLM) | 6 | 360 | 28,746.00 | 30,183.00 | #88 (OK) | SKIL-089 | Under-Margin (-₹257.00) |
| 3 | `1900428079` | 19-11-2026 | M/S SRI BRUNDABAN (RGDA) | 21 | 876 | 94,510.56 | 99,236.00 | #89 (OK) | SKIL-090 | Gain on CG (+₹1,075.27) |
| 4 | `1900428080` | 19-11-2026 | DELIGHT FOOT WEAR (VZM) | 15 | 732 | 69,116.76 | 72,573.00 | #94 (OK) | Pending | Sales Voucher Pending |
| 5 | `1900428135` | 19-11-2026 | DELIGHT FOOT WEAR (VZM) | 1 | 12 | 2,035.80 | 2,138.00 | #93 (OK) | Pending | Sales Voucher Pending |
| 6 | `1900428134` | 19-11-2026 | M/S SRI BRUNDABAN (RGDA) | 5 | 150 | 31,518.60 | 33,095.00 | #91 (OK) | Pending | Sales Voucher Pending |
| 7 | `1900428205` | 19-11-2026 | M/S SRI BRUNDABAN (RGDA) | 26 | 810 | 1,79,168.70 | 1,88,127.00 | 🔴 Missing | Pending | **CRITICAL: MISSING IN TALLY** |
| 8 | `1900428206` | 19-11-2026 | DELIGHT FOOT WEAR (VZM) | 4 | 186 | 17,118.24 | 17,974.00 | #92 (OK) | Pending | Sales Voucher Pending |
| **TOTAL** | — | — | **8 Consignments** | **82** | **3,366** | **₹4,41,378.66** | **₹4,63,448.00** | **7 / 8 Entered** | **3 / 8 Entered** | **Action Required** |

---

## 2. In-Depth Root Cause: Why Sales Gross Was Lower than Purchase Gross on #87 & #88

A critical anomaly identified during live Tally verification was that:
- **Inv 1900428077**: Purchase #87 gross is **₹20,122.00**, but Sales SKIL-088 is **₹19,951.00** (**-₹171.00 negative margin**).
- **Inv 1900428078**: Purchase #88 gross is **₹30,183.00**, but Sales SKIL-089 is **₹29,926.00** (**-₹257.00 negative margin**).

### Mathematical Root Cause Analysis
SKIL's standard commercial agreement with footwear retailers stipulates an outward dealer discount of **37.50% off MRP**.
- In Tally Sales, SKIL entered: $\text{Rate} = \frac{\text{MRP}}{1.05}$ with a **37.50% Trade Discount**.
- For an article with **MRP ₹133.00**:
  $$\text{Expected Landed Cost} = 133 \times (1 - 0.375) = ₹83.125 \implies \text{Basic Rate} = \frac{83.125}{1.05} = ₹79.1667 \approx ₹79.17$$
  Customer Outward Billing (240 Pairs @ ₹79.17 + 5% GST) = **₹19,951.00**.

- However, on supplier invoice `1900428077`, **Ajanta billed SKIL at a Basic Rate of ₹79.85**:
  $$\text{Ajanta Landed Cost} = 79.85 \times 1.05 = ₹83.8425$$
  $$\text{Actual Margin Passed by Ajanta} = 1 - \frac{83.8425}{133.00} = \mathbf{36.96\% \quad (\text{Short of Contractual 37.50\%})}$$
  Ajanta Inward Billing (240 Pairs @ ₹79.85 + 5% GST) = **₹20,122.00**.

> [!WARNING]
> Because Ajanta billed at **36.96% margin** instead of **37.50%**, SKIL was overcharged by **₹0.7175 landed per pair** (₹0.6833 basic).
> - On Invoice `1900428077` (240 pairs): Overcharge = $240 \times 0.7175 = \mathbf{₹172.20}$.
> - On Invoice `1900428078` (360 pairs): Overcharge = $360 \times 0.7175 = \mathbf{₹258.30}$.
> 
> **Conclusion**: The outward sales entries in Tally are **mathematically correct** according to dealer terms. Ajanta has **under-margined** SKIL. SKIL must issue a **Rate Difference / Under-Margin Debit Note** to Ajanta Shoes to recover this shortage.

---

## 3. Comprehensive Under-Margin Audit Across All 8 Invoices

Every single line item across the 8 invoices was systematically audited against the contractual formula:
$$\text{Landed Cost} = \text{Basic Rate} \times 1.05, \quad \text{Landed Margin \%} = 1 - \frac{\text{Landed Cost}}{\text{MRP}}$$

### Articles Identified with Under-Margin Billing (< 37.50%)

| Invoice No. | Article Name | Pairs | MRP (₹) | Ajanta Basic (₹) | Ajanta Landed (₹) | Actual Margin % | Shortfall / Pr (Landed) | Total Claim (Landed ₹) |
|:---|:---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **`1900428077`** | CPL 1001 .S.GREEN 05/08 | 120 | 133.00 | 79.85 | 83.8425 | 36.96% | ₹0.7175 | ₹86.10 |
| **`1900428077`** | CPL 1001 ONION 05/08 | 120 | 133.00 | 79.85 | 83.8425 | 36.96% | ₹0.7175 | ₹86.10 |
| **`1900428078`** | CPL 1001 ONION 05/08 | 180 | 133.00 | 79.85 | 83.8425 | 36.96% | ₹0.7175 | ₹129.15 |
| **`1900428078`** | CPL 1001 .S.GREEN 05/08 | 180 | 133.00 | 79.85 | 83.8425 | 36.96% | ₹0.7175 | ₹129.15 |
| **`1900428079`** | CPL 1001 .S.GREEN 04/07 | 60 | 133.00 | 79.85 | 83.8425 | 36.96% | ₹0.7175 | ₹43.05 |
| **`1900428079`** | CPL 87 DP.S.BLUE 04/07 | 60 | 133.00 | 79.85 | 83.8425 | 36.96% | ₹0.7175 | ₹43.05 |
| **`1900428079`** | DIVA 108 MAGENTA 05/07 | 60 | 122.00 | 73.25 | 76.9125 | 36.96% | ₹0.6625 | ₹39.75 |
| **`1900428080`** | CPL 1001 S.GREEN 05/07 | 60 | 133.00 | 79.85 | 83.8425 | 36.96% | ₹0.7175 | ₹43.05 |
| **`1900428206`** | CPL 77 DP.S.BLUE 05/07 | 60 | 133.00 | 79.85 | 83.8425 | 36.96% | ₹0.7175 | ₹43.05 |
| **TOTALS** | **9 Line Items** | **900 Pairs** | — | — | — | — | — | **₹642.45** |

> [!IMPORTANT]
> **Total Under-Margin Recovery Claim from Ajanta Shoes**:
> - **Basic Value**: **₹611.86**
> - **Input IGST @ 5%**: **₹30.59**
> - **Total Debit Note Claim**: **₹642.45**

---

## 4. Upside Analysis: Extra Margin on Clearance / Promotional Articles

In addition to standard articles, two consignments featured special promotional discounts significantly above 37.50%:

### A. Invoice `1900428079` (Purchase #89 & Sales SKIL-090)
Ajanta billed **CG 37** (MRP ₹319) at basic ₹184.37 and **CG 70** (MRP ₹349) at basic ₹201.72, delivering a **39.31% discount**.
- SKIL billed Sri Brundaban Enterprises at the standard 37.50% dealer discount.
- **Extra Gross Margin Earned by SKIL**: **+₹1,202.58** (Net invoice gain after CPL under-margin = **+₹1,075.27 taxable** / **+₹1,129.00 gross**).

### B. Missing Invoice `1900428205` (Sri Brundaban Enterprises — 26 CTN)
Ajanta passed heavy clearance discounts on premium ladies' articles:
- `SL 320` (MRP ₹659): Billed at basic ₹355.67 (**43.33% discount**) vs standard 37.50% (basic ₹392.26). Gain = **+₹36.59/pair**.
- `SPL 2035` (MRP ₹699): Billed at basic ₹356.54 (**46.44% discount**) vs standard 37.50% (basic ₹416.07). Gain = **+₹59.53/pair**.
- `SSL 5127` & `SSL 5130` (MRP ₹699): Billed at basic ₹377.25 (**43.33% discount**) vs standard 37.50% (basic ₹416.07). Gain = **+₹38.82/pair**.

> [!TIP]
> If SKIL bills Sri Brundaban Enterprises at the standard 37.50% dealer discount on Invoice `1900428205`:
> - Inward Purchase Cost: **₹1,88,127.00**
> - Outward Retail Sales: **₹1,97,849.00**
> - **Immediate Gross Profit Retained**: **+₹9,722.00 (+5.17% net gain)** before any Cash Discount or annual rebates!

---

## 5. Tally Voucher Action Plan (Pending Purchases & Sales)

### A. Purchase Voucher to Create
* **Voucher Type**: Purchase
* **Voucher No.**: **#95**
* **Supplier**: Ajanta Shoes (India) Pvt. Ltd.
* **Supplier Ref / Inv No.**: `1900428205` | Date: `19-11-2026`
* **Cartons / Pairs**: 26 Cartons | 810 Pairs
* **Taxable Value**: **₹1,79,168.70**
* **Input IGST @ 5%**: **₹8,958.43**
* **Round Off**: **-₹0.13**
* **Gross Total**: **₹1,88,127.00**

### B. Pending Outward Sales Vouchers to Create

1. **Sales for Purchase #91 (Inv `1900428134`)**:
   - Customer: `M/s Sri Brundaban Enterprises, Rayagada`
   - Consignment: 5 Cartons (150 Pairs) — PUG Series
   - Taxable: **₹31,517.62** | Output IGST: **₹1,575.88** | Round Off: **+₹0.50** | Gross: **₹33,094.00**
2. **Sales for Purchase #92 (Inv `1900428206`)**:
   - Customer: `Delight Foot Wear, Vizianagaram`
   - Consignment: 4 Cartons (186 Pairs) — CEG, CPL, ATL
   - Taxable: **₹17,075.34** | Output IGST: **₹853.77** | Round Off: **-₹0.11** | Gross: **₹17,929.00**
3. **Sales for Purchase #93 (Inv `1900428135`)**:
   - Customer: `Delight Foot Wear, Vizianagaram`
   - Consignment: 1 Carton (12 Pairs) — Ultimate Clogs
   - Taxable: **₹2,035.71** | Output IGST: **₹101.79** | Round Off: **+₹0.50** | Gross: **₹2,138.00**
4. **Sales for Purchase #94 (Inv `1900428080`)**:
   - Customer: `Delight Foot Wear, Vizianagaram`
   - Consignment: 15 Cartons (732 Pairs) — CEG, HOOK, LOOK, BETA, CPL
   - Taxable: **₹69,064.00** | Output IGST: **₹3,453.20** | Round Off: **-₹0.20** | Gross: **₹72,517.00**
5. **Sales for Purchase #95 (Inv `1900428205`)**:
   - Customer: `M/s Sri Brundaban Enterprises, Rayagada`
   - Consignment: 26 Cartons (810 Pairs) — CG, CS, FITNESS, PUG, SL, SPL, SSL
   - Taxable: **₹1,88,427.68** | Output IGST: **₹9,421.38** | Round Off: **-₹0.06** | Gross: **₹1,97,849.00**

---

## 6. Document Archival & Directory Timestamps

All 8 supplier PDF files have been permanently cataloged, renamed, and mirrored across the system:
- **Purchases Directory**: [user-documents-read-only-access/Purchases - last updated on 21-11-2026 at 23-09 hrs](file:///c:/Projects/SKIL%20Master/user-documents-read-only-access/Purchases%20-%20last%20updated%20on%2021-11-2026%20at%2023-09%20hrs/)
- **Android App Mirror**: `android-app/www/documents/ajanta/`
- **Sync Engine Mirror**: `sync-engine/public/documents/ajanta/`
- **Dynamic Folder Timestamp**: Automatically refreshed via `FolderUpdater.updateAll()`.
