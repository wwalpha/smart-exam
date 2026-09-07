import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const terraform = readFileSync('../terraform/mcp.tf', 'utf8');
const policy = terraform
  .split('resource "aws_iam_role_policy" "mcp"')[1]
  .split('resource "aws_cloudwatch_log_group"')[0];

describe('read-only infrastructure contract (static; AWS simulator runs after deployment)', () => {
  it('grants only scoped reads and MCP log writes, and explicitly denies business writes', () => {
    const allowed = [...policy.matchAll(/Effect\s*=\s*"Allow"[\s\S]*?Action\s*=\s*\[([^\]]+)\]/g)].flatMap(
      (match) => [...match[1].matchAll(/"([^"]+)"/g)].map((value) => value[1]),
    );
    expect(allowed.sort()).toEqual(
      [
        'dynamodb:GetItem',
        'dynamodb:BatchGetItem',
        'dynamodb:Query',
        'dynamodb:Scan',
        's3:GetObject',
        's3:GetObjectVersion',
        's3:ListBucket',
        'logs:CreateLogStream',
        'logs:PutLogEvents',
      ].sort(),
    );
    expect(policy).toContain('"s3:prefix" = ["materials/*", "exams/*"]');
    const denied = policy.split('Effect   = "Deny"')[1];
    for (const action of [
      'dynamodb:PutItem',
      'dynamodb:UpdateItem',
      'dynamodb:DeleteItem',
      'dynamodb:BatchWriteItem',
      'dynamodb:TransactWriteItems',
      's3:PutObject',
      's3:DeleteObject',
      'bedrock:*',
      'lambda:InvokeFunction',
    ])
      expect(denied).toContain(`"${action}"`);
  });
  it('always authorizes MCP while preserving separate Web/mobile audiences and CORS', () => {
    expect(terraform).toMatch(/authorization_type\s*=\s*"JWT"/);
    expect(terraform).toMatch(/audience\s*=\s*\[local.mcp_endpoint\]/);
    expect(terraform).toMatch(/authorization_scopes\s*=\s*\["smart-exam-mcp\/read"\]/);
    expect(terraform).toMatch(/generate_secret\s*=\s*false/);
    const existing = readFileSync('../terraform/apigw.tf', 'utf8')
      .split('resource "aws_apigatewayv2_authorizer" "cognito"')[1]
      .split('resource "aws_apigatewayv2_route" "default"')[0];
    expect(existing).toContain('aws_cognito_user_pool_client.auth.id');
    expect(existing).toContain('aws_cognito_user_pool_client.mobile.id');
    expect(existing).not.toContain('user_pool_client.mcp');
  });
  it('packages a dedicated handler and keeps build identity in the artifact', () => {
    expect(terraform).toMatch(/handler\s*=\s*"mcp.handler"/);
    const build = readFileSync('scripts/build-lambda.mjs', 'utf8');
    expect(build).toContain("'process.env.MCP_BUILD_ID': JSON.stringify");
    expect(build).toContain("'dist-mcp', 'mcp.js'");
    const source = readFileSync('src/repositories/learningRead/index.ts', 'utf8');
    expect(source).not.toMatch(/PutObjectCommand|UpdateCommand|DeleteCommand|Bedrock|generatePdf/);
  });
});
