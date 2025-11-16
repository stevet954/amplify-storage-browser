import { S3Client, PutObjectTaggingCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import type { S3Event } from 'aws-lambda';

const s3Client = new S3Client({});

export const handler = async (event: S3Event): Promise<void> => {
  console.log('Processing S3 event:', JSON.stringify(event, null, 2));

  for (const record of event.Records) {
    try {
      const bucket = record.s3.bucket.name;
      const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));

      console.log(`Processing object: ${bucket}/${key}`);

      // Get object metadata
      const headCommand = new HeadObjectCommand({
        Bucket: bucket,
        Key: key,
      });

      const headResponse = await s3Client.send(headCommand);
      const metadata = headResponse.Metadata || {};

      console.log('Object metadata:', metadata);

      // Build tag set from metadata
      const tagSet = [];

      if (metadata['sec-class']) {
        tagSet.push({
          Key: 'sec-class',
          Value: metadata['sec-class'],
        });
      }

      if (metadata['cui-designation']) {
        tagSet.push({
          Key: 'cui-designation',
          Value: metadata['cui-designation'],
        });
      }

      if (metadata['ldc']) {
        tagSet.push({
          Key: 'ldc',
          Value: metadata['ldc'],
        });
      }

      if (metadata['rel-to']) {
        tagSet.push({
          Key: 'rel-to',
          Value: metadata['rel-to'],
        });
      }

      if (metadata['owner-producer']) {
        tagSet.push({
          Key: 'owner-producer',
          Value: metadata['owner-producer'],
        });
      }

      // Only apply tags if we have any
      if (tagSet.length > 0) {
        console.log(`Applying ${tagSet.length} tags to ${key}`);

        const putTagsCommand = new PutObjectTaggingCommand({
          Bucket: bucket,
          Key: key,
          Tagging: {
            TagSet: tagSet,
          },
        });

        await s3Client.send(putTagsCommand);
        console.log(`Successfully applied tags to ${key}`);
      } else {
        console.log(`No metadata tags found for ${key}`);
      }
    } catch (error) {
      console.error('Error processing record:', error);
      // Continue processing other records even if one fails
    }
  }
};
