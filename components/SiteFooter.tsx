export function SiteFooter() {
  return (<>
<footer className={"site-footer"}>
  <div className={"site-footer__inner"}>
    <a className={"site-footer__wordmark"} href={"https://www.unrivaled.basketball/"} aria-label={"Unrivaled home"}></a>
    <nav className={"site-footer__nav"} aria-label={"Footer"}>
      <a href={"https://www.unrivaled.basketball/newsletter"}>{"Newsletter"}</a>
      <a href={"https://www.unrivaled.basketball/careers"}>{"Careers"}</a>
      <a href={"https://www.unrivaled.basketball/contact-us"}>{"Contact Us"}</a>
      <a href={"https://www.unrivaled.basketball/partners"}>{"Partners"}</a>
      <a href={"https://www.unrivaled.basketball/legal/privacy-policy"}>{"Privacy Policy"}</a>
      <a href={"https://www.unrivaled.basketball/legal/terms-of-use"}>{"Terms of Use"}</a>
    </nav>
    <div className={"site-footer__rule"}></div>
    <p className={"site-footer__copy"}>{"© 2026 Unrivaled, LLC. All rights reserved."}</p>
  </div>
</footer>

  </>);
}
