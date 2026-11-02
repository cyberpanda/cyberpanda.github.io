import sys,json,os,re,inspect
_H=os.path.dirname(os.path.abspath(__file__));_R=os.environ.get('CYBA_REPO',os.path.join(_H,'..','..','..','cyba-delta'))
sys.path[:0]=[os.path.join(_H,'shim'),os.path.join(_R,'engine','cybakawa'),os.path.join(_R,'packages','delta')]
os.environ['STORE_URL']='memory://'
from cybakawa.api import main as M
app=M.create_app() if not hasattr(M,'app') else M.app
R=app.routes
import fastapi
def call(method,path,body=None):
    p,_,q=path.partition('?')
    qs=dict(x.split('=',1) for x in q.split('&') if x) if q else {}
    for m,pat,f in R:
        if m!=method:continue
        rx='^'+re.sub(r'\{(\w+)(:path)?\}',lambda g:f'(?P<{g.group(1)}>{".+" if g.group(2) else "[^/]+"})',pat)+'$'
        mm=re.match(rx,'/api'+p if not p.startswith('/api') else p)
        if not mm:continue
        kw=dict(mm.groupdict());sig=inspect.signature(f)
        for n,par in sig.parameters.items():
            if n in kw:continue
            d=par.default
            if isinstance(d,fastapi._Default):
                kw[n]=body if body is not None else (d.default if d.default is not ... else {})
            elif n in qs:kw[n]=type(d)(qs[n]) if d not in (None,inspect._empty) else qs[n]
        try:return 200,f(**kw)
        except fastapi.HTTPException as e:return e.status_code,{'detail':e.detail}
    return 404,{'detail':'Not Found'}
if __name__=='__main__':
    for p in ['/meta','/workflows','/templates','/apps','/runs?limit=50','/products','/spaces','/profiles','/channels','/ingest/sources']:
        s,d=call('GET',p);print(p,s,json.dumps(d,default=str)[:300])
