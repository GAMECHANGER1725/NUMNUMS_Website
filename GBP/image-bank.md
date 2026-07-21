# GBP Image Bank — Num Num's Bakery

Real bakery photos hosted at numnums-images.netlify.app (**340 images**).

**The pool below is deliberately stored in shuffled order, not sorted.** Do not re-sort it.
Sorted order was itself a repetition source: it put one image permanently at position #1 (so any
"take the first" code path picked the same photo forever), and it grouped consecutive filenames
(`IMG_0661/0662/0663`) that are the same cake from different angles. Shuffled order means even a
buggy first-entry pick now yields variety.

**Retired from the pool (do not re-add):**
- `0167032d-a343-456a-8e50-90022e501183.jpg` — the Elsa cake. Was entry #1 in sorted order and
  therefore shipped on nearly every GBP post from 14 June to 21 July 2026. Massively over-exposed;
  retired so no code path can select it again.
- `IMG_1849.jpg` — returns 404 on the CDN.

## How to pick an image (read this before every post)

**The only authority on what has been used is `GBP/used-images.txt`.** Read that file first.
Do NOT use `posts-queue.md` `media_items` as the used-image check — early posts recorded
Pexels stock URLs there, which never match a bank URL, so that check silently excludes nothing.

1. Read `GBP/used-images.txt` into a set.
2. Take the pool below, subtract that set → the *available* list.
3. **Pick at random from the available list. Do not take the first one.**
   The pool is stored shuffled precisely so a first-entry pick is no longer catastrophic,
   but random selection is still the rule — it is the only thing that guarantees variety.

   ⚠️ **Use the URL exactly as written, including any `%20` or `%28`.** Seven filenames
   contain spaces or brackets and are stored percent-encoded. A raw space makes the URL
   invalid, the image fails to fetch, and the post either fails or silently loses its photo.
4. 🚨 **Append the chosen URL to `GBP/used-images.txt`, commit it, and push it — in the
   same run, BEFORE or immediately after you publish. This is not optional and it is not
   the workflow's job.**

   This is the step that was missing, and it is the entire reason every post shipped with
   the same photo. **You have two publish paths, and only one of them touches git:**

   | Publish path | Does `used-images.txt` get updated? |
   |---|---|
   | Write `GBP/outbox/*.json` → GitHub Actions posts it | Yes — the workflow appends as a backstop |
   | **POST straight to the Make.com webhook** | **NO — nothing is recorded unless you do it yourself** |

   The routine currently uses the **direct webhook path** (confirmed 2026-07-21: posts are
   still going live, but there has been no GBP commit since 14 June). On that path the
   workflow never runs, so if you do not commit `used-images.txt` yourself, the next run
   reads the same file, computes the same "available" list, and picks the same photo —
   forever. **Publishing without committing the image is the bug.**

5. If the available list is empty, all 340 are exhausted: clear `used-images.txt` and
   start a fresh cycle.

⚠️ **Failure history:** from 14 June 2026 until this was fixed, nearly every post shipped with
`0167032d-a343-456a-8e50-90022e501183.jpg` (the Elsa cake) — the first URL in the sorted pool.
Several faults stacked: the publisher's queue-update step was a silent no-op (fixed in
`.github/workflows/gbp-post.yml`); the routine publishes **directly** to the webhook, so that
workflow never ran anyway; the old instructions pointed the used-image check at
`posts-queue.md` `media_items`, which held only stock URLs and so excluded nothing; and the
pool was sorted, pinning one photo at position #1. That image is now retired outright.

**Still unexplained (2026-07-21):** Harris Park alternates between a correct varied photo and
the Elsa cake, while Riverstone rotates correctly. Same rules files, same bank — so the
difference is in the Harris Park routine's own prompt, which does not live in this repo. If
Elsa reappears after this change, that prompt is the place to look; the image is no longer in
the pool, so any post still using it is reading a hardcoded value, not selecting from here.

