import { test } from "node:test";
import assert from "node:assert/strict";
import { parseSafeUrl, isPublicAddress } from "./safe-url.ts";

test("parseSafeUrl accepts plain http(s) shop links", () => {
  assert.equal(parseSafeUrl("https://www.uniqlo.com/ca/en/products/E4650")?.hostname, "www.uniqlo.com");
  assert.equal(parseSafeUrl(" http://shop.com:443/p ")?.port, "443");
});

test("parseSafeUrl refuses other schemes, odd ports, credentials and local names", () => {
  for (const bad of [
    "ftp://shop.com/x",
    "file:///etc/passwd",
    "javascript:alert(1)",
    "https://shop.com:8080/x",
    "https://user:pw@shop.com/x",
    "http://localhost/x",
    "http://printer.local/x",
    "http://metadata.google.internal/x",
    "http://127.0.0.1/x",
    "http://[::1]/x",
    "http://169.254.169.254/latest",
    "not a url",
  ]) {
    assert.equal(parseSafeUrl(bad), null, bad);
  }
});

test("isPublicAddress blocks loopback, private, link-local and shared ranges", () => {
  for (const ip of ["127.0.0.1", "10.1.2.3", "172.16.0.1", "172.31.255.255", "192.168.1.1", "169.254.169.254", "100.64.0.1", "0.0.0.0", "224.0.0.1", "::1", "::", "fc00::1", "fd12::1", "fe80::1", "::ffff:127.0.0.1", "::ffff:7f00:1"]) {
    assert.equal(isPublicAddress(ip), false, ip);
  }
  for (const ip of ["8.8.8.8", "172.32.0.1", "151.101.1.1", "2606:4700::1111"]) {
    assert.equal(isPublicAddress(ip), true, ip);
  }
});
