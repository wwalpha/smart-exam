"""Actions-only setup of the new MCP client's managed login; existing clients are untouched."""
import json
import os
import subprocess

args = ['--user-pool-id', os.environ['MCP_USER_POOL_ID'], '--client-id', os.environ['MCP_CLIENT_ID']]
result = subprocess.run(['aws', '--no-cli-pager', 'cognito-idp', 'describe-managed-login-branding-by-client', *args], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
if result.returncode == 0:
    if not json.loads(result.stdout).get('ManagedLoginBranding'):
        raise SystemExit('MCP branding lookup returned no style')
    print('MCP managed-login branding already exists; preserved')
elif b'ResourceNotFoundException' in result.stderr:
    result = subprocess.run(['aws', '--no-cli-pager', 'cognito-idp', 'create-managed-login-branding', *args, '--use-cognito-provided-values'], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    if result.returncode:
        raise SystemExit('MCP managed-login branding creation failed (response suppressed)')
    print('Created default managed-login branding for the MCP client only')
else:
    raise SystemExit('MCP managed-login branding lookup failed (response suppressed)')