## Image Pool

```
https://numnums-images.netlify.app/IMG_0920.jpg
https://numnums-images.netlify.app/IMG_3787.jpeg
https://numnums-images.netlify.app/IMG_1865.jpg
https://numnums-images.netlify.app/IMG_1627.jpg
https://numnums-images.netlify.app/IMG_1802%202.jpg
https://numnums-images.netlify.app/IMG_1644.jpg
https://numnums-images.netlify.app/IMG_9081.jpeg
https://numnums-images.netlify.app/IMG_1735.jpg
https://numnums-images.netlify.app/IMG_1890.jpg
https://numnums-images.netlify.app/IMG_1599.jpg
https://numnums-images.netlify.app/IMG_1900.jpg
https://numnums-images.netlify.app/e82e7e7e-0f93-4534-ae31-9daf2fde4a96.jpg
https://numnums-images.netlify.app/IMG_4476.jpeg
https://numnums-images.netlify.app/IMG_0666.jpg
https://numnums-images.netlify.app/IMG_1798.jpg
https://numnums-images.netlify.app/IMG_5610.jpeg
https://numnums-images.netlify.app/IMG_1559.jpg
https://numnums-images.netlify.app/IMG_1034.jpg
https://numnums-images.netlify.app/IMG_1649.jpg
https://numnums-images.netlify.app/IMG_1670.jpg
https://numnums-images.netlify.app/IMG_1658.jpg
https://numnums-images.netlify.app/IMG_1640.jpg
https://numnums-images.netlify.app/IMG_1853.jpg
https://numnums-images.netlify.app/IMG_0995.jpg
https://numnums-images.netlify.app/IMG_5752.jpeg
https://numnums-images.netlify.app/IMG_1856.jpg
https://numnums-images.netlify.app/IMG_1661.jpg
https://numnums-images.netlify.app/IMG_1895.jpg
https://numnums-images.netlify.app/IMG_0780.jpg
https://numnums-images.netlify.app/IMG_5178.jpeg
https://numnums-images.netlify.app/IMG_0847.jpg
https://numnums-images.netlify.app/IMG_3522.jpeg
https://numnums-images.netlify.app/IMG_1256.jpg
https://numnums-images.netlify.app/IMG_8892.jpeg
https://numnums-images.netlify.app/IMG_1921.jpg
https://numnums-images.netlify.app/IMG_1214.jpg
https://numnums-images.netlify.app/IMG_5609.jpeg
https://numnums-images.netlify.app/IMG_1597.jpg
https://numnums-images.netlify.app/IMG_1647.jpg
https://numnums-images.netlify.app/fba9d13b-de7c-4478-87ae-75792b2ade8a.jpg
https://numnums-images.netlify.app/IMG_1924.jpg
https://numnums-images.netlify.app/IMG_1845.jpg
https://numnums-images.netlify.app/IMG_1379.jpg
https://numnums-images.netlify.app/IMG_0690.jpg
https://numnums-images.netlify.app/IMG_1586.jpg
https://numnums-images.netlify.app/IMG_1903.jpg
https://numnums-images.netlify.app/IMG_1897.jpg
https://numnums-images.netlify.app/IMG_1524.jpeg
https://numnums-images.netlify.app/IMG_1922.jpg
https://numnums-images.netlify.app/IMG_1628.jpg
https://numnums-images.netlify.app/IMG_1916.jpg
https://numnums-images.netlify.app/IMG_2045.jpg
https://numnums-images.netlify.app/IMG_1765.jpeg
https://numnums-images.netlify.app/IMG_5587.jpeg
https://numnums-images.netlify.app/801ab1ad-3cf4-4369-84e5-3e754e74e784.jpg
https://numnums-images.netlify.app/IMG_1802.jpg
https://numnums-images.netlify.app/IMG_1957.jpg
https://numnums-images.netlify.app/IMG_0912.jpg
https://numnums-images.netlify.app/IMG_1914%202.jpg
https://numnums-images.netlify.app/IMG_5751.jpeg
https://numnums-images.netlify.app/IMG_1781.jpg
https://numnums-images.netlify.app/IMG_5592.jpeg
https://numnums-images.netlify.app/IMG_1614.jpg
https://numnums-images.netlify.app/a563d3a6-e255-4614-ac91-464071a5caea.jpg
https://numnums-images.netlify.app/a15401ca-441e-44c5-831d-b89886eb274c.jpg
https://numnums-images.netlify.app/IMG_5622.jpeg
https://numnums-images.netlify.app/IMG_1875%202.jpg
https://numnums-images.netlify.app/IMG_1292.jpg
https://numnums-images.netlify.app/IMG_0967.jpg
https://numnums-images.netlify.app/IMG_1874.jpg
https://numnums-images.netlify.app/IMG_0695.jpg
https://numnums-images.netlify.app/IMG_1616.jpg
https://numnums-images.netlify.app/IMG_0963.jpg
https://numnums-images.netlify.app/IMG_1660.jpg
https://numnums-images.netlify.app/IMG_1905.jpg
https://numnums-images.netlify.app/IMG_1638.jpg
https://numnums-images.netlify.app/IMG_8895.jpeg
https://numnums-images.netlify.app/IMG_1855.jpg
https://numnums-images.netlify.app/IMG_1623.jpg
https://numnums-images.netlify.app/IMG_1350.jpg
https://numnums-images.netlify.app/IMG_1855%202.jpg
https://numnums-images.netlify.app/IMG_0919.jpg
https://numnums-images.netlify.app/IMG_1858.jpg
https://numnums-images.netlify.app/IMG_5589.jpeg
https://numnums-images.netlify.app/IMG_1919.jpg
https://numnums-images.netlify.app/IMG_1534.jpg
https://numnums-images.netlify.app/IMG_0973.jpg
https://numnums-images.netlify.app/0c46a576-1554-42c9-9789-dc22117eb8f4.jpeg
https://numnums-images.netlify.app/IMG_1656.jpg
https://numnums-images.netlify.app/IMG_0662.jpg
https://numnums-images.netlify.app/IMG_5181.jpeg
https://numnums-images.netlify.app/3a7d5d42-367e-4c9a-967b-ca7e84a537d2.jpg
https://numnums-images.netlify.app/IMG_1938.jpg
https://numnums-images.netlify.app/IMG_1770.jpg
https://numnums-images.netlify.app/IMG_1913.jpg
https://numnums-images.netlify.app/IMG_1892.jpg
https://numnums-images.netlify.app/IMG_1016.jpg
https://numnums-images.netlify.app/IMG_0758.jpg
https://numnums-images.netlify.app/IMG_1988.jpg
https://numnums-images.netlify.app/IMG_0841.jpg
https://numnums-images.netlify.app/78279299-9210-4a39-9b3c-3533eb74560f.jpg
https://numnums-images.netlify.app/IMG_1882.jpg
https://numnums-images.netlify.app/IMG_1652.jpg
https://numnums-images.netlify.app/IMG_1949.jpg
https://numnums-images.netlify.app/IMG_1768.jpg
https://numnums-images.netlify.app/IMG_1940.jpg
https://numnums-images.netlify.app/IMG_1603.jpg
https://numnums-images.netlify.app/IMG_1216.jpeg
https://numnums-images.netlify.app/IMG_5600.jpeg
https://numnums-images.netlify.app/IMG_1646.jpg
https://numnums-images.netlify.app/IMG_2234.jpeg
https://numnums-images.netlify.app/IMG_1593.jpg
https://numnums-images.netlify.app/IMG_1481.jpg
https://numnums-images.netlify.app/IMG_1898.jpg
https://numnums-images.netlify.app/IMG_5597.jpeg
https://numnums-images.netlify.app/IMG_1875.jpg
https://numnums-images.netlify.app/IMG_1602.jpg
https://numnums-images.netlify.app/IMG_1439.jpg
https://numnums-images.netlify.app/IMG_0968.jpg
https://numnums-images.netlify.app/IMG_5584.jpeg
https://numnums-images.netlify.app/IMG_5594.jpeg
https://numnums-images.netlify.app/IMG_1803.jpg
https://numnums-images.netlify.app/IMG_5595.jpeg
https://numnums-images.netlify.app/IMG_1958.jpg
https://numnums-images.netlify.app/IMG_1692.jpg
https://numnums-images.netlify.app/IMG_1170.jpg
https://numnums-images.netlify.app/IMG_0930.jpg
https://numnums-images.netlify.app/IMG_1933.jpg
https://numnums-images.netlify.app/IMG_1538.jpeg
https://numnums-images.netlify.app/IMG_1932.jpg
https://numnums-images.netlify.app/IMG_1634.jpg
https://numnums-images.netlify.app/IMG_1773.jpg
https://numnums-images.netlify.app/IMG_1713.jpg
https://numnums-images.netlify.app/IMG_1906.jpg
https://numnums-images.netlify.app/IMG_1907.jpg
https://numnums-images.netlify.app/152e0928-1673-4d83-9ff8-1a689e866f5a.jpg
https://numnums-images.netlify.app/IMG_1730.jpg
https://numnums-images.netlify.app/IMG_1869.jpg
https://numnums-images.netlify.app/IMG_5623.jpeg
https://numnums-images.netlify.app/IMG_1641.jpg
https://numnums-images.netlify.app/IMG_1691.jpeg
https://numnums-images.netlify.app/IMG_1883.jpg
https://numnums-images.netlify.app/IMG_2063.jpg
https://numnums-images.netlify.app/b1ac5886-1bcb-4d3e-b4ba-53c0ee85c29e.jpg
https://numnums-images.netlify.app/IMG_1925.jpg
https://numnums-images.netlify.app/IMG_1914.jpg
https://numnums-images.netlify.app/IMG_2406.jpeg
https://numnums-images.netlify.app/IMG_1038.jpg
https://numnums-images.netlify.app/IMG_1757.jpg
https://numnums-images.netlify.app/IMG_0928.jpg
https://numnums-images.netlify.app/IMG_1910.jpg
https://numnums-images.netlify.app/IMG_1620.jpg
https://numnums-images.netlify.app/IMG_0793.jpg
https://numnums-images.netlify.app/IMG_1618.jpg
https://numnums-images.netlify.app/IMG_1844.jpg
https://numnums-images.netlify.app/IMG_5753.jpeg
https://numnums-images.netlify.app/IMG_1918.jpg
https://numnums-images.netlify.app/IMG_5750.jpeg
https://numnums-images.netlify.app/IMG_0860.jpg
https://numnums-images.netlify.app/IMG_2022.jpg
https://numnums-images.netlify.app/IMG_1993.jpg
https://numnums-images.netlify.app/IMG_1550.jpg
https://numnums-images.netlify.app/IMG_0668.jpg
https://numnums-images.netlify.app/IMG_1048.jpg
https://numnums-images.netlify.app/IMG_1621.jpg
https://numnums-images.netlify.app/IMG_1629.jpg
https://numnums-images.netlify.app/8453f154-2848-4b86-9433-91cf698e8d7a.jpeg
https://numnums-images.netlify.app/IMG_1669.jpg
https://numnums-images.netlify.app/IMG_1575.jpg
https://numnums-images.netlify.app/IMG_0900.jpg
https://numnums-images.netlify.app/IMG_1622.jpg
https://numnums-images.netlify.app/IMG_1592.jpg
https://numnums-images.netlify.app/IMG_1935.jpg
https://numnums-images.netlify.app/IMG_0824.jpg
https://numnums-images.netlify.app/IMG_0733.jpg
https://numnums-images.netlify.app/IMG_1302.jpg
https://numnums-images.netlify.app/IMG_1783.jpg
https://numnums-images.netlify.app/IMG_1642.jpg
https://numnums-images.netlify.app/IMG_1026.jpg
https://numnums-images.netlify.app/IMG_2127.jpeg
https://numnums-images.netlify.app/IMG_0976.jpg
https://numnums-images.netlify.app/IMG_1594.jpg
https://numnums-images.netlify.app/IMG_1917.jpg
https://numnums-images.netlify.app/IMG_1931.jpg
https://numnums-images.netlify.app/IMG_0825.jpg
https://numnums-images.netlify.app/IMG_1929.jpg
https://numnums-images.netlify.app/IMG_5596.jpeg
https://numnums-images.netlify.app/IMG_1645.jpg
https://numnums-images.netlify.app/IMG_1881.jpg
https://numnums-images.netlify.app/IMG_1659.jpg
https://numnums-images.netlify.app/IMG_1725.jpg
https://numnums-images.netlify.app/IMG_1639.jpg
https://numnums-images.netlify.app/IMG_0997.jpg
https://numnums-images.netlify.app/IMG_1605.jpg
https://numnums-images.netlify.app/IMG_1927.jpg
https://numnums-images.netlify.app/5574233e-6a0d-461e-b347-0086b222990b.jpg
https://numnums-images.netlify.app/IMG_1643.jpg
https://numnums-images.netlify.app/IMG_1493.jpeg
https://numnums-images.netlify.app/IMG_5749.jpeg
https://numnums-images.netlify.app/IMG_1756.jpg
https://numnums-images.netlify.app/IMG_1283.jpg
https://numnums-images.netlify.app/IMG_1928.jpg
https://numnums-images.netlify.app/IMG_0794.jpg
https://numnums-images.netlify.app/IMG_1285.jpg
https://numnums-images.netlify.app/IMG_2264.jpeg
https://numnums-images.netlify.app/IMG_1920.jpg
https://numnums-images.netlify.app/IMG_5607.jpeg
https://numnums-images.netlify.app/IMG_0924.jpg
https://numnums-images.netlify.app/IMG_1849%202.jpg
https://numnums-images.netlify.app/IMG_1633.jpg
https://numnums-images.netlify.app/IMG_1950.jpg
https://numnums-images.netlify.app/IMG_1195.jpg
https://numnums-images.netlify.app/IMG_0985.jpg
https://numnums-images.netlify.app/IMG_1911.jpg
https://numnums-images.netlify.app/IMG_1941.jpg
https://numnums-images.netlify.app/IMG_1615.jpg
https://numnums-images.netlify.app/IMG_1851.jpg
https://numnums-images.netlify.app/IMG_8124.jpeg
https://numnums-images.netlify.app/IMG_1080.jpg
https://numnums-images.netlify.app/IMG_0746.jpg
https://numnums-images.netlify.app/IMG_1941%202.jpg
https://numnums-images.netlify.app/IMG_1617.jpg
https://numnums-images.netlify.app/IMG_1630.jpg
https://numnums-images.netlify.app/IMG_5748.jpeg
https://numnums-images.netlify.app/IMG_1624.jpg
https://numnums-images.netlify.app/IMG_1859.jpg
https://numnums-images.netlify.app/IMG_0719.jpg
https://numnums-images.netlify.app/IMG_1947.jpg
https://numnums-images.netlify.app/IMG_0691.jpg
https://numnums-images.netlify.app/IMG_0766.jpg
https://numnums-images.netlify.app/IMG_1589.jpg
https://numnums-images.netlify.app/IMG_1590.jpg
https://numnums-images.netlify.app/IMG_1607.jpg
https://numnums-images.netlify.app/IMG_5593.jpeg
https://numnums-images.netlify.app/IMG_1044.jpg
https://numnums-images.netlify.app/IMG_1665.jpg
https://numnums-images.netlify.app/IMG_0761.jpg
https://numnums-images.netlify.app/IMG_1785.jpg
https://numnums-images.netlify.app/IMG_1554.jpg
https://numnums-images.netlify.app/IMG_1574.jpg
https://numnums-images.netlify.app/401a2d16-3089-4866-93b3-9810506bb7e7.jpeg
https://numnums-images.netlify.app/IMG_0760.jpg
https://numnums-images.netlify.app/IMG_0670.jpg
https://numnums-images.netlify.app/IMG_1619.jpg
https://numnums-images.netlify.app/IMG_1694.jpeg
https://numnums-images.netlify.app/931bb63f-057f-4a2f-8e8e-4fd2cb310bd8.jpg
https://numnums-images.netlify.app/IMG_7611.jpeg
https://numnums-images.netlify.app/c0a6e876-ed22-4515-9c4f-da46315ed653.jpg
https://numnums-images.netlify.app/IMG_1585.jpg
https://numnums-images.netlify.app/IMG_1370.jpg
https://numnums-images.netlify.app/IMG_1995.jpg
https://numnums-images.netlify.app/IMG_0972.jpeg
https://numnums-images.netlify.app/IMG_1825.jpg
https://numnums-images.netlify.app/IMG_1708.jpg
https://numnums-images.netlify.app/IMG_1009.jpg
https://numnums-images.netlify.app/IMG_1999.jpg
https://numnums-images.netlify.app/IMG_1884.jpg
https://numnums-images.netlify.app/IMG_0730.jpg
https://numnums-images.netlify.app/IMG_0960.jpg
https://numnums-images.netlify.app/IMG_5469.jpeg
https://numnums-images.netlify.app/IMG_1863.jpg
https://numnums-images.netlify.app/IMG_1899.jpg
https://numnums-images.netlify.app/IMG_0663.jpg
https://numnums-images.netlify.app/IMG_1648.jpg
https://numnums-images.netlify.app/IMG_0664.jpg
https://numnums-images.netlify.app/IMG_1339.jpg
https://numnums-images.netlify.app/IMG_1809.jpg
https://numnums-images.netlify.app/IMG_1864.jpg
https://numnums-images.netlify.app/IMG_2168.jpeg
https://numnums-images.netlify.app/IMG_0423.jpeg
https://numnums-images.netlify.app/IMG_1367.jpg
https://numnums-images.netlify.app/IMG_1657.jpg
https://numnums-images.netlify.app/IMG_1635.jpg
https://numnums-images.netlify.app/IMG_0901.jpg
https://numnums-images.netlify.app/5612b393-3aae-4d26-b680-b6433da1b83d.jpeg
https://numnums-images.netlify.app/e20dd169-7062-423a-a7c0-7c42d893a0d9.jpeg
https://numnums-images.netlify.app/IMG_1609.jpg
https://numnums-images.netlify.app/IMG_5625.jpeg
https://numnums-images.netlify.app/a4e91d9b-8063-478b-862f-5ba9e5224e69.jpg
https://numnums-images.netlify.app/6466c09f-02d3-4981-8b65-6dcd112d4c97.jpeg
https://numnums-images.netlify.app/IMG_1655.jpg
https://numnums-images.netlify.app/IMG_1187.jpg
https://numnums-images.netlify.app/IMG_5606.jpeg
https://numnums-images.netlify.app/IMG_0676.jpg
https://numnums-images.netlify.app/a890844b-47c8-4af0-bac1-d9f75ef765f4.jpg
https://numnums-images.netlify.app/IMG_1768%20%281%29.jpg
https://numnums-images.netlify.app/IMG_0661.jpg
https://numnums-images.netlify.app/IMG_0966.jpg
https://numnums-images.netlify.app/IMG_1497.jpg
https://numnums-images.netlify.app/IMG_1247.jpg
https://numnums-images.netlify.app/IMG_0685.jpg
https://numnums-images.netlify.app/IMG_1915.jpg
https://numnums-images.netlify.app/IMG_1987.jpg
https://numnums-images.netlify.app/IMG_1879.jpg
https://numnums-images.netlify.app/IMG_1769.jpg
https://numnums-images.netlify.app/IMG_1759.jpg
https://numnums-images.netlify.app/IMG_1625.jpg
https://numnums-images.netlify.app/IMG_2170.jpeg
https://numnums-images.netlify.app/IMG_0687.jpg
https://numnums-images.netlify.app/IMG_1930.jpg
https://numnums-images.netlify.app/IMG_1636.jpg
https://numnums-images.netlify.app/18105858-3825-4865-92bc-a2900026339f.jpg
https://numnums-images.netlify.app/IMG_1951.jpg
https://numnums-images.netlify.app/IMG_1672.jpg
https://numnums-images.netlify.app/IMG_1473.jpg
https://numnums-images.netlify.app/IMG_5598.jpeg
https://numnums-images.netlify.app/3e3cb5cc-31a2-4a1e-9c60-55735dd2ec67.jpeg
https://numnums-images.netlify.app/IMG_1867.jpg
https://numnums-images.netlify.app/d90ed8b9-5693-411a-8622-ed7367555948.jpg
https://numnums-images.netlify.app/IMG_1280.jpg
https://numnums-images.netlify.app/IMG_0827.jpg
https://numnums-images.netlify.app/IMG_1329.jpg
https://numnums-images.netlify.app/IMG_1626.jpg
https://numnums-images.netlify.app/IMG_5591.jpeg
https://numnums-images.netlify.app/IMG_8693.jpeg
https://numnums-images.netlify.app/IMG_1946.jpg
https://numnums-images.netlify.app/355d3ac4-332c-4255-a5ea-c0589a756274.jpg
https://numnums-images.netlify.app/IMG_1923.jpg
https://numnums-images.netlify.app/IMG_1637.jpg
https://numnums-images.netlify.app/IMG_1780.jpg
https://numnums-images.netlify.app/IMG_2263.jpeg
https://numnums-images.netlify.app/IMG_5599.jpeg
https://numnums-images.netlify.app/IMG_0903.jpg
https://numnums-images.netlify.app/IMG_5605.jpeg
https://numnums-images.netlify.app/IMG_1837.jpg
https://numnums-images.netlify.app/IMG_1608.jpg
https://numnums-images.netlify.app/IMG_1338.jpg
https://numnums-images.netlify.app/IMG_8503.jpeg
https://numnums-images.netlify.app/IMG_0994.jpg
https://numnums-images.netlify.app/IMG_5588.jpeg
https://numnums-images.netlify.app/IMG_1894.jpg
https://numnums-images.netlify.app/IMG_1569.jpg
https://numnums-images.netlify.app/2c503159-e591-4e16-bea5-6aabda8958aa.jpg
https://numnums-images.netlify.app/IMG_1912.jpg
https://numnums-images.netlify.app/IMG_1632.jpg
https://numnums-images.netlify.app/IMG_1854.jpg
https://numnums-images.netlify.app/IMG_1850.jpg
https://numnums-images.netlify.app/IMG_1800.jpg
https://numnums-images.netlify.app/IMG_1415.jpg
https://numnums-images.netlify.app/IMG_5616.jpeg
```

## Notes
- 342 real Num Num's Bakery photos, hosted on Netlify CDN
- To add more: resize with `sips -Z 1200 photo.jpg --out deploy/photo.jpg`, deploy via `netlify deploy --dir=numnums-images-deploy --site=6b0b9160-4085-432e-bc55-7ac9bcfeb70f --prod`, then add URLs here
- If all 342 are exhausted (~3.3 years at 2 posts/week per location), cycle back to the first
