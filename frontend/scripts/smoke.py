#!/usr/bin/env python3
"""Smoke test for the built app, logged out.

Covers the flows that need no credentials, because this script must never
handle real ones. verify.sh starts the server with dummy Auth0 values, so a
session can't exist and nothing here reaches Auth0, the database or any paid
API:

  1. the landing page renders and its CTA reaches /login, whose Continue
     button points at the Auth0 login route
  2. a logged-out visit to /wardrobe is bounced back to the landing page
     (proxy.ts — the auth guard that's been rewritten twice already)
  3. a logged-out API call gets a 401, not data and not a 500

Run it against a running server:

    python3 scripts/smoke.py http://localhost:4173

Exits non-zero if any check fails, so it works as a gate.
"""

import sys
from urllib.parse import urlparse

from playwright.sync_api import sync_playwright

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:4173"

failures = []
checks = 0


def check(name, ok, detail=""):
    global checks
    checks += 1
    if ok:
        print(f"  ok    {name}")
    else:
        print(f"  FAIL  {name}  {detail}")
        failures.append(name)


def path(url):
    return urlparse(url).path


with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1280, "height": 800})

    # --- 1. landing -> /login ----------------------------------------------
    print("landing")
    res = page.goto(BASE)
    check("landing returns 200", res is not None and res.status == 200,
          f"got {res.status if res else 'no response'}")

    cta = page.locator('a[href="/login"]').first
    check("landing has a link to /login", cta.count() > 0)

    if cta.count() > 0:
        cta.click()
        page.wait_for_url("**/login")
        check("CTA lands on /login", path(page.url) == "/login", page.url)

        cont = page.get_by_role("link", name="Continue")
        href = cont.get_attribute("href") if cont.count() else None
        check("Continue points at the Auth0 login route",
              bool(href) and href.startswith("/api/auth/login"), f"href={href}")

    # --- 2. protected page, logged out -------------------------------------
    print("auth guard")
    page.goto(f"{BASE}/wardrobe")
    check("/wardrobe logged out redirects to /", path(page.url) == "/", page.url)

    # --- 3. API, logged out ------------------------------------------------
    print("api")
    api = page.request.get(f"{BASE}/api/wardrobe")
    check("/api/wardrobe logged out is 401", api.status == 401,
          f"got {api.status}")

    browser.close()

print(f"\n{checks - len(failures)}/{checks} checks passed")
sys.exit(1 if failures else 0)
