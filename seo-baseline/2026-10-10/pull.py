import json, sys, os
from google.oauth2 import service_account
from google.auth.transport.requests import AuthorizedSession
creds = service_account.Credentials.from_service_account_file(
    os.path.expanduser("~/.config/claude-seo/numnums-sa.json"),
    scopes=["https://www.googleapis.com/auth/webmasters.readonly"])
s = AuthorizedSession(creds)
SITE = "sc-domain%3Anumnumsbakery.com.au"
URL = f"https://searchconsole.googleapis.com/webmasters/v3/sites/{SITE}/searchAnalytics/query"
OUT = sys.argv[1]
def q(name, dims, start, end, dataState="final"):
    rows, start_row = [], 0
    while True:
        body = {"startDate": start, "endDate": end, "dimensions": dims,
                "rowLimit": 25000, "startRow": start_row, "dataState": dataState}
        r = s.post(URL, json=body)
        if r.status_code != 200:
            r = s.post(URL, json=body)  # retry once
        r.raise_for_status()
        got = r.json().get("rows", [])
        rows += got
        if len(got) < 25000: break
        start_row += 25000
    json.dump(rows, open(f"{OUT}/{name}.json", "w"))
    print(name, len(rows))
S, E = "2026-05-01", "2026-10-09"
#q("daily", ["date"], S, E, "all")
#q("daily_device", ["date", "device"], S, E, "all")
#q("daily_page", ["date", "page"], S, E, "all")
#q("daily_query", ["date", "query"], "2026-07-01", E, "all")
#q("daily_appearance", ["date","searchAppearance"], S, E, "all")
q("daily_country", ["date","country"], "2026-07-01", E, "all")
