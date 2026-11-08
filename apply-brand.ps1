$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$site = Join-Path $root 'src\components\Site.jsx'
$main = Join-Path $root 'src\main.jsx'
$html = Join-Path $root 'index.html'
$svg = Join-Path $root 'public\mojis-mark.svg'
$css = Join-Path $root 'src\brand.css'
foreach ($f in @($site,$main,$html,$svg,$css)) { if (!(Test-Path $f)) { throw "Missing required file: $f" } }
foreach ($f in @($site,$main,$html)) { $backup="$f.brand-backup"; if (!(Test-Path $backup)) { Copy-Item $f $backup } }
$utf8 = New-Object System.Text.UTF8Encoding($false)
function Write-Utf8($path,$value) { [System.IO.File]::WriteAllText($path,$value,$utf8) }
$s=[System.IO.File]::ReadAllText($site)
$oldNav=@'
          className="heading brand"
        >
          Moji&apos;s Heritage
        </Link>
'@
$newNav=@'
          className="heading brand"
        >
          <img src="/mojis-mark.svg" alt="" className="brand-mark" />
          <span className="brand-name">Moji&apos;s Heritage</span>
        </Link>
'@
if ($s.Contains($oldNav) -and !$s.Contains('className="brand-name"')) { $s=$s.Replace($oldNav,$newNav) }
$oldFooter=@'
          <h2 className="heading">
            Moji&apos;s Heritage
          </h2>
'@
$newFooter=@'
          <h2 className="heading footer-brand">
            <img src="/mojis-mark.svg" alt="" className="brand-mark" />
            <span>Moji&apos;s Heritage</span>
          </h2>
'@
if ($s.Contains($oldFooter)) { $s=$s.Replace($oldFooter,$newFooter) }
Write-Utf8 $site $s
$m=[System.IO.File]::ReadAllText($main)
if (!$m.Contains('"./brand.css"')) { $m='import "./brand.css";' + "`r`n" + $m }
if (!$m.Contains('heritage-startup')) { $m += @'

// Hide the in-page startup emblem after React has rendered.
window.addEventListener("load", () => {
  const splash = document.getElementById("heritage-startup");
  if (splash) {
    splash.classList.add("is-ready");
    window.setTimeout(() => splash.remove(), 350);
  }
});
'@ }
Write-Utf8 $main $m
$h=[System.IO.File]::ReadAllText($html)
$h=$h.Replace('href="/favicon.svg"','href="/mojis-mark.svg"')
if (!$h.Contains('heritage-startup')) {
  $splash=@'
    <div id="heritage-startup" aria-hidden="true" style="position:fixed;inset:0;z-index:99999;display:grid;place-items:center;background:#faf9f5">
      <img src="/mojis-mark.svg" alt="" style="width:min(38vw,155px);height:auto;border:0;background:transparent" />
    </div>
'@
  $h=$h.Replace('<div id="root"></div>',"$splash`r`n    <div id=`"root`"></div>")
}
if (!$h.Contains('rel="manifest"')) { $h=$h.Replace('</head>','    <link rel="manifest" href="/manifest.webmanifest" />' + "`r`n" + '  </head>') }
Write-Utf8 $html $h
$manifest=@'
{
  "name": "Moji's Heritage",
  "short_name": "Moji's Heritage",
  "start_url": "/",
  "scope": "/",
  "display": "standalone",
  "background_color": "#FAF9F5",
  "theme_color": "#1a5c2e",
  "icons": [{"src":"/mojis-mark.svg","sizes":"any","type":"image/svg+xml","purpose":"any"}]
}
'@
$manifestPath=Join-Path $root 'public\manifest.webmanifest'
if (!(Test-Path $manifestPath)) { Write-Utf8 $manifestPath $manifest }
Write-Host 'Brand applied. Backups saved as .brand-backup. Run npm.cmd run build.' -ForegroundColor Green
Write-Host 'Note: Android/Chrome may use an OS-controlled icon mask or splash; SVG alone cannot guarantee a completely borderless native splash.'
