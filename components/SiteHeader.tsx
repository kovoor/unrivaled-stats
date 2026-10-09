export function SiteHeader() {
  return (<>
<header className={"site-nav"}>
  <button className={"site-nav__burger"} type={"button"} aria-label={"Menu"}><span></span><span></span><span></span></button>
  <nav className={"site-nav__links"} aria-label={"Main"}>
    <a href={"https://www.unrivaled.basketball/"}>{"Home"}</a>
    <a href={"https://www.unrivaled.basketball/schedule"}>{"Games"}</a>
    <a href={"https://www.unrivaled.basketball/clubs"}>{"Clubs"}</a>
    <a href={"https://www.unrivaled.basketball/players"}>{"Players"}</a>
    <a href={"/stats"}>{"Stats"}</a>
    <a href={"https://www.unrivaled.basketball/standings"}>{"Standings"}</a>
  </nav>
  <a className={"site-nav__icon"} href={"https://www.unrivaled.basketball/"} aria-label={"Unrivaled home"}></a>
  <div className={"site-nav__right"}>
    <nav className={"site-nav__links"} aria-label={"More"}>
      <a href={"https://www.unrivaled.basketball/arena"} data-hint={"Miami"}>{"Season 3"}</a>
      <a href={"https://www.unrivaled.basketball/news"}>{"News"}</a>
      <a href={"https://www.unrivaled.basketball/videos"}>{"Watch"}</a>
      <a href={"https://shop.unrivaled.basketball/?utm_source=unrivaled.basketball"}>{"Shop"}</a>
      <a href={"https://www.unrivaled.basketball/newsletter"}>{"More"}</a>
    </nav>
    <span className={"site-nav__me"} aria-label={"Signed in"}>{"SP"}</span>
  </div>
</header>

  </>);
}
