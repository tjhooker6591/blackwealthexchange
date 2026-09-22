const fs=require('fs');
const rows=JSON.parse(fs.readFileSync('/Users/blackforge/workspace/bwe/repos/repo_clean/scripts/recovery/out/recovery-batch1-candidates-full-readonly.json','utf8'));
const ids=new Set(`67c9ead1818d604b84e5a472
681d1df4fd9719ad7b26dfa2
681d1df4fd9719ad7b26dfa8
681d1df4fd9719ad7b26dfb1
681d1df4fd9719ad7b26dfb2
681d1df4fd9719ad7b26dfb7
681d1df4fd9719ad7b26dfb8
681d1df4fd9719ad7b26dfbd
681d1df4fd9719ad7b26dfc2
681d1df4fd9719ad7b26dfc4
681d1df4fd9719ad7b26dfc5
681d1df4fd9719ad7b26dfc6
681d1df4fd9719ad7b26dfcb
681d1df4fd9719ad7b26dfce
681d1df4fd9719ad7b26dfda
681d1df4fd9719ad7b26dfdb
67c9ead1818d604b84e5a460
67c9ead1818d604b84e5a4af
67f73dec1d08a04e139a9d55
67f73dec1d08a04e139a9d11
67f73dec1d08a04e139a9d1e
67c9ead1818d604b84e5a580
67c9ead1818d604b84e5a4b3
67f73df01d08a04e139a9f11
67c9ead1818d604b84e5a5a0
67c9ead1818d604b84e5a503
67c9ead1818d604b84e5a584
67c9ead1818d604b84e5a5a1
67f73dec1d08a04e139a9d5d
67f73dec1d08a04e139a9daf
67c9ead1818d604b84e5a66d
67f73dec1d08a04e139a9e2a
67f73dec1d08a04e139a9e59
67f73dec1d08a04e139a9e32
67f73dec1d08a04e139a9e49`.trim().split(/\n/));
const sel=rows.filter(r=>ids.has(r._id)).map(r=>({
 _id:r._id,
 candidate_reason:r.candidate_reason,
 duplicate_status:r.duplicate_status,
 proposed_keys:Object.keys(r.proposed_values||{}),
 proposed_values:r.proposed_values,
 approval_readiness:r.approval_readiness,
 current_values:r.current_values
}));
console.log(JSON.stringify(sel,null,2));
