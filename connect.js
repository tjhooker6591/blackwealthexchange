// connect.js
//
// Phase 8 -- P8-10 Secrets & Cryptographic Material. This file previously
// contained a hardcoded, live production MongoDB Atlas connection string
// (embedded username + password) plus a hardcoded bcrypt hash for the
// owner account, committed to git since the repository's first commit.
// That is a Critical secret exposure -- removed here.
//
// Do NOT put live credentials in this file. Any script that needs a
// database connection must read MONGODB_URI (or MONGO_URI) from the
// environment. This file is kept as a harmless placeholder only because a
// handful of existing scripts read it as a fallback source when those env
// vars are absent (they always short-circuit past this fallback in every
// real environment, since MONGODB_URI is required by scripts/check-env.mjs).
//
// See docs/audit-evidence for the corresponding Phase 8 finding record.
// The exposed credential requires rotation in MongoDB Atlas -- an
// owner-only external action this file cannot perform.
