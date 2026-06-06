# Customer Portal Modernization — Project Wiki

## Overview
Modernize the legacy customer portal (Rails 4 / Angular 1.x) to a React SPA with a new Node.js API layer.

## Architecture Decisions

### ADR-001: Legacy API Strategy
**Status**: Pending
The legacy API v1 remains during transition. A v2 adapter layer will translate between schemas. Risk: v1 is undocumented and behavior is inconsistent.

### ADR-002: QA Strategy
**Status**: Draft
Manual QA for release sign-off. Automated smoke tests planned but not yet implemented. No performance baseline established.

## Team
- Product Owner: Sarah M.
- Tech Lead: James K.
- Engineers: Dev1, Dev2, Dev3, Dev4 (Dev5 on leave)
- QA: Shared resource, 50% allocation

## Known Dependencies
- Legacy API v1 — owned by Platform team (low priority for them)
- Auth service — stable, no changes planned
- Payment gateway — out of scope for this release

## Production Readiness
- [ ] Load testing completed
- [ ] Runbook written
- [ ] Rollback plan defined
- [ ] On-call rotation updated
- [ ] Production readiness checklist sign-off

## Timeline
- Week 1–4: Foundation and API adapter
- Week 5–8: Feature development
- Week 9–10: QA and hardening
- Week 11–12: Release preparation and go-live
