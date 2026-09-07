import importlib.util
import pathlib
import unittest

spec = importlib.util.spec_from_file_location('guard', pathlib.Path(__file__).with_name('check-mcp-plan.py'))
guard = importlib.util.module_from_spec(spec)
spec.loader.exec_module(guard)


def plan(address, actions, before=None, after=None):
    return {'resource_changes': [{'address': address, 'change': {'actions': actions, 'before': before, 'after': after}}]}


class GuardTest(unittest.TestCase):
    def test_safe_mcp(self):
        self.assertEqual(guard.check(plan('aws_lambda_function.mcp', ['create'])), [])

    def test_data_destruction_and_auth_drift(self):
        for address, actions in [('aws_dynamodb_table.materials', ['delete', 'create']), ('aws_cognito_user_pool_client.auth', ['update']), ('aws_lambda_function.mcp', ['delete', 'create'])]:
            self.assertTrue(guard.check(plan(address, actions)))

    def test_stage_only_mcp_limit(self):
        safe = {'route_settings': [{'route_key': 'POST /mcp/v1', 'throttling_rate_limit': 2, 'throttling_burst_limit': 5}]}
        self.assertEqual(guard.check(plan('aws_apigatewayv2_stage.default', ['update'], {'route_settings': []}, safe)), [])
        self.assertTrue(guard.check(plan('aws_apigatewayv2_stage.default', ['update'], {'route_settings': []}, {**safe, 'auto_deploy': False})))


unittest.main()
