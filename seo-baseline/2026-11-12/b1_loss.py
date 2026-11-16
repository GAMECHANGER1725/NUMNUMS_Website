# B1: which queries left /blog/best-eggless-cake-shops-sydney-2026, and where they went.
import json, os, collections
from google.oauth2 import service_account
from google.auth.transport.requests import AuthorizedSession
c=service_account.Credentials.from_service_account_file(os.path.expanduser("~/.config/claude-seo/numnums-sa.json"),scopes=["https://www.googleapis.com/auth/webmasters.readonly"])
s=AuthorizedSession(c)
U="https://searchconsole.googleapis.com/webmasters/v3/sites/sc-domain%3Anumnumsbakery.com.au/searchAnalytics/query"
P="https://numnumsbakery.com.au/blog/best-eggless-cake-shops-sydney-2026"
def q(a,b,dims,flt=None):
    body={"startDate":a,"endDate":b,"dimensions":dims,"rowLimit":25000,"dataState":"all"}
    if flt: body["dimensionFilterGroups"]=[{"filters":flt}]
    r=s.post(U,json=body);r.raise_for_status();return r.json().get("rows",[])
A=("2026-09-16","2026-10-13"); B=("2026-10-14","2026-11-10")
pf=[{"dimension":"page","operator":"equals","expression":P}]
tot={k:q(*v,[],pf) for k,v in (("before",A),("after",B))}
before={r["keys"][0]:r for r in q(*A,["query"],pf)}; after={r["keys"][0]:r for r in q(*B,["query"],pf)}
print("totals",tot)
rows=[]
for k in set(before)|set(after):
    b=before.get(k,{}); a=after.get(k,{})
    rows.append((b.get("clicks",0)-a.get("clicks",0),k,b.get("clicks",0),a.get("clicks",0),b.get("impressions",0),a.get("impressions",0),b.get("position"),a.get("position")))
rows.sort(reverse=True)
print("query | clicks b→a | impr b→a | pos b→a")
for d,k,cb,ca,ib,ia,pb,pa in rows[:15]:
    print(f"{k} | {cb}→{ca} | {ib}→{ia} | {pb and round(pb,1)}→{pa and round(pa,1)}")
top=[r[1] for r in rows[:6]]
out={"totals":tot,"rows":rows[:40],"who_ranks":{}}
for k in top:
    w=q(*B,["page"],[{"dimension":"query","operator":"equals","expression":k}])
    out["who_ranks"][k]=w
    print("\n",k); [print("   ",r["keys"][0].replace("https://numnumsbakery.com.au",""),r["clicks"],r["impressions"],round(r["position"],1)) for r in sorted(w,key=lambda r:-r["impressions"])[:4]]
json.dump(out,open(os.path.join(os.path.dirname(__file__),"b1_loss.json"),"w"),indent=1)
