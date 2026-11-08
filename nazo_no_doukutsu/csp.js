// GitHub Pages で公開している時だけ、読み込める先を自サイトと Google Fonts に限る
// （Claude 上のプレビューでは、Claude 側の仕組みを妨げないよう付けない）
(function () {
  if (!/\.github\.io$/.test(location.hostname)) return;
  var m = document.createElement('meta');
  m.httpEquiv = 'Content-Security-Policy';
  m.content = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'; worker-src 'self'; manifest-src 'self'; object-src 'none'; base-uri 'self'; form-action 'none'";
  document.head.appendChild(m);
})();
