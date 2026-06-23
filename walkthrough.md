# Portfolio Generation Walkthrough

We have successfully generated a high-fidelity, large-scale portfolio CSV file at [large_portfolio_test.csv](file:///C:/Users/blair/.gemini/antigravity/scratch/WeDecide/large_portfolio_test.csv) that conforms strictly to the schema and validation criteria of the secure-drop submission system.

## Summary of the Generated Portfolio

- **Initiative Count**: 33 initiatives (meeting the target of 30-35).
- **Total Portfolio Budget**: $767,500,000 (meeting the target of $500m+).
- **Format compliance**: Conforms strictly to the CSV headers and data types validated by `SecureDropPage.tsx` and processed by the `generate-draft` and `import-audit-portfolio` backend edge functions.

## CSV Schema and Fields

| CSV Header | Expected Type/Values | Purpose / Mapping |
| :--- | :--- | :--- |
| `initiative_name` | String (unique) | Name of the public sector/enterprise initiative |
| `strategic_pillar` | String | Alignment pillar (e.g., Core Infrastructure, Digital Public Services) |
| `approval_mandate` | Enum: `Cabinet Approved`, `Ministerial Approved`, `Board/Delegated`, `Pre-Approval` | Political/operational sanction gate |
| `relative_priority` | Enum: `Tier 1`, `Tier 2`, `Tier 3` | Priority classification tier |
| `complexity_stakeholders_1_to_3` | Integer (1 to 3) | Stakeholder friction/complexity |
| `complexity_novelty_1_to_3` | Integer (1 to 3) | Technological novelty/complexity |
| `complexity_dependency_1_to_3` | Integer (1 to 3) | Dependency network complexity |
| `current_fy_budget` | Integer | Cost/budget in USD |
| `lifecycle_stage` | String (e.g., `Active`, `Planning`) | Stage of the project |
| `target_delivery_quarter` | String (e.g., `Q2 FY27`, `Q4 FY26`) | Target quarter for delivery |
| `next_milestone_date` | Date (YYYY-MM-DD) | Date of the next milestone check |
| `dependency_blockers` | Comma-separated list or `None` | Other initiatives this project depends on |

## Advanced Test Scenarios Built-In

To test the backend audit analyzer's logical capabilities in a realistic manner, the following structural patterns have been injected:
1. **Ambition vs. Capacity Overcommitment**: The overall portfolio represents 33 initiatives with complex stakeholders and novelty scores, resulting in a large cumulative "Focus Slots" load. This is guaranteed to exceed standard capacities, which will test the overcommitment analysis and scenario generation.
2. **Dependency Risk Cascades**: Several `Cabinet Approved` and `Tier 1` initiatives explicitly list lower-priority `Tier 2` or `Tier 3` initiatives as blockers (e.g., the *National Identity System v2* depends on *Central API Gateway* and *Legacy Data Migration Service*). This will trigger the backend’s audit review engine to flag these critical programs as structurally at risk.
3. **Budget Clustered Loads**: Major fiscal commitments are concentrated in specific delivery quarters, triggering capacity overload metrics in the analytical agents.
