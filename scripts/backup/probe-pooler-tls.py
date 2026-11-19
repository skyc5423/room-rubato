"""Public regional pooler transport only. Never sends StartupMessage, login or SQL."""
import hashlib
import json
import socket
import ssl
import struct
from pathlib import Path

HOST = 'aws-0-ap-northeast-2.pooler.supabase.com'
PORT = 5432
CA = Path(__file__).with_name('supabase-ca.pem')
SSL_REQUEST = struct.pack('!II', 8, 80877103)


def probe(connect=socket.create_connection, context_factory=ssl.SSLContext):
    stage = 'tls_configuration'
    try:
        # Trust only the checked-in public CA; no system/ambient trust overrides.
        context = context_factory(ssl.PROTOCOL_TLS_CLIENT)
        context.verify_mode = ssl.CERT_REQUIRED
        context.check_hostname = True
        context.minimum_version = ssl.TLSVersion.TLSv1_2
        context.load_verify_locations(cafile=str(CA))
        stage = 'dns_or_tcp'
        with connect((HOST, PORT), timeout=10) as raw:
            raw.settimeout(10)
            stage = 'postgres_ssl_negotiation'
            raw.sendall(SSL_REQUEST)  # the only PostgreSQL application bytes sent
            if raw.recv(1) != b'S':
                raise ValueError('TLS not accepted')
            stage = 'certificate_or_tls'
            with context.wrap_socket(raw, server_hostname=HOST) as secured:
                certificate = secured.getpeercert(binary_form=True)
                if not certificate:
                    raise ValueError('Missing certificate')
                return {'status': 'tls_verified', 'scope': 'public_regional_pooler_only',
                        'protocol': secured.version(),
                        'certificateSha256': hashlib.sha256(certificate).hexdigest(),
                        'authenticationAttempted': False, 'sqlSent': False,
                        'productionConnectionVerified': False}
    except Exception:
        # No raw addresses, provider errors, env, cert body or private identifiers in logs.
        return {'status': 'unverified', 'stage': stage,
                'authenticationAttempted': False, 'sqlSent': False,
                'productionConnectionVerified': False}


if __name__ == '__main__':
    result = probe()
    print(json.dumps(result, sort_keys=True))
    raise SystemExit(0 if result['status'] == 'tls_verified' else 1)
