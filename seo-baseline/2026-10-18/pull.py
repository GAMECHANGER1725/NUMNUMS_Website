import json, os, collections
from google.oauth2 import service_account
from google.auth.transport.requests import AuthorizedSession
creds = service_account.Credentials.from_service_account_file(os.path.expanduser("~/.config/claude-seo/numnums-sa.json"),scopes=["https://www.googleapis.com/auth/webmasters.readonly"])
s = AuthorizedSession(creds)
U="https://searchconsole.googleapis.com/webmasters/v3/sites/sc-domain%3Anumnumsbakery.com.au/searchAnalytics/query"
def q(dims,a,b,limit=25000):
    r=s.post(U,json={"startDate":a,"endDate":b,"dimensions":dims,"rowLimit":limit,"dataState":"all"}); r.raise_for_status(); return r.json().get("rows",[])
d=q(["date"],"2026-09-07","2026-10-18")
for r in d: print(r["keys"][0],int(r["clicks"]),int(r["impressions"]),round(r["position"],1))
json.dump(q(["page"],"2026-09-21","2026-10-18"),open("seo-baseline/2026-10-18/page_recent.json","w"))
json.dump(q(["query"],"2026-09-21","2026-10-18"),open("seo-baseline/2026-10-18/query_recent.json","w"))
