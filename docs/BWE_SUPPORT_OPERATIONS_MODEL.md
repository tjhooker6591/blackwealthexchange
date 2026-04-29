# BWE Support Operations Model

## Workflow
1. User submits ticket via support pages.
2. Ticket stored in `support_tickets` (MongoDB) with status `new`.
3. Admin triages in `/admin/support/tickets`.
4. Admin updates status and internal notes in `/admin/support/tickets/[id]`.
5. Resolved tickets move to `resolved` then `closed`.

## Categories
- Account / Login
- Marketplace Order
- Seller / Product Issue
- Business Directory
- Advertising / Sponsorship
- Job Posting / Employer
- Billing / Payment
- Course / Membership
- Black Card
- Technical Bug
- Trust & Safety
- General Question

## Escalation rules
- `security` or `Trust & Safety` => immediate escalation.
- `financial` or Billing issues => escalate to finance owner.
- Platform/runtime outage => escalate to infra owner.

## Infrastructure ownership
- GitHub: code bugs, feature defects, release tracking.
- Vercel: deployment/runtime/domain incidents.
- MongoDB: data integrity, ticket storage, order/payment lookup support.

## Incident response
- Classify severity (normal/high/urgent/security/financial).
- Acknowledge ticket and set `in_review`.
- Assign owner and document internal notes.
- Apply fix, verify in staging/production workflow.
- Mark `resolved`, then `closed` after confirmation.
