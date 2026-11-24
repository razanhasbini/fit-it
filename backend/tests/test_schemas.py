import pytest
from pydantic import ValidationError

from models.schemas import ProductExtractRequest, StartSessionRequest


def test_extract_request_rejects_internal_ip():
    with pytest.raises(ValidationError):
        ProductExtractRequest(url="http://169.254.169.254/latest/meta-data/")


def test_session_request_rejects_non_http_scheme():
    with pytest.raises(ValidationError):
        StartSessionRequest(product_url="javascript:alert(1)")


def test_extract_request_accepts_public_ip_literal():
    assert ProductExtractRequest(url="http://93.184.216.34/item").url.endswith("/item")
