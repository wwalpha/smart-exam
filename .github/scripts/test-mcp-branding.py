import contextlib
import io
import os
import pathlib
import runpy
import subprocess
import unittest
from unittest.mock import patch

SCRIPT = pathlib.Path(__file__).with_name('mcp-branding.py')


class BrandingTest(unittest.TestCase):
    def run_script(self, results):
        with patch.dict(os.environ, {'MCP_USER_POOL_ID': 'fixture-pool', 'MCP_CLIENT_ID': 'fixture-mcp'}), patch('subprocess.run', side_effect=results) as run, contextlib.redirect_stdout(io.StringIO()):
            runpy.run_path(str(SCRIPT))
            return run.call_args_list

    def test_preserve_existing_style(self):
        calls = self.run_script([subprocess.CompletedProcess([], 0, b'{"ManagedLoginBranding":{"ManagedLoginBrandingId":"fixture"}}', b'')])
        self.assertEqual(len(calls), 1)

    def test_create_only_missing_style_for_mcp_client(self):
        calls = self.run_script([subprocess.CompletedProcess([], 1, b'', b'ResourceNotFoundException'), subprocess.CompletedProcess([], 0, b'{}', b'')])
        self.assertIn('create-managed-login-branding', calls[1].args[0])
        self.assertIn('fixture-mcp', calls[1].args[0])

    def test_access_denied_never_becomes_create(self):
        with self.assertRaises(SystemExit):
            self.run_script([subprocess.CompletedProcess([], 1, b'', b'AccessDeniedException')])


unittest.main()
