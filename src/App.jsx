import { useEffect, useMemo, useState } from "react";
import { DocumentPage } from "./components/DocumentPage.jsx";
import { EditorPage } from "./components/EditorPage.jsx";
import { SiteChrome } from "./components/SiteChrome.jsx";
import { StyleAtlasPage } from "./components/StyleAtlasPage.jsx";
import { docPages, findDocPage } from "./docs.js";

function normalizePath(pathname) {
  return pathname !== "/" && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
}

function routeFor(pathname) {
  const normalizedPath = normalizePath(pathname);

  if (normalizedPath === "/style-atlas" || normalizedPath === "/test") {
    return { kind: "style-atlas" };
  }

  const docPage = findDocPage(normalizedPath);
  if (docPage) {
    return { kind: "document", page: docPage };
  }

  return { kind: "editor" };
}

export function App() {
  const [path, setPath] = useState(normalizePath(window.location.pathname));
  const route = useMemo(() => routeFor(path), [path]);

  useEffect(() => {
    function syncPath() {
      setPath(normalizePath(window.location.pathname));
    }

    window.addEventListener("popstate", syncPath);
    return () => window.removeEventListener("popstate", syncPath);
  }, []);

  function navigate(event, nextPath) {
    event.preventDefault();
    window.history.pushState(null, "", nextPath);
    setPath(normalizePath(nextPath));
  }

  return (
    <SiteChrome
      currentPath={path}
      docPages={docPages}
      activeDocPage={route.kind === "document" ? route.page : null}
      onNavigate={navigate}
    >
      {route.kind === "document" ? (
        <DocumentPage page={route.page} onNavigate={navigate} />
      ) : route.kind === "style-atlas" ? (
        <StyleAtlasPage />
      ) : (
        <EditorPage />
      )}
    </SiteChrome>
  );
}
