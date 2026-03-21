const themeScript = `(function(){var s=localStorage.getItem('theme');var d=window.matchMedia('(prefers-color-scheme:dark)').matches;if(s==='dark'||(!s&&d))document.documentElement.classList.add('dark');})()`;

export function Head() {
  return (
    <>
      <meta charSet="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
      <link rel="apple-touch-icon" sizes="192x192" href="/favicon-192x192.png" />
      <link rel="manifest" href="/site.webmanifest" />
      <link
        rel="preload"
        href="/fonts/inter-latin.woff2"
        as="font"
        type="font/woff2"
        crossOrigin=""
      />
    </>
  );
}
