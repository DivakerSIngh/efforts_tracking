import urllib.request, json

BASE = 'http://localhost:8000'

def login(e, p):
    d = json.dumps({'email':e,'password':p}).encode()
    r = urllib.request.Request(BASE+'/api/auth/login', data=d, headers={'Content-Type':'application/json'})
    return json.loads(urllib.request.urlopen(r).read())['access_token']

token = login('alice@efforttracker.dev', 'Candidate@123')
print('Login OK')

# POST past month
d = json.dumps({'project_id':1,'entry_date':'2026-02-10','hours':6}).encode()
r = urllib.request.Request(BASE+'/api/timesheet', data=d, method='POST', headers={'Content-Type':'application/json','Authorization':'Bearer '+token})
try:
    resp = urllib.request.urlopen(r)
    print('POST', resp.getcode(), resp.read().decode()[:200])
except urllib.request.HTTPError as e:
    print('POST ERROR', e.code, e.read().decode()[:300])

# GET March
r = urllib.request.Request(BASE+'/api/timesheet?month=3&year=2026', headers={'Authorization':'Bearer '+token})
resp = urllib.request.urlopen(r)
rows = json.loads(resp.read())
print('GET March:', len(rows), 'rows', rows[0] if rows else '')
