# Per-page query pull for the SEO loop. Usage: python3 page_queries.py <path> [days]
import json, os, sys, datetime as dt
from google.oauth2 import service_account
from google.auth.transport.requests import AuthorizedSession
c=service_account.Credentials.from_service_account_file(os.path.expanduser("~/.config/claude-seo/numnums-sa.json"),scopes=["https://www.googleapis.com/auth/webmasters.readonly"])
s=AuthorizedSession(c)
U="https://searchconsole.googleapis.com/webmasters/v3/sites/sc-domain%3Anumnumsbakery.com.au/searchAnalytics/query"
path=sys.argv[1]; days=int(sys.argv[2]) if len(sys.argv)>2 else 28
end=dt.date.today()-dt.timedelta(days=2); start=end-dt.timedelta(days=days-1)
url="https://numnumsbakery.com.au"+path
def q(dims,flt):
    r=s.post(U,json={"startDate":str(start),"endDate":str(end),"dimensions":dims,"rowLimit":1000,"dataState":"all","dimensionFilterGroups":[{"filters":flt}]});r.raise_for_status()
    return r.json().get("rows",[])
tot=q([],[{"dimension":"page","operator":"equals","expression":url}])
rows=q(["query"],[{"dimension":"page","operator":"equals","expression":url}])
out={"page":path,"start":str(start),"end":str(end),"total":tot,"queries":rows}
json.dump(out,open(os.path.join(os.path.dirname(__file__),path.strip("/").replace("/","__")+".json"),"w"),indent=1)
print(start,end,tot)
for r in sorted(rows,key=lambda r:-r["impressions"])[:40]:
    print(f'{r["impressions"]:6} {r["clicks"]:4} {r["position"]:5.1f}  {r["keys"][0]}')
