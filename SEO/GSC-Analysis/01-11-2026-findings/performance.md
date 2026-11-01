# Performance (2026-11-01) - lab only (PSI v5, Lighthouse 13.x); no field data
Score: ~85/100 (mean mobile lab, 8 URLs; range 72-98). Last month 55 -> improved ~+30.
CrUX: HTTP 403 PERMISSION_DENIED reason API_KEY_SERVICE_BLOCKED (consumer projects/96266000644). Key is restricted and excludes chromeuxreport.googleapis.com; service-account auth OK does not cover the API key path. PSI loadingExperience also empty (no field data returned).
| URL | Perf | LCP | CLS | TBT | FCP | SI |
| / (m) | 83 | 2.9s | 0 | 240ms | 2.9s | 4.7s |
| / (desktop) | 97 | 1.1s | 0.031 | 30ms | 0.8s | 1.1s |
| /order | 89 | 2.7s | 0 | 60ms | 2.7s | 4.9s |
| /indian-sweet | 80 | 2.9s | 0 | 350ms | 2.9s | 4.6s |
| /locations | 72 | 2.9s | 0 | 550ms | 2.9s | 5.3s |
| /blog/ | 90 | 2.7s | 0 | 100ms | 2.7s | 3.6s |
| /blog/eggless-cake-bakery-harris-park-riverstone-sydney | 98 | 0.9s | 0.003 | 180ms | 0.9s | 1.7s |
| /blog/best-eggless-cake-shops-sydney-2026 | 87 | 2.7s | 0 | 120ms | 2.7s | 4.9s |
| /about | 82 | 2.9s | 0 | 290ms | 2.9s | 4.9s |
