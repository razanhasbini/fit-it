"""
Outbound URL guard.

The backend fetches user-supplied product URLs (httpx and Playwright), so an
unchecked URL lets a caller make the server request internal addresses such as
localhost, private network ranges or cloud metadata endpoints (SSRF).

This check rejects non-HTTP schemes and any host that is, or resolves to, a
non-public IP address. It does not stop DNS rebinding between this check and
the actual fetch; a production deployment should also restrict egress at the
network level.
"""

import ipaddress
import socket
from collections.abc import Callable, Iterable
from urllib.parse import urlsplit

Resolver = Callable[[str], Iterable[str]]

BLOCKED_HOST_SUFFIXES = (".localhost", ".local", ".internal", ".lan", ".home.arpa")


def _system_resolver(host: str) -> list[str]:
    infos = socket.getaddrinfo(host, None, proto=socket.IPPROTO_TCP)
    return [info[4][0] for info in infos]


def _is_public_ip(value: str) -> bool:
    ip = ipaddress.ip_address(value.split("%", 1)[0])
    if isinstance(ip, ipaddress.IPv6Address) and ip.ipv4_mapped:
        ip = ip.ipv4_mapped
    return ip.is_global and not ip.is_multicast


def ensure_public_http_url(url: str, resolver: Resolver | None = _system_resolver) -> str:
    """Return the URL unchanged if it is safe to fetch, otherwise raise ValueError.

    Pass resolver=None to skip DNS resolution (IP literals are still checked).
    """
    parts = urlsplit(url.strip())
    if parts.scheme not in ("http", "https"):
        raise ValueError("URL must start with http:// or https://")
    if parts.username or parts.password:
        raise ValueError("URLs with embedded credentials are not allowed")

    host = (parts.hostname or "").rstrip(".").lower()
    if not host:
        raise ValueError("URL must include a host name")
    if host == "localhost" or host.endswith(BLOCKED_HOST_SUFFIXES):
        raise ValueError("URL host is not publicly reachable")

    try:
        ipaddress.ip_address(host)
        is_literal = True
    except ValueError:
        is_literal = False

    if is_literal:
        addresses: Iterable[str] = [host]
    elif resolver is None:
        return url
    else:
        try:
            addresses = list(resolver(host))
        except OSError as exc:
            raise ValueError("URL host could not be resolved") from exc
        if not addresses:
            raise ValueError("URL host could not be resolved")

    if not all(_is_public_ip(a) for a in addresses):
        raise ValueError("URL host is not publicly reachable")
    return url
