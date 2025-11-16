import { useState } from 'react';
import {
  createAmplifyAuthAdapter,
  createStorageBrowser,
} from '@aws-amplify/ui-react-storage/browser';
import '@aws-amplify/ui-react-storage/styles.css';
import './App.css';

import config from '../amplify_outputs.json';
import { Amplify } from 'aws-amplify';
import { uploadData } from 'aws-amplify/storage';
import { Authenticator, Button } from '@aws-amplify/ui-react';
import { MetadataForm, SecurityMetadata } from './MetadataForm';
import { MetadataViewer } from './MetadataViewer';

Amplify.configure(config);

interface PendingUpload {
  file: File;
  key: string;
}

function App() {
  const [pendingUpload, setPendingUpload] = useState<PendingUpload | null>(null);
  const [uploadKey, setUploadKey] = useState(0);
  const [viewMetadataPath, setViewMetadataPath] = useState<string | null>(null);
  const [metadataInputPath, setMetadataInputPath] = useState<string>('');
  const [currentPath, setCurrentPath] = useState<string>('public/');

  const handleMetadataSubmit = async (metadata: SecurityMetadata) => {
    if (!pendingUpload) return;

    try {
      // Convert metadata to S3-compatible format
      const s3Metadata = {
        'sec-class': metadata.secClass,
        'cui-designation': metadata.cuiDesignation,
        'ldc': metadata.ldc,
        'rel-to': metadata.relTo.join(','), // Comma-separated ISO codes
        'owner-producer': metadata.ownerProducer,
      };

      // Upload file with metadata
      await uploadData({
        path: pendingUpload.key,
        data: pendingUpload.file,
        options: {
          metadata: s3Metadata,
        },
      }).result;

      // Clear pending upload and force refresh
      setPendingUpload(null);
      setUploadKey(prev => prev + 1);
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed. Please try again.');
    }
  };

  const handleMetadataCancel = () => {
    setPendingUpload(null);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      const key = `${currentPath}${file.name}`;

      setPendingUpload({
        file,
        key,
      });
    }
    // Reset input so same file can be selected again
    e.target.value = '';
  };

  const { StorageBrowser } = createStorageBrowser({
    config: createAmplifyAuthAdapter(),
  });

  const handleViewMetadata = () => {
    if (metadataInputPath.trim()) {
      setViewMetadataPath(metadataInputPath.trim());
    }
  };

  return (
    <Authenticator>
      {({ signOut, user }) => (
        <>
          <div className="header">
            <h1>{`Hello ${user?.username}`}</h1>
            <Button onClick={signOut}>Sign out</Button>
          </div>

          <div className="info-banner">
            <h3>F-35 JPO DataOps - Security Metadata Management</h3>
            <p>All uploaded files require security classification metadata. Files are automatically tagged for compliance.</p>
          </div>

          <div className="metadata-viewer-trigger">
            <h4>View File Metadata</h4>
            <div className="metadata-input-group">
              <input
                type="text"
                placeholder="Enter file path (e.g., public/document.pdf)"
                value={metadataInputPath}
                onChange={(e) => setMetadataInputPath(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleViewMetadata()}
                className="metadata-path-input"
              />
              <button onClick={handleViewMetadata} className="view-metadata-btn">
                View Metadata
              </button>
            </div>
          </div>

          <div className="custom-upload-section">
            <h4>Upload File with Security Metadata</h4>
            <p>Click the button below to upload a file. You'll be prompted to enter security metadata.</p>
            <input
              type="file"
              id="custom-file-input"
              style={{ display: 'none' }}
              onChange={handleFileSelect}
            />
            <label htmlFor="custom-file-input" className="custom-upload-btn">
              📁 Select File to Upload
            </label>
          </div>

          <StorageBrowser key={uploadKey} />

          {pendingUpload && (
            <MetadataForm
              fileName={pendingUpload.file.name}
              onSubmit={handleMetadataSubmit}
              onCancel={handleMetadataCancel}
            />
          )}

          {viewMetadataPath && (
            <MetadataViewer
              path={viewMetadataPath}
              onClose={() => setViewMetadataPath(null)}
            />
          )}
        </>
      )}
    </Authenticator>
  );
}

export default App;