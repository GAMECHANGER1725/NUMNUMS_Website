import json, os, re, datetime as dt, collections
from google.oauth2 import service_account
from google.auth.transport.requests import AuthorizedSession
c=service_account.Credentials.from_service_account_file(os.path.expanduser("~/.config/claude-seo/numnums-sa.json"),scopes=["https://www.googleapis.com/auth/webmasters.readonly","https://www.googleapis.com/auth/analytics.readonly"])
s=AuthorizedSession(c); O="seo-baseline/2026-11-07/"
U="https://searchconsole.googleapis.com/webmasters/v3/sites/sc-domain%3Anumnumsbakery.com.au/searchAnalytics/query"
def q(dims,a,b):
    rows,st=[],0
    while True:
        r=s.post(U,json={"startDate":a,"endDate":b,"dimensions":dims,"rowLimit":25000,"startRow":st,"dataState":"all"});r.raise_for_status()
        g=r.json().get("rows",[]);rows+=g
        if len(g)<25000:return rows
        st+=25000
daily=q(["date"],"2026-08-03","2026-11-07"); json.dump(daily,open(O+"daily.json","w"))
dq=q(["date","query"],"2026-08-03","2026-11-07"); json.dump(dq,open(O+"daily_query.json","w"))
dp=q(["date","page"],"2026-08-03","2026-11-07"); json.dump(dp,open(O+"daily_page.json","w"))
print("last day", daily[-1]["keys"][0], daily[-1])
# GA4
G="https://analyticsdata.googleapis.com/v1beta/properties/531794710:runReport"
r=s.post(G,json={"dateRanges":[{"startDate":"2026-08-03","endDate":"2026-11-06"}],"dimensions":[{"name":"isoYearIsoWeek"},{"name":"sessionDefaultChannelGroup"}],"metrics":[{"name":"sessions"},{"name":"keyEvents"}],"limit":10000})
json.dump(r.json(),open(O+"ga4_weekly_channel.json","w"))
r=s.post(G,json={"dateRanges":[{"startDate":"2026-09-01","endDate":"2026-11-06"}],"dimensions":[{"name":"isoYearIsoWeek"},{"name":"eventName"}],"metrics":[{"name":"eventCount"}],"dimensionFilter":{"filter":{"fieldName":"sessionDefaultChannelGroup","stringFilter":{"value":"Organic Search"}}},"limit":10000})
json.dump(r.json(),open(O+"ga4_organic_events.json","w"))
