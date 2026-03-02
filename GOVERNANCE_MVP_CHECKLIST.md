# ✅ Strategic Governance Engine: MVP Checklist

Use this checklist to validate the core functionality of the new Governance Module.

---

## 1. ⚙️ Governance Configuration
*Navigate to: Settings (Gear Icon) -> Governance Tab*

- [ ] **Capacity Limits**
    - [ ] Set **Total Focus Slots** (e.g., `20`).
    - [ ] Set **CAPEX Limit** (e.g., `$500,000`).
    - [ ] Set **OPEX Limit** (e.g., `$200,000`).
    - [ ] Click **Save Capacity** and verify persistence on page refresh.

- [ ] **Strategic Pillars**
    - [ ] Confirm default pillars are visible (e.g., *Growth & Innovation*).
    - [ ] **Add Pillar**: Create a new pillar (e.g., *AI Transformation*) with a weight (e.g., 20%).
    - [ ] **Validate Constraints**: Try adding a weight that pushes the Total > 100%. The system should block it.
    - [ ] **Edit Weight**: Click a weight value to update it inline.
    - [ ] **Visual Indicator**: Verify the "Total Weight" badge updates color (Green=100%, Yellow<100%, Red>100%).
    - [ ] **Delete**: Remove a test pillar.

---

## 2. 📝 Initiative Proposal
*Navigate to: Command Center -> "+ Propose Initiative"*

- [ ] **Form Submission**
    - [ ] Enter a Title (e.g., *Project Phoenix*).
    - [ ] **Select Strategic Pillar**: Confirm this dropdown is populated from your settings and is **Required**.
    - [ ] **Focus Slots**: Set cognitive load (1-10).
    - [ ] **Financials**: Enter CAPEX and OPEX estimates.
    - [ ] **Quick Win**: Toggle "Short Term Win".
    - [ ] **Submit**: Click "Submit Proposal" and confirm redirect to Command Center.

---

## 3. 🚀 Command Center (The Engine)
*Navigate to: Command Center*

- [ ] **Visual Dashboard**
    - [ ] **Gauges**: Confirm Top Bar gauges reflect your settings (Focus, CAPEX, OPEX).
    - [ ] **Layout**: Verify the Two-Column Board:
        - **Left**: Proposed / Backlog
        - **Right**: Active / In Flight
    - [ ] **New Item**: Locate your newly proposed initiative in the **Left Column**.

- [ ] **Initiative Cards**
    - [ ] **Badges**: Verify the colored **Strategic Pillar** badge is visible.
    - [ ] **Focus Pills**: Confirm "Focus Slots" shows as a battery/dots visual.
    - [ ] **Quick Win**: Verify the clock icon appears if "Short Term Win" was selected.

- [ ] **The "Physics" Simulation**
    - [ ] **Activate**: Click **"Activate"** on a Proposed item.
        - [ ] Item moves to **Right Column**.
        - [ ] All 3 Gauge values INCREASE immediately.
    - [ ] **Park**: Click **"Park / Pause"** on an Active item.
        - [ ] Item moves to **Left Column**.
        - [ ] Gauge values DECREASE immediately.

- [ ] **Constraint Logic (The Warning)**
    - [ ] Activate enough items to **EXCEED** a limit (e.g., Focus Slots > 20).
    - [ ] Confirm the Gauge turns **RED**.
    - [ ] Confirm the animated banner **"⚠️ CAPACITY EXCEEDED - SWAP REQUIRED"** appears.

- [ ] **Commitment**
    - [ ] Verify the **"Commit Changes"** button becomes active (Blue/Pulsing).
    - [ ] Click **Commit**.
    - [ ] Refresh page: Confirm the new state (`Active` vs `Proposed`) persisted.
