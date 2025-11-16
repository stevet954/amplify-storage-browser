import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { storage, secondaryStorage } from './storage/resource';
import { applyMetadataTags } from './functions/apply-metadata-tags/resource';

/**
 * @see https://docs.amplify.aws/react/build-a-backend/ to add storage, functions, and more
 */
const backend = defineBackend({
  auth,
  storage,
  secondaryStorage,
  applyMetadataTags,
});

// NOTE: S3 event notification and Lambda permissions were configured in a previous deployment
// and are already active. We don't reconfigure them here to avoid circular dependencies.

// Grant authenticated users permission to read object tags
const { CfnPolicy } = await import('aws-cdk-lib/aws-iam');
const { Stack } = await import('aws-cdk-lib');

const authStack = Stack.of(backend.auth.resources.authenticatedUserIamRole);

new CfnPolicy(authStack, 'GetObjectTaggingPolicy', {
  policyName: 'GetObjectTaggingPolicy',
  policyDocument: {
    Version: '2012-10-17',
    Statement: [
      {
        Effect: 'Allow',
        Action: 's3:GetObjectTagging',
        Resource: 'arn:aws:s3:::amplify-*/*',
      },
    ],
  },
  roles: [
    backend.auth.resources.authenticatedUserIamRole.roleName,
    backend.auth.resources.unauthenticatedUserIamRole.roleName,
  ],
});
