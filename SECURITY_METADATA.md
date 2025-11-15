# F-35 JPO DataOps - Security Metadata Management

## Overview

This AWS Amplify Storage Browser has been enhanced with comprehensive security metadata management capabilities for the F-35 Joint Program Office (JPO) DataOps prototype. All file uploads now require security classification metadata, which is automatically stored and tagged for compliance.

## Features

### 1. **Security Metadata Form**
When uploading files, users are prompted to provide the following security metadata:

#### Required Fields:

- **Security Classification**
  - `U` - UNCLASSIFIED
  - `CUI` - Controlled Unclassified Information

- **CUI Designation**
  - `Not CUI`
  - `CUI (unspecified category)`
  - `CUI: Controlled Technical Information`
  - `CUI: Export Controlled`

- **Limited Dissemination Control (LDC)**
  - `None`
  - `NOFORN` - No foreign nationals or governments
  - `FEDCON` - Federal Employees and Contractors Only
  - `NOCON` - No Dissemination to Contractors
  - `DL ONLY (ABC Partners)` - Dissemination List Only

- **Owner / Producer**
  - `DoD (general)`
  - `F-35 Joint Program Office`

#### Optional Fields:

- **Releasable To (F-35 Partners)**
  - Multi-select checkbox list of F-35 partner nations
  - Stored as comma-separated ISO 3166-1 alpha-3 country codes
  - Includes: USA, GBR, ITA, NLD, NOR, AUS, CAN, DNK, ISR, JPN, KOR, BEL, POL, SGP, FIN, CHE, DEU, CZE, GRC, ROU

### 2. **Automatic S3 Tagging**

A Lambda function is automatically triggered when files are uploaded to S3. This function:

1. Reads the object metadata from the uploaded file
2. Extracts security classification fields
3. Applies corresponding S3 tags to the object

**Benefits:**
- Enables S3 bucket policies based on tags
- Supports S3 lifecycle rules
- Facilitates compliance auditing
- Allows cost allocation by security classification

### 3. **Metadata Viewer**

Users can view security metadata for any uploaded file by:
1. Entering the file path in the "View File Metadata" section
2. Clicking "View Metadata"
3. A modal displays all security metadata associated with the file

## Architecture

### Components

```
src/
├── MetadataForm.tsx          # Security metadata input form
├── MetadataForm.css          # Form styling
├── MetadataViewer.tsx        # Metadata display component
├── MetadataViewer.css        # Viewer styling
└── App.tsx                   # Main app with custom upload handler
```

### Backend

```
amplify/
├── backend.ts                           # Backend configuration with Lambda integration
└── functions/
    └── apply-metadata-tags/
        ├── resource.ts                  # Lambda function definition
        ├── handler.ts                   # Lambda handler code
        └── package.json                 # Lambda dependencies
```

### Data Flow

1. **Upload Process:**
   ```
   User selects file → Metadata form appears → User fills security fields →
   File uploaded with metadata → Lambda triggered → S3 tags applied
   ```

2. **View Process:**
   ```
   User enters file path → Click "View Metadata" →
   Fetch object properties → Display security metadata
   ```

## Storage Format

### Object Metadata (Custom Metadata Headers)
Stored as S3 object metadata:
```
x-amz-meta-sec-class: U
x-amz-meta-cui-designation: CUI:CTI
x-amz-meta-ldc: NOFORN
x-amz-meta-rel-to: GBR,AUS,CAN
x-amz-meta-owner-producer: USA-DOD-JPO
```

### S3 Tags
Applied by Lambda function:
```
sec-class: U
cui-designation: CUI:CTI
ldc: NOFORN
rel-to: GBR,AUS,CAN
owner-producer: USA-DOD-JPO
```

## Usage

### Uploading Files with Metadata

1. Navigate to the desired folder in the Storage Browser
2. Click the "Upload Files" button
3. Select a file from your computer
4. The security metadata form will appear
5. Fill in all required fields:
   - Security Classification
   - CUI Designation
   - Limited Dissemination Control
   - Owner / Producer
6. Optionally select F-35 partner nations for "Releasable To"
7. Click "Upload File" to complete the upload
8. The file will be uploaded with metadata and automatically tagged

### Viewing File Metadata

1. Locate the "View File Metadata" section above the Storage Browser
2. Enter the full path to the file (e.g., `public/document.pdf`)
3. Click "View Metadata" or press Enter
4. A modal will display all security metadata for the file
5. Click "Close" or click outside the modal to dismiss

## Lambda Function

The `apply-metadata-tags` Lambda function:

- **Trigger:** S3 ObjectCreated:* events
- **Permissions:**
  - `s3:GetObject`
  - `s3:GetObjectTagging`
  - `s3:PutObjectTagging`
  - `s3:GetObjectAttributes`
- **Runtime:** Node.js (configured via AWS Amplify)
- **Execution:** Automatically invoked on every file upload

### Function Logic

```typescript
1. Receive S3 event notification
2. Extract bucket name and object key
3. Fetch object metadata using HeadObject
4. Map metadata fields to S3 tags
5. Apply tags using PutObjectTagging
6. Log success/failure
```

## Compliance & Security

### Data Protection
- All metadata is encrypted at rest (S3 default encryption)
- Metadata is transmitted over HTTPS only
- Access controlled by AWS IAM and Cognito

### Audit Trail
- CloudWatch Logs capture all Lambda executions
- S3 access logs can be enabled for compliance auditing
- Object versioning can be enabled to track metadata changes

### Access Control
The Storage Browser maintains the existing access patterns:
- `public/*` - Guest read/write, Authenticated read/write/delete
- `admin/*` - Admin group full access, Authenticated read-only
- `private/{entity_id}/*` - Individual user's private storage

## Deployment

The security metadata feature is deployed automatically when the Amplify sandbox is running:

```bash
npx ampx sandbox
```

Changes to the Lambda function or backend configuration will be automatically deployed to your sandbox environment.

## Development

### Testing Locally

1. Start the Amplify sandbox:
   ```bash
   npx ampx sandbox
   ```

2. In a separate terminal, start the dev server:
   ```bash
   npm run dev
   ```

3. Access the app at `http://localhost:5173`

### Modifying Metadata Fields

To add or modify security metadata fields:

1. Update `src/MetadataForm.tsx` - Add/modify form fields
2. Update `src/MetadataViewer.tsx` - Add field labels and display logic
3. Update `amplify/functions/apply-metadata-tags/handler.ts` - Add tag mapping
4. Test the changes in your sandbox environment

## Future Enhancements

Potential improvements for production deployment:

1. **Batch Upload Support** - Handle multiple files with the same metadata
2. **Metadata Templates** - Save common metadata configurations
3. **Advanced Search** - Query files by security classification
4. **Bulk Tag Update** - Update metadata for multiple existing files
5. **Compliance Reports** - Generate reports of files by classification
6. **Data Loss Prevention** - Prevent upload of improperly classified files
7. **Integration with DoD PKI** - Certificate-based authentication
8. **STIG Compliance** - Ensure all security configurations meet STIG requirements

## Support

For questions or issues related to this prototype, contact the F-35 JPO DataOps team.

## References

- [AWS Amplify Storage](https://docs.amplify.aws/react/build-a-backend/storage/)
- [CUI Program](https://www.archives.gov/cui)
- [F-35 Program Information](https://www.f35.com/)
- [ISO 3166-1 Country Codes](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-3)
