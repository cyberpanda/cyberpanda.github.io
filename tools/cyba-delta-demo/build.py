#!/usr/bin/env python3
"""Rebuild cyba-delta/demo/mock.js from a local checkout of cyberpanda/cyba-delta.

  python3 tools/cyba-delta-demo/build.py ../cyba-delta

Runs the real CybaKawa API in-process (with a tiny FastAPI stand-in, stdlib only), seeds a demo
scenario (templates, customers acme/globex/initech, bindings, test runs) and writes the
fixtures into the browser mock."""
import json, os, subprocess, sys
HERE = os.path.dirname(os.path.abspath(__file__))
repo = os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else "../cyba-delta")
env = dict(os.environ, CYBA_REPO=repo)
subprocess.run([sys.executable, os.path.join(HERE, "seed.py")], check=True, env=env, cwd=HERE)
fx = json.load(open(os.path.join(HERE, "fixtures.json")))
LOCAL = {"cybasoa": "soc/", "cybaban": "duty/", "cybamado": "portal/", "cybakawa": "https://github.com/cyberpanda/cyba-delta/tree/main/engine"}
for s in fx["spaces"]:
    if s.get("kind") != "roof":
        s["url"] = LOCAL.get(s["name"], s.get("url"))
        s["up"] = True
        s["start_hint"] = "Demo in your browser"
for p in fx["products"]:
    p["url"] = LOCAL.get(p["name"], p.get("url"))
    p["up"] = True
    p["start_hint"] = "Demo in your browser"
    p["docs"] = "https://github.com/cyberpanda/cyba-delta/tree/main/products/" + p["name"]
src = open(os.path.join(HERE, "mock.src.js")).read().replace("__FIXTURES__", json.dumps(fx, separators=(",", ":"), ensure_ascii=False))
out = os.path.join(HERE, "..", "..", "cyba-delta", "demo", "mock.js")
open(out, "w").write(src)
print("wrote", os.path.relpath(out), len(src) // 1024, "KB")
