# Release Ready Package

## Candidate commit
- primary: 8ba2c2a
- rollback target: c3b1e60

## Required checks
- npm run lint
- npm run build
- npm run smoke:routes
- npm run check:critical-indexes
- npm run check:db-docs
- npm run check:p2-regression
- npm run check:vertical-regression

## Env diff checklist
- MONGODB_URI
- MONGODB_DB
- JWT_SECRET
- NEXTAUTH_SECRET
- RESET_TOKEN_SECRET
- NEXTAUTH_URL
- APP_URL
- NEXT_PUBLIC_APP_URL

## Deployment steps
1. Ensure clean working tree
2. Run full checks above on candidate commit
3. Promote same commit to preview/QA
4. Re-run checks and smoke on preview
5. Promote identical commit to production
6. Run post-deploy smoke and header checks

## DB/index note
- run 
  - npm run check:critical-indexes
- verify password reset TTL and alias_approved_unique
