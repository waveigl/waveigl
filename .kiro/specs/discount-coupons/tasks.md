# Implementation Plan: Discount Coupons & Personalized Pricing

## Overview

This implementation plan breaks down the discount coupons feature into discrete, manageable tasks. Each task builds on previous ones, with testing integrated throughout to catch errors early. The plan follows a modular approach: database setup → service layer → API endpoints → UI components → integration and analytics.

## Tasks

- [x] 1. Set up database schema and migrations
  - Create migration files for all discount tables
  - Create indexes on frequently queried columns
  - Set up RLS policies for discount tables
  - _Requirements: 1.4, 2.3, 3.4, 4.5_

- [x] 1.1 Write property tests for database schema
  - **Property 3: Discount Link Token Uniqueness**
  - **Validates: Requirements 2.3**

- [x] 2. Create TypeScript types and interfaces
  - Define all discount types (DirectUserDiscount, DiscountLink, CouponCode)
  - Define validation result types
  - Define analytics and filter types
  - _Requirements: 1.4, 2.3, 3.4_

- [x] 2.1 Write unit tests for type definitions
  - Test type compatibility and structure
  - _Requirements: 1.4, 2.3, 3.4_

- [x] 3. Implement DiscountValidator service
  - Validate discount prices (0 to R$ 9.90)
  - Validate coupon code format (alphanumeric, 4-20 chars)
  - Validate expiration dates
  - Validate redemptions available
  - _Requirements: 1.3, 3.3, 6.1, 6.2_

- [x] 3.1 Write property tests for DiscountValidator
  - **Property 2: Discount Price Validation**
  - **Property 5: Coupon Code Format Validation**
  - **Property 7: Discount Expiration Validation**
  - **Validates: Requirements 1.3, 3.3, 6.1, 6.2**

- [x] 4. Implement DirectUserDiscountService
  - Create direct user discount
  - Get discount for user
  - List all discounts with filters
  - Update discount
  - Delete discount (soft-delete)
  - _Requirements: 1.4, 1.6, 1.7, 1.8_

- [x] 4.1 Write property tests for DirectUserDiscountService
  - **Property 1: Direct User Discount Uniqueness**
  - **Property 11: Discount Audit Trail Completeness**
  - **Property 13: Soft Delete Preservation**
  - **Validates: Requirements 1.4, 1.7, 1.8**

- [x] 5. Implement DiscountLinkService
  - Generate unique discount link with token
  - Validate link token
  - List links with filters
  - Redeem link (decrement counter)
  - Delete link (soft-delete)
  - _Requirements: 2.3, 2.4, 2.5, 2.6, 2.7, 2.10, 2.11_

- [x] 5.1 Write property tests for DiscountLinkService
  - **Property 3: Discount Link Token Uniqueness**
  - **Property 4: Discount Link Redemption Counter Consistency**
  - **Property 15: Redemption Logging Completeness**
  - **Validates: Requirements 2.3, 2.6, 2.11**

- [x] 6. Implement CouponCodeService
  - Create coupon code with validation
  - Validate coupon code
  - List coupons with filters
  - Redeem coupon (decrement counter)
  - Deactivate coupon
  - Delete coupon (soft-delete)
  - _Requirements: 3.3, 3.4, 3.5, 3.7, 3.8, 3.11, 3.12_

- [ ] 6.1 Write property tests for CouponCodeService
  - **Property 5: Coupon Code Format Validation**
  - **Property 6: Coupon Code Redemption Counter Consistency**
  - **Property 15: Redemption Logging Completeness**
  - **Validates: Requirements 3.3, 3.7, 3.12**

- [ ] 7. Implement DiscountAnalyticsService
  - Calculate overall analytics (total_discounts, total_redeemed, revenue_impact)
  - Calculate discount-specific stats
  - Generate redemption timeline
  - Export data as CSV
  - _Requirements: 7.1, 7.2, 7.4, 7.5_

- [ ] 7.1 Write property tests for DiscountAnalyticsService
  - **Property 16: Analytics Aggregation Accuracy**
  - **Validates: Requirements 7.1, 7.5**

- [ ] 8. Create API endpoints for direct user discounts
  - POST /api/discounts/direct-user (create)
  - GET /api/discounts/direct-user (list)
  - GET /api/discounts/direct-user/:id (get)
  - PUT /api/discounts/direct-user/:id (update)
  - DELETE /api/discounts/direct-user/:id (delete)
  - _Requirements: 1.4, 1.6, 1.7, 1.8_

