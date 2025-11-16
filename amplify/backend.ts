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

// Configure S3 event notification to trigger Lambda on object creation
const { cfnBucket } = backend.storage.resources.cfnResources;
const { cfnFunction } = backend.applyMetadataTags.resources.cfnResources;

// Grant Lambda permission to read/tag S3 objects
backend.applyMetadataTags.resources.lambda.addToRolePolicy(
  new (await import('aws-cdk-lib/aws-iam')).PolicyStatement({
    actions: ['s3:GetObject', 's3:GetObjectTagging', 's3:PutObjectTagging', 's3:GetObjectAttributes'],
    resources: [`${cfnBucket.attrArn}/*`],
  })
);

// Add S3 event notification for object creation
cfnBucket.notificationConfiguration = {
  lambdaConfigurations: [
    {
      event: 's3:ObjectCreated:*',
      function: cfnFunction.attrArn,
    },
  ],
};

// Grant S3 permission to invoke the Lambda function
backend.applyMetadataTags.resources.lambda.addPermission('AllowS3Invocation', {
  action: 'lambda:InvokeFunction',
  principal: new (await import('aws-cdk-lib/aws-iam')).ServicePrincipal('s3.amazonaws.com'),
  sourceArn: cfnBucket.attrArn,
});
