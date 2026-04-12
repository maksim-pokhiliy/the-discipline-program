---
name: database is empty and disposable
description: DB has no real data, can be wiped/recreated freely — no migration safety concerns
type: project
originSessionId: 6a54dedc-9e7e-4728-820b-34ae49babd86
---

Database is completely empty with zero valuable data.

**Why:** project is pre-launch, no real users or content yet.

**How to apply:** no need to worry about data migrations, backwards compatibility, or careful ALTER statements. Can `db:push` freely, drop and recreate, change enums without migration scripts. This status will change once real data exists.