- [ ] 8.1 Write unit tests for direct user discount endpoints
  - Test CRUD operations
  - Test permission checks
  - Test error handling
  - _Requirements: 1.4, 1.6, 1.7, 1.8_

- [ ] 9. Create API endpoints for discount links
  - POST /api/discounts/links (generate)
  - GET /api/discounts/links (list)
  - GET /api/discounts/links/:id (get)
  - GET /api/discounts/links/validate/:token (validate)
  - DELETE /api/discounts/links/:id (delete)
  - _Requirements: 2.3, 2.4, 2.5, 2.6, 2.7, 2.10, 2.11_

- [ ] 9.1 Write unit tests for discount link endpoints
  - Test link generation and validation
  - Test redemption logic
  - Test error handling
  - _Requirements: 2.3, 2.5, 2.6_

- [ ] 10. Create API endpoints for coupon codes
  - POST /api/discounts/coupons (create)
  - GET /api/discounts/coupons (list)
  - GET /api/discounts/coupons/:id (get)
  - POST /api/discounts/coupons/validate (validate)
  - PUT /api/discounts/coupons/:id (update)
  - DELETE /api/discounts/coupons/:id (delete)
  - _Requirements: 3.3, 3.4, 3.5, 3.7, 3.8, 3.11, 3.12_

- [ ] 10.1 Write unit tests for coupon code endpoints
  - Test CRUD operations
  - Test validation logic
  - Test error handling
  - _Requirements: 3.3, 3.5, 3.7_

- [ ] 11. Create discount validation and application endpoints
  - POST /api/discounts/validate (validate any discount type)
  - POST /api/discounts/apply (apply discount to subscription)
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 11.1 Write property tests for discount validation
  - **Property 8: PreApproval Custom Price Application**
  - **Property 9: Discount Metadata Persistence**
  - **Property 14: Single Discount Per Subscription**
  - **Validates: Requirements 4.1, 4.4, 6.7**

- [ ] 12. Integrate discounts with Mercado Pago PreApproval
  - Modify subscription creation to accept discount_id
  - Apply custom price to PreApproval
  - Store subscription-discount relationship
  - Handle renewal with discount persistence
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_

- [ ] 12.1 Write property tests for Mercado Pago integration
  - **Property 8: PreApproval Custom Price Application**
  - **Property 9: Discount Metadata Persistence**
  - **Property 10: Discount Renewal Price Consistency**
  - **Validates: Requirements 4.1, 4.5, 4.6**

- [ ] 13. Create DiscountManagementPanel component
  - Create main panel with three tabs
  - Implement tab navigation
  - Add search and filter functionality
  - Add sort functionality
  - _Requirements: 5.1, 5.6, 5.7_

- [ ] 13.1 Write unit tests for DiscountManagementPanel
  - Test tab rendering
  - Test search and filter
  - Test sort functionality
  - _Requirements: 5.1, 5.6, 5.7_

- [ ] 14. Create DirectUserDiscountsTab component
  - Display table of direct user discounts
  - Implement search by user
  - Implement edit and delete actions
  - Show user info, discount price, created date
  - _Requirements: 5.2, 5.6, 5.7_

- [ ] 14.1 Write unit tests for DirectUserDiscountsTab
  - Test table rendering
  - Test CRUD actions
  - Test search and sort
  - _Requirements: 5.2, 5.6_

- [ ] 15. Create DiscountLinksTab component
  - Display table of discount links
  - Implement copy-to-clipboard for link URL
  - Implement view stats action
  - Show discount price, remaining redemptions, expiration date, status
  - _Requirements: 5.3, 5.5, 5.6, 5.7_

- [ ] 15.1 Write unit tests for DiscountLinksTab
  - Test table rendering
  - Test copy-to-clipboard
  - Test stats modal
  - _Requirements: 5.3, 5.5_

- [ ] 16. Create CouponCodesTab component
  - Display table of coupon codes
  - Implement deactivate action
  - Implement view stats action
  - Show code, discount price, remaining redemptions, expiration date, status
  - _Requirements: 5.4, 5.5, 5.6, 5.7_

- [ ] 16.1 Write unit tests for CouponCodesTab
  - Test table rendering
  - Test deactivate action
  - Test stats modal
  - _Requirements: 5.4, 5.5_

- [ ] 17. Create DiscountStatsModal component
  - Display total_redeemed, redemption_rate, revenue_impact
  - Display redemption timeline chart
  - Display list of recent redemptions
  - _Requirements: 5.5, 7.2_

- [ ] 17.1 Write unit tests for DiscountStatsModal
  - Test stats display
  - Test chart rendering
  - Test redemption list
  - _Requirements: 5.5, 7.2_

