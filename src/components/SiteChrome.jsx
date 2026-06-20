function isEditorPath(pathname) {
  return pathname === "/" || pathname === "";
}

function isAtlasPath(pathname) {
  return pathname === "/style-atlas" || pathname === "/test";
}

export function SiteChrome({ currentPath, docPages, activeDocPage, onNavigate, children }) {
  return (
    <>
      <header className="fx-sitebar">
        <div className="fx-sitebar__inner">
          <div className="fx-sitebar__brand">
            <strong>Factorio GUI</strong>
            <span>Web Editor</span>
          </div>
          <nav className="fx-sitebar__nav" aria-label="Project links">
            <a
              href="/"
              aria-current={isEditorPath(currentPath) ? "page" : undefined}
              onClick={(event) => onNavigate(event, "/")}
            >
              Editor
            </a>
            <a
              href="/style-atlas"
              aria-current={isAtlasPath(currentPath) ? "page" : undefined}
              onClick={(event) => onNavigate(event, "/style-atlas")}
            >
              Style Atlas
            </a>
            {docPages.map((docPage) => (
              <a
                key={docPage.path}
                href={docPage.path}
                aria-current={docPage.path === activeDocPage?.path ? "page" : undefined}
                onClick={(event) => onNavigate(event, docPage.path)}
              >
                {docPage.title}
              </a>
            ))}
          </nav>
        </div>
      </header>
      {children}
    </>
  );
}
