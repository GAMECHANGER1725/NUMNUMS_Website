# B2: "eggless cake near me" across pages and devices, two 28-day windows.
import json, os
from google.oauth2 import service_account
from google.auth.transport.requests import AuthorizedSession
c=service_account.Credentials.from_service_account_file(os.path.expanduser("~/.config/claude-seo/numnums-sa.json"),scopes=["https://www.googleapis.com/auth/webmasters.readonly"])
s=AuthorizedSession(c)
U="https://searchconsole.googleapis.com/webmasters/v3/sites/sc-domain%3Anumnumsbakery.com.au/searchAnalytics/query"
Q="eggless cake near me"; W={"before":("2026-09-16","2026-10-13"),"after":("2026-10-14","2026-11-10")}
f=[{"dimension":"query","operator":"equals","expression":Q}]
out={}
for lab,(a,b) in W.items():
    for dims in ([],["device"],["page"],["device","page"]):
        r=s.post(U,json={"startDate":a,"endDate":b,"dimensions":dims,"rowLimit":100,"dataState":"all","dimensionFilterGroups":[{"filters":f}]}).json().get("rows",[])
        out[f"{lab}|{'x'.join(dims) or 'total'}"]=r
for lab in W:
    t=out[f"{lab}|total"][0]; print(f"\n{lab}: clicks {t['clicks']} impr {t['impressions']} pos {t['position']:.1f}")
    for r in out[f"{lab}|device"]: print("  ",r["keys"][0],r["clicks"],r["impressions"],round(r["position"],1))
    for r in sorted(out[f"{lab}|page"],key=lambda r:-r["impressions"])[:6]: print("    ",r["keys"][0].replace("https://numnumsbakery.com.au",""),r["clicks"],r["impressions"],round(r["position"],1))
json.dump(out,open(os.path.join(os.path.dirname(__file__),"b2_near_me.json"),"w"),indent=1)
