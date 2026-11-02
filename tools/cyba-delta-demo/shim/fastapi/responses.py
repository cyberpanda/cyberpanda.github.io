class JSONResponse(dict):
    def __init__(self, content=None, status_code=200, **k): super().__init__(content or {})
class FileResponse: pass
class RedirectResponse: pass
