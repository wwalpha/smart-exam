"""Reject unrelated changes and all deletions/replacements before applying a saved plan."""
import json
import sys

MCP_ADDRESSES = {
    'random_password.mcp_reference', 'aws_cognito_resource_server.mcp',
    'aws_cognito_user_pool_client.mcp', 'aws_cognito_user_group.mcp_readers',
    'aws_iam_role.mcp', 'aws_iam_role_policy.mcp', 'aws_cloudwatch_log_group.mcp',
    'aws_lambda_function.mcp', 'aws_apigatewayv2_authorizer.mcp',
    'aws_apigatewayv2_integration.mcp', 'aws_apigatewayv2_route.mcp',
    'aws_apigatewayv2_route.mcp_public', 'aws_lambda_permission.mcp',
    'aws_cloudwatch_metric_alarm.mcp_errors',
}


def check(plan):
    errors = []
    for resource in plan.get('resource_changes', []):
        change = resource['change']
        actions = change['actions']
        if actions == ['no-op'] or resource.get('mode') == 'data':
            continue
        address = resource['address']
        base = address.split('[')[0]
        if 'delete' in actions:
            errors.append(address + ': deletion/replacement is forbidden')
        elif base == 'aws_apigatewayv2_stage.default':
            before, after = dict(change['before'] or {}), dict(change['after'] or {})
            before_settings = before.pop('route_settings', [])
            after_settings = after.pop('route_settings', [])
            expected = [dict(route_key='POST /mcp/v1', throttling_rate_limit=2, throttling_burst_limit=5, detailed_metrics_enabled=False, logging_level='', data_trace_enabled=False)]
            # Only the explicit MCP route limit may change; preserve every existing setting.
            added = [item for item in after_settings if item not in before_settings]
            removed = [item for item in before_settings if item not in after_settings]
            if before != after or removed or len(added) != 1 or any(added[0].get(k) != expected[0][k] for k in ('route_key', 'throttling_rate_limit', 'throttling_burst_limit')):
                errors.append(address + ': unexpected stage change')
        elif base not in MCP_ADDRESSES:
            errors.append(address + ': unrelated resource change')
    return errors


if __name__ == '__main__':
    errors = check(json.load(sys.stdin))
    for error in errors:
        print(error, file=sys.stderr)
    if errors:
        sys.exit(1)
    print('Plan guard passed: MCP additions/updates only; no deletes or replacements.')
