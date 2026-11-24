import pytest

from services.url_safety import ensure_public_http_url


def resolver(mapping):
    return lambda host: mapping[host]


@pytest.mark.parametrize("url", [
    "ftp://shop.example/item",
    "file:///etc/passwd",
    "http://localhost:8000/admin",
    "http://127.0.0.1/",
    "http://10.0.0.5/",
    "http://169.254.169.254/latest/meta-data/",
    "http://[::1]/",
    "http://[::ffff:127.0.0.1]/",
    "http://printer.local/",
    "http://user:pass@shop.example/",
    "http:///no-host",
])
def test_rejects_unsafe_urls(url):
    with pytest.raises(ValueError):
        ensure_public_http_url(url, resolver=resolver({"shop.example": ["93.184.216.34"]}))


def test_rejects_hostname_resolving_to_private_address():
    with pytest.raises(ValueError):
        ensure_public_http_url("https://evil.example/", resolver=resolver({"evil.example": ["192.168.1.10"]}))


def test_rejects_when_any_resolved_address_is_private():
    r = resolver({"mixed.example": ["93.184.216.34", "10.1.2.3"]})
    with pytest.raises(ValueError):
        ensure_public_http_url("https://mixed.example/", resolver=r)


def test_unresolvable_host_is_rejected():
    def fail(_host):
        raise OSError("no such host")
    with pytest.raises(ValueError):
        ensure_public_http_url("https://nowhere.example/", resolver=fail)


def test_accepts_public_url_unchanged():
    url = "https://shop.example/products/dress?color=red"
    assert ensure_public_http_url(url, resolver=resolver({"shop.example": ["93.184.216.34"]})) == url
