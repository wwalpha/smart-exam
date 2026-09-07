"""Actions-only smoke. Never print token, Lambda environment, presigned URLs or learning data."""
import json
import os
import pathlib
import subprocess
import tempfile
import time
import urllib.error
import urllib.request


def aws(*args):
    result = subprocess.run(['aws', '--no-cli-pager', *args], stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=False)
    if result.returncode:
        raise RuntimeError('AWS smoke operation failed; inspect IAM permissions (payload suppressed)')
    return json.loads(result.stdout or '{}')


def request(url, payload=None, token=None):
    headers = {'Accept': 'application/json, text/event-stream'}
    if payload is not None:
        headers.update({'Content-Type': 'application/json', 'MCP-Protocol-Version': '2025-11-25'})
    if token:
        headers['Authorization'] = 'Bearer ' + token
    req = urllib.request.Request(url, data=json.dumps(payload).encode() if payload is not None else None, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=30) as response:
            return response.status, json.load(response)
    except urllib.error.HTTPError as error:
        return error.code, None


def verify_result(response, build):
    result = response.get('result', {})
    if result.get('isError') or result.get('structuredContent', {}).get('serverVersion') != build:
        raise RuntimeError('MCP application/build smoke failed (response suppressed)')


def main():
    endpoint, build = os.environ['MCP_ENDPOINT'], os.environ['MCP_BUILD_ID']
    discovery = endpoint.removesuffix('/mcp/v1') + '/.well-known/oauth-protected-resource/mcp/v1'
    status, metadata = request(discovery)
    if status != 200 or metadata.get('resource') != endpoint or metadata.get('scopes_supported') != ['smart-exam-mcp/read']:
        raise RuntimeError('Protected resource metadata smoke failed')
    context = {'jsonrpc': '2.0', 'id': 2, 'method': 'tools/call', 'params': {'name': 'get_learning_context', 'arguments': {}}}
    status, _ = request(endpoint, context)
    if status not in (401, 403):
        raise RuntimeError('Unauthenticated request was not rejected')
    print('HTTPS metadata and unauthenticated rejection: PASS')
    config = aws('lambda', 'get-function-configuration', '--function-name', os.environ['MCP_LAMBDA'])
    env = config['Environment']['Variables']
    # This trusted-invoker test supplies context, not a valid JWT. It does NOT test the authorizer.
    claims = {'iss': env['MCP_ISSUER'], 'aud': endpoint, 'client_id': env['MCP_CLIENT_ID'], 'scope': 'smart-exam-mcp/read', 'token_use': 'access', 'sub': 'isolated-lambda-smoke', 'cognito:groups': '[MCP_READERS]', 'exp': int(time.time()) + 60, 'iat': int(time.time())}
    event = {'version': '2.0', 'rawPath': '/mcp/v1', 'headers': {'authorization': 'Bearer isolated-context-no-jwt', 'content-type': 'application/json', 'accept': 'application/json, text/event-stream', 'mcp-protocol-version': '2025-11-25'}, 'requestContext': {'requestId': 'actions-mcp-smoke', 'http': {'method': 'POST'}, 'authorizer': {'jwt': {'claims': claims, 'scopes': ['smart-exam-mcp/read']}}}, 'body': json.dumps(context), 'isBase64Encoded': False}
    with tempfile.TemporaryDirectory() as directory:
        source, target = pathlib.Path(directory) / 'request.json', pathlib.Path(directory) / 'response.json'
        source.write_text(json.dumps(event))
        metadata = aws('lambda', 'invoke', '--function-name', os.environ['MCP_LAMBDA'], '--payload', 'fileb://' + str(source), str(target))
        if metadata.get('FunctionError'):
            raise RuntimeError('Lambda smoke execution failed')
        response = json.loads(target.read_text())
        if response.get('statusCode') != 200:
            raise RuntimeError('Lambda MCP context smoke failed')
        verify_result(json.loads(response['body']), build)
    print('Lambda application/build (synthetic trusted context, NOT OAuth/JWT HTTPS): PASS')
    # Evaluate write denials without issuing a mutation against business data.
    policy = aws('iam', 'simulate-principal-policy', '--policy-source-arn', config['Role'], '--action-names', 'dynamodb:PutItem', 'dynamodb:UpdateItem', 'dynamodb:DeleteItem', 'dynamodb:BatchWriteItem', 'dynamodb:TransactWriteItems', 's3:PutObject', 's3:DeleteObject', 'bedrock:InvokeModel')
    if not policy.get('EvaluationResults') or any(row['EvalDecision'] != 'explicitDeny' for row in policy['EvaluationResults']):
        raise RuntimeError('MCP IAM write-denial simulation failed')
    print('IAM write-denial policy simulation (no business mutation): PASS')
    token = os.environ.get('MCP_SMOKE_ACCESS_TOKEN')
    if token:
        init = {'jsonrpc': '2.0', 'id': 1, 'method': 'initialize', 'params': {'protocolVersion': '2025-11-25', 'capabilities': {}, 'clientInfo': {'name': 'actions-smoke', 'version': build}}}
        status, response = request(endpoint, init, token)
        if status != 200 or response.get('result', {}).get('serverInfo', {}).get('version') != build:
            raise RuntimeError('Authenticated HTTPS initialization failed')
        status, response = request(endpoint, context, token)
        if status != 200:
            raise RuntimeError('Authenticated HTTPS MCP call failed')
        verify_result(response, build)
        print('Authenticated HTTPS through JWT authorizer: PASS')
    else:
        print('Authenticated HTTPS through JWT authorizer: NOT TESTED (no existing test token)')


if __name__ == '__main__':
    try:
        main()
    except Exception:
        raise SystemExit('MCP smoke FAILED (sensitive response/error details suppressed)')
