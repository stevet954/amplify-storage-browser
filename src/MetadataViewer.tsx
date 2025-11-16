import { useEffect, useState } from 'react';
import { S3Client, GetObjectTaggingCommand } from '@aws-sdk/client-s3';
import { fetchAuthSession } from 'aws-amplify/auth';
import outputs from '../amplify_outputs.json';
import './MetadataViewer.css';

interface MetadataViewerProps {
  path: string;
  onClose: () => void;
}

interface FileMetadata {
  'sec-class'?: string;
  'cui-designation'?: string;
  'ldc'?: string;
  'rel-to'?: string;
  'owner-producer'?: string;
}

const METADATA_LABELS: Record<string, string> = {
  'sec-class': 'Security Classification',
  'cui-designation': 'CUI Designation',
  'ldc': 'Limited Dissemination Control',
  'rel-to': 'Releasable To (F-35 Partners)',
  'owner-producer': 'Owner / Producer',
};

const COUNTRY_CODES: Record<string, string> = {
  'GBR': 'United Kingdom',
  'ITA': 'Italy',
  'NLD': 'Netherlands',
  'NOR': 'Norway',
  'AUS': 'Australia',
  'CAN': 'Canada',
  'DNK': 'Denmark',
  'ISR': 'Israel',
  'JPN': 'Japan',
  'KOR': 'Republic of Korea',
  'BEL': 'Belgium',
  'POL': 'Poland',
  'SGP': 'Singapore',
  'FIN': 'Finland',
  'CHE': 'Switzerland',
  'DEU': 'Germany',
  'CZE': 'Czech Republic',
  'GRC': 'Greece',
  'ROU': 'Romania',
};

export function MetadataViewer({ path, onClose }: MetadataViewerProps) {
  const [metadata, setMetadata] = useState<FileMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get credentials from Amplify auth session
        const { credentials } = await fetchAuthSession();

        if (!credentials) {
          throw new Error('No credentials available');
        }

        // Create S3 client with Amplify credentials
        const s3Client = new S3Client({
          region: outputs.storage.aws_region,
          credentials,
        });

        // Get the bucket name from Amplify outputs
        const bucketName = outputs.storage.bucket_name;

        // Fetch object tags from S3
        const getTagsCommand = new GetObjectTaggingCommand({
          Bucket: bucketName,
          Key: path,
        });

        const tagsResponse = await s3Client.send(getTagsCommand);

        // Convert tags array to metadata object
        const metadataFromTags: FileMetadata = {};
        if (tagsResponse.TagSet) {
          for (const tag of tagsResponse.TagSet) {
            if (tag.Key && tag.Value) {
              metadataFromTags[tag.Key as keyof FileMetadata] = tag.Value;
            }
          }
        }

        // Check if we have any metadata
        if (Object.keys(metadataFromTags).length > 0) {
          setMetadata(metadataFromTags);
        } else {
          setMetadata(null);
        }
      } catch (err) {
        console.error('Error fetching metadata:', err);
        const errorMessage = err instanceof Error ? err.message : String(err);
        console.error('Error details:', {
          path,
          bucket: outputs.storage.bucket_name,
          errorMessage,
        });
        setError(`Failed to load metadata: ${errorMessage}`);
      } finally {
        setLoading(false);
      }
    };

    fetchMetadata();
  }, [path]);

  const formatRelTo = (value: string): string => {
    if (!value) return 'None';
    const codes = value.split(',').map(code => code.trim());
    return codes.map(code => COUNTRY_CODES[code] || code).join(', ');
  };

  const formatValue = (key: string, value: string): string => {
    if (key === 'rel-to') {
      return formatRelTo(value);
    }
    return value;
  };

  return (
    <div className="metadata-viewer-overlay" onClick={onClose}>
      <div className="metadata-viewer-container" onClick={(e) => e.stopPropagation()}>
        <div className="metadata-viewer-header">
          <h2>Security Metadata</h2>
          <button onClick={onClose} className="close-button" aria-label="Close">
            ×
          </button>
        </div>

        <div className="file-path">
          <strong>File:</strong> {path}
        </div>

        {loading && (
          <div className="metadata-loading">
            <p>Loading metadata...</p>
          </div>
        )}

        {error && (
          <div className="metadata-error">
            <p>{error}</p>
          </div>
        )}

        {!loading && !error && metadata && (
          <div className="metadata-content">
            {Object.entries(METADATA_LABELS).map(([key, label]) => {
              const value = metadata[key as keyof FileMetadata];
              return (
                <div key={key} className="metadata-field">
                  <div className="metadata-label">{label}</div>
                  <div className="metadata-value">
                    {value ? formatValue(key, value) : <em>Not set</em>}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!loading && !error && !metadata && (
          <div className="metadata-empty">
            <p>No security metadata found for this file.</p>
          </div>
        )}

        <div className="metadata-footer">
          <button onClick={onClose} className="btn-close">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
