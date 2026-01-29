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

## 2. Meeting Management Improvements (Phase 1)
- [ ] **Schema Synchronization**
    - [ ] Add `Meeting` and `AgendaItem` models to `schema.prisma` (currently missing).
    - [ ] Add `MeetingAttendee` model to track invitations and presence.
- [ ] **Core Meeting Management**
    - [ ] **Edit Meeting**: Modal/Page to update Title, Date, Location, Description.
    - [ ] **Cancel/Delete**: Soft delete or status update to 'cancelled'.
- [ ] **Agenda Management**
    - [ ] **Reordering**: Implement "Move Up" / "Move Down" buttons for agenda items (backend updates `order_index`).
    - [ ] **Edit Items**: Allow inline editing of Item Title and Description.
    - [ ] **Minutes/Notes**: Add `notes` field to `AgendaItem` to capture minutes during the meeting.
- [ ] **Attendee Management**
    - [ ] **Invite Users**: Functionality to select users from the Organization to invite.
    - [ ] **Track Attendance**: Mark users as Present/Absent during the meeting.

## 3. Decision Integration
- [ ] **"Presented" Status**
    - [ ] When a meeting is "Completed", automatically prompt to move linked, active decisions to `Completed` (or keep as is, relying on the new "Finalize" button).

## 4. UI/UX Polish
- [ ] **Empty States**: Ensure nice empty states for meetings with no agenda.
- [ ] **Navigation**: Explicit "Back to Meeting" from a Decision page if referred.

## Technical Tasks
- [ ] **Route Protection**: Ensure only Org Members can see meetings, only Admins/Chairs can edit.
- [ ] **Automated Tests**: Add integration tests for Agenda CRUD and Decision Linking.
