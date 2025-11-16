import { useEffect, useState } from 'react';
import { getProperties } from 'aws-amplify/storage';
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

        const properties = await getProperties({
          path,
        });

        setMetadata(properties.metadata as FileMetadata);
      } catch (err) {
        console.error('Error fetching metadata:', err);
        setError('Failed to load metadata');
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
