import json, os
from google.oauth2 import service_account
from google.auth.transport.requests import AuthorizedSession
creds = service_account.Credentials.from_service_account_file(os.path.expanduser("~/.config/claude-seo/numnums-sa.json"),
    scopes=["https://www.googleapis.com/auth/webmasters.readonly"])
s = AuthorizedSession(creds)
SITE="sc-domain%3Anumnumsbakery.com.au"
B=f"https://searchconsole.googleapis.com/webmasters/v3/sites/{SITE}"
def q(name, start, end):
    body={"startDate":start,"endDate":end,"dimensions":["query","page"],"rowLimit":25000,"dataState":"all"}
    r=s.post(B+"/searchAnalytics/query", json=body)
    if r.status_code!=200: r=s.post(B+"/searchAnalytics/query", json=body)
    r.raise_for_status(); rows=r.json().get("rows",[]); json.dump(rows,open(f"gsc/{name}.json","w")); print(name,len(rows))
q("qp_pre","2026-09-04","2026-09-20"); q("qp_post","2026-09-21","2026-10-07")
def inspect(u):
    body={"inspectionUrl":u,"siteUrl":"sc-domain:numnumsbakery.com.au"}
    r=s.post("https://searchconsole.googleapis.com/v1/urlInspection/index:inspect", json=body)
    if r.status_code!=200: r=s.post("https://searchconsole.googleapis.com/v1/urlInspection/index:inspect", json=body)
    if r.status_code!=200: print(u, "ERR", r.status_code, r.text[:200]); return
    ir=r.json()["inspectionResult"]["indexStatusResult"]
    print(u.replace("https://numnumsbakery.com.au",""), "|", ir.get("verdict"), "|", ir.get("coverageState"), "| crawled", ir.get("lastCrawlTime","")[:10], "| canon google:", (ir.get("googleCanonical") or "").replace("https://numnumsbakery.com.au",""), "user:", (ir.get("userCanonical") or "").replace("https://numnumsbakery.com.au",""))
for p in ["/","/order","/cakes","/indian-sweet","/locations","/blog/best-eggless-cake-shops-sydney-2026","/blog/photo-cake-sydney","/blog/number-cakes-sydney","/blog/eggless-cake-bakery-harris-park-riverstone-sydney","/blog/halal-friendly-cakes-eggless-sydney","/blog/dairy-free-vs-eggless-cakes","/blog/rasmalai-cake-sydney","/blog/eggless-cake-troubleshooting","/blog/kids-birthday-cake-sydney"]:
    inspect("https://numnumsbakery.com.au"+p)
r=s.get(B+"/sitemaps"); print(json.dumps([{k:x.get(k) for k in ("path","lastDownloaded","errors","warnings","isPending")} for x in r.json().get("sitemap",[])],indent=0))
