# WeDecide - Phase 3 Implementation Plan: Meetings & Agendas

## Objective
Enhance the existing Meeting Management features to provide a complete workflow for scheduling, structuring, and running meetings. While basic CRUD exists, key usability features (reordering, editing details, robust decision linking) need to be implemented.

## 1. Pre-Meeting Decision Triage (New)
- [ ] **Schema Updates**
    - [ ] Update `Decision` status enum to include: `submitted`.
    - [ ] Create `DecisionFeedback` table for Chair comments/rejection reasons.
- [ ] **Triage Dashboard (Chair View)**
    - [ ] View list of `submitted` decisions.
    - [ ] Action: **Add to Agenda** (Approves decision for deliberation).
    - [ ] Action: **Request Changes** (Rejects decision back to `draft` with feedback).
- [ ] **Submit for Review**
    - [ ] Add "Submit" action for Decision Drafts (Owner only).
    - [ ] Validation: Ensure all required fields are present before submission.

## 2. Meeting Management Improvements
- [ ] **Edit Meeting Details**
    - [ ] Add "Edit" button to `MeetingDetailPage` header.
    - [ ] Reuse the "Create Meeting" form logic/modal to allow updating Title, Date, Location, and Description.
- [ ] **Cancel/Delete Workflow**
    - [ ] Improve delete confirmation (double check with "Archive" vs "Delete" semantics if needed, currently hard delete).

## 2. Agenda Management
- [ ] **Reorder Agenda Items**
    - [ ] Add "Move Up" / "Move Down" buttons for agenda items.
    - [ ] Implement backend update for `order_index`.
- [ ] **Edit Agenda Items**
    - [ ] Allow renaming agenda items inline or via a modal.
    - [ ] Edit/Add descriptions to agenda items (currently only Title is managed in UI).

## 3. Decision Integration
- [ ] **Review Decision Linking**
    - [ ] Verify the "Link Decision" picker works correctly (currently implemented).
    - [ ] Ensure linked decisions are visually distinct and navigating to them works.
- [ ] **"Presented" Status**
    - [ ] (Optional) When a meeting is "Completed", should linked decisions automatically move state? (To be discussed).

## 4. UI/UX Polish
- [ ] **Empty States**: Ensure nice empty states for meetings with no agenda.
- [ ] **Navigation**: Ensure explicit "Back to Meeting" from a Decision page if referring to it.

## Technical Tasks
- [ ] **Route Protection**: Ensure only Org Members can see meetings, only Admins/Chairs can edit.
- [ ] **Automated Tests**: Add integration tests for Agenda CRUD and Decision Linking.
