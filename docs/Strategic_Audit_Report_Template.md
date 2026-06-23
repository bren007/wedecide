# 🎯 AlturaGov: Strategic Capacity Audit Report

**Prepared For:** [Organization Name]
**Date:** [Date]
**Prepared By:** [Consultant Name / AlturaGov Team]

---

## 1. Executive Summary

This report outlines the findings from the 60-minute Strategic Slot-Sync Session. We analyzed your organization's current active portfolio against the realities of your delivery capacity.

**Key Finding:** 
Your organization is currently operating at **[X]%** of its calculated strategic capacity, leading to an estimated **[Y]** hours of context-switching waste per week and delaying critical initiatives (like *[Initiative Name]*).

---

## 2. Audit Methodology

The AlturaGov Strategic Capacity Audit applies three analytical constructs to produce a defensible, quantified capacity assessment:

### 2.1 Friction Coefficient (IP Definition)

> **Definition:** The *Friction Coefficient* (`f`) is a scalar multiplier (range: **1.00 – 2.50**) applied to a raw initiative slot-weight to account for structural drag imposed by stakeholder complexity, approval mandate overhead, and organisational interdependency.

Formally:

```
Adjusted Focus Slots = Raw Slots × f

where:
  f = 1.00  →  No meaningful friction (standalone, delegated authority)
  f = 1.50  →  Moderate friction (multi-department, ministerial sign-off)
  f = 2.50  →  Maximum friction (Cabinet-level, cross-jurisdictional, novel technology)
```

The coefficient is derived from the three complexity dimensions collected in the Intake Engine:
- `complexity_stakeholders_1_to_3` — breadth and seniority of stakeholder engagement
- `complexity_novelty_1_to_3` — degree of technical or procedural novelty
- `complexity_dependency_1_to_3` — depth of critical-path dependencies

All three scores are normalised and combined to produce the initiative's `friction_coefficient`, stored per-lead in the AlturaGov platform. This coefficient is proprietary to the AlturaGov Capacity Calibration Framework.

---

## 3. The Physics of Your Focus

Using the AlturaGov Capacity Calibration framework, we established your "Baseline Focus Slots" based on your most successful historical delivery year.

*   **Large / Strategic Initiatives Capacity:** [X]
*   **Average Active Projects Baseline:** [Y]
*   **Target Cognitive Load Limit (Total Focus Slots):** [Z] Slots

## 4. Current State vs. Target State
* **Current Active Slots:** [Current Load]
* **Variance:** [+ / - %]

---

## 5. High-Friction Areas Identified

Based on the Intake Engine analysis and applied Friction Coefficients, the following initiatives carry the highest complexity tax:

| Initiative Name | Stakeholder Friction (`f` component) | Novelty/Tech | Dependency Depth | Friction Coefficient (`f`) | Adjusted Focus Slots |
| :--- | :--- | :--- | :--- | :--- | :--- |
| *Example Project A* | 3 (Ministerial) | 3 (New Integration) | 3 (Critical Path) | **2.50** | **5 Slots** |
| *Example Project B* | 1 (Multi-Dept) | 1 (BAU) | 1 (Standalone) | **1.00** | **1 Slot** |

---

## 6. Immediate Recommendations

To regain control of your backlog and accelerate delivery, we recommend the following strategic tradeoffs:

1.  **Pause and Re-evaluate:** Halt work on *[Initiative Name]* immediately. Its high dependency depth is starving your critical path.
2.  **Calibrate Intake:** Enforce the Complexity Calculator and Friction Coefficient scoring for all new requests to prevent "stealth projects" from draining capacity.
3.  **Command Center Activation:** Implement the AlturaGov Command Center to establish a single source of truth for all active work, capacity limits, and friction scores.

---

## 7. Next Steps

1.  **Review Tradeoffs:** Discuss the recommended pauses with your executive leadership.
2.  **License Activation:** Proceed with the AlturaGov Enterprise License activation to institutionalize these guardrails.
3.  **Onboarding:** Schedule your onboarding session for key portfolio managers.

---
*AlturaGov – Turn over-committed backlogs into governed strategic intent.*
