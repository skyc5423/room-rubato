import importlib.util
from pathlib import Path
import ssl
import unittest
from unittest.mock import MagicMock

spec = importlib.util.spec_from_file_location('probe', Path(__file__).parents[1] / 'probe-pooler-tls.py')
p = importlib.util.module_from_spec(spec)
spec.loader.exec_module(p)

class ProbeTests(unittest.TestCase):
    def fixture(self):
        raw = MagicMock()
        raw.__enter__.return_value = raw
        raw.recv.return_value = b'S'
        secured = MagicMock()
        secured.__enter__.return_value = secured
        secured.getpeercert.return_value = b'public certificate fixture'
        secured.version.return_value = 'TLSv1.3'
        context = MagicMock()
        context.wrap_socket.return_value = secured
        connect = MagicMock(return_value=raw)
        factory = MagicMock(return_value=context)
        return raw, secured, context, connect, factory

    def test_verifies_ca_hostname_and_sends_only_ssl_request(self):
        raw, secured, context, connect, factory = self.fixture()
        result = p.probe(connect, factory)
        self.assertEqual(result['status'], 'tls_verified')
        self.assertFalse(result['productionConnectionVerified'])
        factory.assert_called_once_with(ssl.PROTOCOL_TLS_CLIENT)
        self.assertEqual(context.verify_mode, ssl.CERT_REQUIRED)
        self.assertTrue(context.check_hostname)
        self.assertEqual(context.minimum_version, ssl.TLSVersion.TLSv1_2)
        context.load_verify_locations.assert_called_once_with(cafile=str(p.CA))
        connect.assert_called_once_with((p.HOST, 5432), timeout=10)
        raw.sendall.assert_called_once_with(bytes.fromhex('0000000804d2162f'))
        context.wrap_socket.assert_called_once_with(raw, server_hostname=p.HOST)
        secured.send.assert_not_called()
        secured.sendall.assert_not_called()

    def test_no_fallback_after_rejected_ssl_request(self):
        raw, secured, context, connect, factory = self.fixture()
        raw.recv.return_value = b'N'
        self.assertEqual(p.probe(connect, factory)['stage'], 'postgres_ssl_negotiation')
        context.wrap_socket.assert_not_called()
        self.assertEqual(raw.sendall.call_count, 1)

    def test_invalid_certificate_fails_closed_without_error_leak(self):
        raw, secured, context, connect, factory = self.fixture()
        context.wrap_socket.side_effect = ssl.SSLCertVerificationError('nonpublic diagnostic')
        result = p.probe(connect, factory)
        self.assertEqual(result['status'], 'unverified')
        self.assertEqual(result['stage'], 'certificate_or_tls')
        self.assertNotIn('nonpublic', str(result))
        self.assertEqual(connect.call_count, 1)

    def test_dns_or_tcp_failure_remains_unverified(self):
        raw, secured, context, connect, factory = self.fixture()
        connect.side_effect = OSError('private diagnostic')
        self.assertEqual(p.probe(connect, factory)['stage'], 'dns_or_tcp')
        raw.sendall.assert_not_called()

if __name__ == '__main__':
    unittest.main()