- [ ] 18. Create DiscountForm component
  - Reusable form for creating/editing discounts
  - Support all three discount types
  - Implement validation with error messages
  - Show character counters and validation feedback
  - _Requirements: 1.3, 2.2, 3.2, 6.1, 6.2_

- [ ] 18.1 Write unit tests for DiscountForm
  - Test form rendering
  - Test validation
  - Test error messages
  - _Requirements: 1.3, 3.2, 6.1_

- [ ] 19. Create analytics endpoints
  - GET /api/discounts/analytics (overall analytics)
  - GET /api/discounts/:id/stats (discount-specific stats)
  - GET /api/discounts/audit-logs (audit logs)
  - POST /api/discounts/export (CSV export)
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 19.1 Write unit tests for analytics endpoints
  - Test analytics calculation
  - Test filtering
  - Test CSV export
  - _Requirements: 7.1, 7.3, 7.4_

- [ ] 20. Implement permission checks and security
  - Add permission middleware to all discount endpoints
  - Implement role-based access control
  - Add audit logging for all operations
  - Validate all inputs server-side
  - _Requirements: 8.1, 8.2, 8.3, 8.5, 8.6_

- [ ] 20.1 Write property tests for permission checks
  - **Property 12: Permission-Based Access Control**
  - **Validates: Requirements 8.1, 8.2**

- [ ] 21. Integrate discount management into admin panel
  - Add "Discounts" tab to StreamingInfoPanel
  - Or create separate DiscountManagementPage
  - Add navigation link in admin menu
  - _Requirements: 5.1_

- [ ] 21.1 Write integration tests for admin panel integration
  - Test navigation to discount management
  - Test discount creation from admin panel
  - _Requirements: 5.1_

- [ ] 22. Implement checkout integration
  - Add discount code input field to checkout
  - Add discount link validation on checkout page
  - Display discount amount and new price
  - Apply discount when user subscribes
  - _Requirements: 3.5, 3.6, 2.5, 2.6_

- [ ] 22.1 Write integration tests for checkout integration
  - Test coupon code application
  - Test discount link application
  - Test price calculation
  - _Requirements: 3.5, 3.6, 2.5_

- [ ] 23. Implement error handling and Discord notifications
  - Add error handling to all discount operations
  - Implement Discord notifications for errors
  - Log all errors with context
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8_

- [ ] 23.1 Write unit tests for error handling
  - Test error messages
  - Test Discord notifications
  - _Requirements: 6.1, 6.8_

- [ ] 24. Checkpoint - Ensure all tests pass
  - Run all unit tests: `npm run test:unit`
  - Run all integration tests: `npm run test:integration`
  - Run linting: `npm run lint`
  - Run type checking: `npm run type-check`
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 25. Create E2E tests for complete workflows
  - Test direct user discount workflow
  - Test discount link workflow
  - Test coupon code workflow
  - Test analytics and reporting
  - _Requirements: 1.4, 2.6, 3.7, 7.1_

- [ ] 25.1 Write E2E tests
  - Test complete discount creation and redemption flows
  - _Requirements: 1.4, 2.6, 3.7_

- [ ] 26. Final checkpoint - Ensure all tests pass
  - Run all tests: `npm run test`
  - Run E2E tests: `npm run test:e2e`
  - Run linting: `npm run lint`
  - Run type checking: `npm run type-check`
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 27. Update CHANGELOG.md and create git commit
  - Document all new features and improvements
  - Update version number (MINOR bump for new feature)
  - Create commit with descriptive message
  - Push to repository

## Notes

- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- Integration tests validate component interactions
- E2E tests validate complete user workflows

## Implementation Order

1. **Phase 1 (Core)**: Tasks 1-7 (Database, services, analytics)
2. **Phase 2 (API)**: Tasks 8-11 (API endpoints)
3. **Phase 3 (Integration)**: Task 12 (Mercado Pago integration)
4. **Phase 4 (UI)**: Tasks 13-18 (React components)
5. **Phase 5 (Admin)**: Tasks 19-21 (Analytics, admin integration)
6. **Phase 6 (Checkout)**: Task 22 (Checkout integration)
7. **Phase 7 (Polish)**: Tasks 23-27 (Error handling, tests, commit)

## Success Criteria

- All 16 correctness properties validated by property-based tests
- All API endpoints working with proper error handling
- All React components rendering correctly
- Discount application working end-to-end with Mercado Pago
- Analytics and reporting working correctly
- All tests passing (unit, integration, E2E)
- Code follows project standards and naming conventions
- CHANGELOG.md updated with all changes
- Git commit created and pushed
