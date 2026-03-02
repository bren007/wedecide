# Implementation Plan: Strategic Governance Engine - Phase 2

## 1. Database Schema Updates
We need to extend the schema to support meeting snapshots and the new intake field.

### A. Meeting Snapshots
Store the entire state of the portfolio (Initiatives + Capacity) at the start and end of a meeting to allow for "Delta" reporting.

- **Table**: `meetings`
- **New Columns**:
  - `snapshot_start` (JSONB): Stores the state at the beginning of the meeting.
  - `snapshot_end` (JSONB): Stores the state at the end of the meeting.
  - `started_at` (TIMESTAMPTZ): When the meeting actually started.
  - `ended_at` (TIMESTAMPTZ): When the meeting actually ended.

### B. Refined Intake ("The Why")
Capture the strategic justification at the point of ingestion.

- **Table**: `initiatives`
- **New Column**:
  - `strategic_tradeoff` (TEXT): "If this project is approved, which other type of work are we most willing to sacrifice?"

---

## 2. Frontend Implementation

### A. Refined Intake: "The Why"
Update the `StagingGrid` to include the mandatory "Strategic Trade-off" field.

- **Component**: `StagingGrid.tsx`
- **Changes**:
  - Add `strategic_tradeoff` to the columns.
  - Add a **Tooltip** to the column header: "If this project is approved, which other type of work are we most willing to sacrifice?"
  - Ensure this field is required before "Saving to Database".

### B. Meeting Mode & Snapshot Logic
Implement the lifecycle of a meeting within the Command Center.

- **Components**: `CommandCenterPage.tsx`, `MeetingControls.tsx` (New)
- **Logic**:
  1.  **Start Meeting**:
      - User clicks "Start Meeting".
      - App fetches current `initiatives` and `capacity_settings`.
      - **Action**: Update `meetings` table with `started_at = NOW()` and `snapshot_start = { initiatives, capacity }`.
  2.  **During Meeting (The "Commit" Hook)**:
      - When Chair clicks "Commit Changes" (updates to initiatives), we perform a **Transaction**:
        - Update `initiatives` table (Status, Focus Slots, etc.).
        - Insert into `strategic_ledger`:
          - `initiative_id`: The ID of the initiative being changed.
          - `chair_id`: The current user's ID.
          - `action_type`: 'swap', 'approve', 'update'.
          - `rationale`: The text input from the Chair (e.g., "Swapped X for Y because...").
          - `replaced_ids`: IDs of any displaced initiatives.
  3.  **End Meeting**:
      - User clicks "End Meeting".
      - App fetches final state.
      - **Action**: Update `meetings` table with `ended_at = NOW()` and `snapshot_end = { initiatives, capacity }`.

### C. Strategic Ledger Component ("The Shield")
A read-only timeline view of the immutable audit trail.

- **Component**: `StrategicLedger.tsx`
- **UI**: Vertical timeline.
  - **Item**: "On [Date], [Chair Name] [Action] [Initiative Name]..."
  - **Detail**: "Rationale: [User Input]"
  - **Context**: "Trade-off: Prioritized over [Replaced Initiative Name]" (if applicable).

### D. Lean Audit Export
Simple, robust export functionality.

- **Feature**: "Print to PDF" / "Email Summary"
- **Implementation**:
  - **Browser Native Print**: Create a specific CSS `@media print` stylesheet that hides UI chrome (buttons, nav bars) and formats the `StrategicLedger` and `MeetingSummary` (Snapshots) nicely for A4 paper.
  - **Button**: "Export Summary" -> Calls `window.print()`.

---

## 3. Step-by-Step Execution Plan

1.  **Database Migration**:
    - Create `scripts/apply_phase2_schema.js` and `scripts/phase2_schema.sql` to add columns to `meetings` and `initiatives`.
2.  **Backend Logic**:
    - Update `pivot_to_strategic_governance.sql` RLS policies if necessary (likely fine as is).
3.  **Frontend - Intake**:
    - Modify `StagingGrid` to include `strategic_tradeoff`.
4.  **Frontend - Command Center**:
    - Build `MeetingControls` component.
    - Implement `handleStartMeeting`, `handleEndMeeting`.
    - Enhance `handleCommit` to require Rationale and write to Ledger.
5.  **Frontend - Ledger**:
    - Build `StrategicLedger` component.
    - Implement `@media print` styles.

---

## 4. Key Questions / Confirmation
- **Comparison**: For "Project X swapped for Project Y", does the UI explicitly support selecting a "Replaced Project"? Currently, drag-and-drop just moves things. We might need a specific "Swap" action or infer it (e.g., if one enters "Approved" and another enters "Paused" in the same Commit).
  - *Proposal*: For MVP, we can treat "Swap" as a set of simultaneous changes. The "Commit" modal can ask for a simplistic "Rationale" for the batch, or per-item. I recommend: A **Batch Rationale** for the whole Commit "set".
  - "I am swapping X for Y because..." covers the whole set.

- **Meetings**: Do we need to create a *new* meeting entry every time, or select from "Scheduled" meetings?
  - *Proposal*: Select from "Scheduled" if available, else "Start Ad-hoc Session".
