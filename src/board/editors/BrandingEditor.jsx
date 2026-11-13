import ImageUpload from '../ImageUpload.jsx';

export default function BrandingEditor({ draft, update }) {
  return (
    <div className="editor-panel">
      <div className="editor-head">
        <div>
          <h2>Logos</h2>
          <p className="muted">Upload a PNG (transparent background works best). Remove an image to go back to the built-in text logo.</p>
        </div>
      </div>
      <fieldset className="card field-card">
        <legend>SCU INFORMS logo (header)</legend>
        <p className="hint">Shown at the top-left of every page; clicking it goes to Home.</p>
        <ImageUpload label="SCU INFORMS logo" value={draft.branding.headerLogo} onChange={(url) => update(['branding', 'headerLogo'], url)} />
      </fieldset>
      <fieldset className="card field-card">
        <legend>Santa Clara University logo (footer)</legend>
        <p className="hint">Shown on the dark blue footer, so a white or light version of the logo works best.</p>
        <ImageUpload label="Santa Clara University logo" value={draft.branding.footerLogo} onChange={(url) => update(['branding', 'footerLogo'], url)} />
      </fieldset>
    </div>
  );
}
