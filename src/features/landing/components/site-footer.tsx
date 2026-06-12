import { brand, footerBottom, footerColumns } from '../content';

export function SiteFooter() {
  return (
    <footer className="lp-footer">
      <div className="footer-inner">
        <div className="footer-top">
          <div>
            <a className="brand-mark" href="#top" aria-label="AutoPro System início">
              <span>AP</span>
              <strong>{brand.name}</strong>
            </a>
            <p className="footer-brand-desc">{brand.tagline}</p>
          </div>
          {footerColumns.map((column) => (
            <div key={column.title}>
              <div className="footer-col-title">{column.title}</div>
              <ul className="footer-links">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <a href={link.href}>{link.label}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="footer-bottom">
          <span>{footerBottom.copyright}</span>
          <span>{footerBottom.madeIn}</span>
        </div>
      </div>
    </footer>
  );
}
