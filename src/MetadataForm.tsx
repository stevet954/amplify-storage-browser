import { useState, useEffect } from 'react';
import './MetadataForm.css';

export interface SecurityMetadata {
  secClass: string;
  cuiDesignation: string;
  ldc: string;
  relTo: string[]; // ISO 3166-1 alpha-3 codes
  ownerProducer: string;
}

interface MetadataFormProps {
  onSubmit: (metadata: SecurityMetadata) => void;
  onCancel: () => void;
  fileName?: string;
}

const SEC_CLASS_OPTIONS = [
  { value: 'U', label: 'UNCLASSIFIED' },
  { value: 'CUI', label: 'CUI (Controlled Unclassified Information)' },
];

const CUI_DESIGNATION_OPTIONS = [
  { value: 'NONE', label: 'Not CUI' },
  { value: 'CUI', label: 'CUI (unspecified category)' },
  { value: 'CUI:CTI', label: 'CUI: Controlled Technical Information' },
  { value: 'CUI:EXPORT', label: 'CUI: Export Controlled' },
];

const LDC_OPTIONS = [
  { value: 'NONE', label: 'None' },
  { value: 'NOFORN', label: 'NOFORN (no foreign nationals or governments)' },
  { value: 'FEDCON', label: 'Federal Employees and Contractors Only' },
  { value: 'NOCON', label: 'No Dissemination to Contractors' },
  { value: 'DL ONLY (ABC Partners)', label: 'Dissemination List Only (ABC Partners list applies)' },
];

const REL_TO_OPTIONS = [
  { value: 'GBR', label: 'United Kingdom' },
  { value: 'ITA', label: 'Italy' },
  { value: 'NLD', label: 'Netherlands' },
  { value: 'NOR', label: 'Norway' },
  { value: 'AUS', label: 'Australia' },
  { value: 'CAN', label: 'Canada' },
  { value: 'DNK', label: 'Denmark' },
  { value: 'ISR', label: 'Israel' },
  { value: 'JPN', label: 'Japan' },
  { value: 'KOR', label: 'Republic of Korea' },
  { value: 'BEL', label: 'Belgium' },
  { value: 'POL', label: 'Poland' },
  { value: 'SGP', label: 'Singapore' },
  { value: 'FIN', label: 'Finland' },
  { value: 'CHE', label: 'Switzerland' },
  { value: 'DEU', label: 'Germany' },
  { value: 'CZE', label: 'Czech Republic' },
  { value: 'GRC', label: 'Greece' },
  { value: 'ROU', label: 'Romania' },
];

const OWNER_PRODUCER_OPTIONS = [
  { value: 'USA-DOD', label: 'DoD (general)' },
  { value: 'USA-DOD-JPO', label: 'F-35 Joint Program Office' },
];

export function MetadataForm({ onSubmit, onCancel, fileName }: MetadataFormProps) {
  const [secClass, setSecClass] = useState<string>('U');
  const [cuiDesignation, setCuiDesignation] = useState<string>('NONE');
  const [ldc, setLdc] = useState<string>('NONE');
  const [relTo, setRelTo] = useState<string[]>([]);
  const [ownerProducer, setOwnerProducer] = useState<string>('USA-DOD-JPO');

  // Clear Releasable To selections when NOFORN is selected
  useEffect(() => {
    if (ldc === 'NOFORN' && relTo.length > 0) {
      setRelTo([]);
    }
  }, [ldc]);

  const handleRelToChange = (value: string) => {
    setRelTo((prev) =>
      prev.includes(value)
        ? prev.filter((v) => v !== value)
        : [...prev, value]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      secClass,
      cuiDesignation,
      ldc,
      relTo,
      ownerProducer,
    });
  };

  return (
    <div className="metadata-form-overlay">
      <div className="metadata-form-container">
        <h2>F-35 JPO DataOps Security Metadata</h2>
        {fileName && <p className="file-name">File: {fileName}</p>}

        <form onSubmit={handleSubmit}>
          {/* Security Classification */}
          <div className="form-group">
            <label htmlFor="sec-class">
              Security Classification <span className="required">*</span>
            </label>
            <select
              id="sec-class"
              value={secClass}
              onChange={(e) => setSecClass(e.target.value)}
              required
              className="form-select"
            >
              {SEC_CLASS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* CUI Designation */}
          <div className="form-group">
            <label htmlFor="cui-designation">
              CUI Designation <span className="required">*</span>
            </label>
            <select
              id="cui-designation"
              value={cuiDesignation}
              onChange={(e) => setCuiDesignation(e.target.value)}
              required
              className="form-select"
            >
              {CUI_DESIGNATION_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Limited Dissemination Control */}
          <div className="form-group">
            <label htmlFor="ldc">
              Limited Dissemination Control <span className="required">*</span>
            </label>
            <select
              id="ldc"
              value={ldc}
              onChange={(e) => setLdc(e.target.value)}
              required
              className="form-select"
            >
              {LDC_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Releasable To (Multi-select) */}
          <div className="form-group">
            <label className={ldc === 'NOFORN' ? 'disabled-label' : ''}>
              Releasable To (F-35 Partners)
            </label>
            {ldc === 'NOFORN' && (
              <div className="warning-message">
                NOFORN restriction prevents selection of foreign countries
              </div>
            )}
            <div className={`multi-select-container ${ldc === 'NOFORN' ? 'disabled-container' : ''}`}>
              {REL_TO_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className={`checkbox-label ${ldc === 'NOFORN' ? 'disabled-checkbox' : ''}`}
                >
                  <input
                    type="checkbox"
                    value={option.value}
                    checked={relTo.includes(option.value)}
                    onChange={() => handleRelToChange(option.value)}
                    disabled={ldc === 'NOFORN'}
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
            <small className="help-text">
              Selected: {relTo.length > 0 ? relTo.join(', ') : 'None'}
            </small>
          </div>

          {/* Owner / Producer */}
          <div className="form-group">
            <label htmlFor="owner-producer">
              Owner / Producer <span className="required">*</span>
            </label>
            <select
              id="owner-producer"
              value={ownerProducer}
              onChange={(e) => setOwnerProducer(e.target.value)}
              required
              className="form-select"
            >
              {OWNER_PRODUCER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-actions">
            <button type="button" onClick={onCancel} className="btn-cancel">
              Cancel
            </button>
            <button type="submit" className="btn-submit">
              Upload File
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
