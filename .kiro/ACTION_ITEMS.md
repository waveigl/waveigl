# ✅ Action Items - WaveIgl Platform

**Date**: 2024-02-17
**Priority**: 🔵 Medium
**Status**: 📋 Maintenance & Hardening

---

## 🎯 Immediate Actions

### 1. Hardening Permissions
- [x] Review `src/lib/permissions.ts` logic.
- [/] Add database constraints to prevent unauthorized role elevation.
- [ ] Verify `owner` and `admin` roles across all sensitive API routes.

### 2. Documentation Cleanup
- [x] Update `.kiro/EXECUTIVE_SUMMARY.md`.
- [x] Remove obsolete architectural audits (SaaS focus).
- [x] Update `ACTION_ITEMS.md`.

### 3. Community Features
- [ ] Enhance Discord role synchronization.
- [ ] Refine Mercado Pago webhook handling for better reliability.
- [ ] Implement new viewer interaction tools.

---

## 🔒 Security Hardening (Upcoming)

### 1. Database Integrity
- [ ] implement a trigger to ensure only OGabrielToth can be an `admin`.
- [ ] Implement a trigger to ensure only WaveIgl can be an `owner`/`streamer`.

### 2. API Security
- [ ] Review all `/api/admin` routes for strict permission checks.
- [ ] Audit `/api/streaming` endpoints.

---

## 📞 Responsible Parties

- **OGabrielToth**: Project Admin & Lead Developer.
- **WaveIgl**: Platform Owner & Primary Streamer.

---

**Version**: 2.0.0 (Simplified)
**Date**: 2024-02-17
**Status**: ✅ Focused
