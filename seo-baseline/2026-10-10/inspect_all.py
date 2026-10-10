import json, os, re, concurrent.futures as cf
from google.oauth2 import service_account
from google.auth.transport.requests import AuthorizedSession
c=service_account.Credentials.from_service_account_file(os.path.expanduser("~/.config/claude-seo/numnums-sa.json"),scopes=["https://www.googleapis.com/auth/webmasters.readonly"])
s=AuthorizedSession(c)
urls=re.findall(r"<loc>([^<]+)</loc>", open("sitemap.xml").read())
def ins(u):
    for _ in range(2):
        r=s.post("https://searchconsole.googleapis.com/v1/urlInspection/index:inspect",json={"inspectionUrl":u,"siteUrl":"sc-domain:numnumsbakery.com.au"})
        if r.status_code==200:
            x=r.json()["inspectionResult"]["indexStatusResult"]; return u,x.get("coverageState"),x.get("lastCrawlTime","")[:10]
    return u,f"ERR {r.status_code}",""
with cf.ThreadPoolExecutor(6) as ex: res=list(ex.map(ins,urls))
json.dump(res,open(os.environ["SP"]+"/inspect_all.json","w"))
from collections import Counter
print(Counter(r[1] for r in res))
for u,st,lc in sorted(res,key=lambda r:r[1]):
    if st!="Submitted and indexed": print(st,"|",lc,"|",u.replace("https://numnumsbakery.com.au",""))
