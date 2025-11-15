import { defineFunction } from '@aws-amplify/backend';

export const applyMetadataTags = defineFunction({
  name: 'apply-metadata-tags',
  entry: './handler.ts',
});
