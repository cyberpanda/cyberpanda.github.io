import inspect
class HTTPException(Exception):
    def __init__(self, status_code=500, detail=None, headers=None):
        self.status_code=status_code;self.detail=detail
class _Default:
    def __init__(self, default=..., **k): self.default=default
def Body(default=..., **k): return _Default(default)
def Header(default=None, **k): return _Default(default)
def Query(default=None, **k): return _Default(default)
class FastAPI:
    def __init__(self,*a,**k): self.routes=[]
    def add_middleware(self,*a,**k): pass
    def mount(self,*a,**k): pass
    def include_router(self,*a,**k): pass
    def _r(self,m,path,**k):
        def d(f): self.routes.append((m,path,f)); return f
        return d
    def get(self,p,**k): return self._r("GET",p,**k)
    def post(self,p,**k): return self._r("POST",p,**k)
    def put(self,p,**k): return self._r("PUT",p,**k)
    def delete(self,p,**k): return self._r("DELETE",p,**k)
    def on_event(self,*a,**k): return lambda f:f
class Request: pass
