import sys,json
sys.path.insert(0,__import__('os').path.dirname(__import__('os').path.abspath(__file__)))
from gen import call,M
from cybakawa.core import templates as T
from delta.apps import builtin
from delta import bindings as B
import fastapi
# scenario
ids=[]
for t in T.catalog():
    s,w=call('POST',f"/templates/{t['key']}/use",{"values":{}});ids.append(w['id'])
for wid in ids[:2]: call('POST',f'/workflows/{wid}/start')
apps={a['name']:a for a in builtin.BUILTIN_APPS}
binds=[("acme","respond","ticket","zammad",{"defaults":{"group":"SOC"}}),("acme","respond","chat","teams",{}),("acme","respond","mail","mail",{}),
       ("acme","normalize","siem","wazuh",{"source_name":"wazuh-acme-prod"}),
       ("globex","respond","ticket","jira",{"defaults":{"project":"SEC"}}),("globex","respond","chat","webex",{}),("globex","normalize","siem","splunk",{"source_name":"splunk-globex"}),
       ("*","respond","mail","mail",{}),("initech","respond","chat","nextcloud_talk",{}),("initech","normalize","webhook","webhook_in",{"source_name":"initech-edr"})]
for c,s,ch,a,cfg in binds:
    st,r=call('POST','/bindings',{"customer":c,"side":s,"channel":ch,"app":a,"config":cfg});assert st==200,(st,r)
st,k=call('POST','/bindings/acme/normalize/siem/key',{})
ev={"alert":{"title":"Brute force on vpn-gw-01","severity":"critical","id":"A-1042"},"host":{"name":"vpn-gw-01"},"customer":{"id":"acme"},"source":{"ip":"203.0.113.77"},"case":{"id":"C-311","title":"Suspicious logins"}}
for wid in ids:
    for e in (ev,{**ev,"alert":{**ev["alert"],"severity":"low"}}):
        call('POST',f'/workflows/{wid}/run',{"dry_run":True,"event":e})
store=M.store
TPL=[{**t} for t in T.TEMPLATES]
fx={"meta":call('GET','/meta')[1],"templates_raw":TPL,"apps_full":store.list_apps(),"workflows_full":store.list_workflows(),
    "bindings":store.list_bindings(),"runs":store.list_runs(None,500),"products":call('GET','/products')[1],"spaces":call('GET','/spaces')[1],
    "channels_def":{"normalize":B.NORMALIZE_CHANNELS,"respond":B.RESPOND_CHANNELS},"mappings":{n:__import__('delta').mappings.for_app(n) for n in __import__('delta').mappings.known()},
    "canonical":__import__('delta').mappings.CANONICAL,"verbs":{}}
from delta import spec
for side,chs in fx["channels_def"].items():
    for k,_ in chs: fx["verbs"][k]=list(spec.verbs_for(k))
fx["meta"]["store"]={"kind":"demo","keeps_data":True,"single_instance":True}
json.dump(fx,open(__import__('os').path.join(__import__('os').path.dirname(__import__('os').path.abspath(__file__)),'fixtures.json'),'w'),default=str,indent=0)
print({k:(len(v) if isinstance(v,list) else 'd') for k,v in fx.items()}, fx['runs'][0].keys())
