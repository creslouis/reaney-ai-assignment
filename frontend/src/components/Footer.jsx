import { Link } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { T } from "../data/translations";
import { cmsSetting } from "../cms";

export default function Footer() {
  const { lang, cmsBundle } = useApp();
  const t = T[lang];
  const branding = cmsSetting(cmsBundle, "branding.app", {});
  const appName = lang === "km" ? (branding.app_name_km || "រៀនអី") : (branding.app_name_en || "ReanEy");
  const tagline = lang === "km" ? (branding.tagline_km || "ស្វែងរកមុខជំនាញអនាគតរបស់អ្នកដោយទំនុកចិត្ត") : (branding.tagline_en || "Find your future major with confidence");
  const legal = cmsBundle?.legal || {};

  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div>
          <div className="site-footer-title">{appName}</div>
          <div className="site-footer-sub">{tagline}</div>
        </div>
        <div className="site-footer-links">
          <Link to="/legal/terms" className="footer-link">{legal.terms?.title || t.footerTerms}</Link>
          <Link to="/legal/privacy" className="footer-link">{legal.privacy?.title || t.footerPrivacy}</Link>
        </div>
      </div>
    </footer>
  );
}
