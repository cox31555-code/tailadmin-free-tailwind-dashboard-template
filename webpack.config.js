const path = require("path");
const glob = require("glob");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const { createProxyMiddleware } = require("http-proxy-middleware");

const INCLUDE_PATTERN =
  /<include\s+src=["'](.+?)["']\s*\/?>\s*(?:<\/include>)?/gis;

const processNestedHtml = (content, loaderContext, dir = null) =>
  !INCLUDE_PATTERN.test(content)
    ? content
    : content.replace(INCLUDE_PATTERN, (m, src) => {
        const filePath = path.resolve(dir || loaderContext.context, src);
        loaderContext.dependency(filePath);
        return processNestedHtml(
          loaderContext.fs.readFileSync(filePath, "utf8"),
          loaderContext,
          path.dirname(filePath),
        );
      });

// HTML generation
const paths = [];
const generateHTMLPlugins = () =>
  glob.sync("./src/*.html").map((dir) => {
    const filename = path.basename(dir);

    if (filename !== "404.html") {
      paths.push(filename);
    }

    return new HtmlWebpackPlugin({
      filename,
      template: `./src/${filename}`,
      favicon: `./src/images/favicon.ico`,
      inject: "body",
    });
  });

module.exports = {
  mode: "development",
  entry: "./src/js/index.js",
  devServer: {
    static: {
      directory: path.join(__dirname, "./build"),
    },
    compress: true,
    port: 3000,
    hot: false,
    client: false,
    liveReload: false,
    devMiddleware: {
      writeToDisk: true,
    },
    setupMiddlewares: (middlewares, devServer) => {
      // Helper function to rewrite URLs in HTML/CSS/JS
      const rewriteUrls = (content, baseUrl) => {
        // Rewrite href, src, action, and url() attributes - MUST avoid double-proxying
        content = content.replace(/(href|src|action|data|poster|url\()\s*=?\s*["']?([^"'\)]+)["']?\)?/gi, (match, attr, url) => {
          // Skip data URIs, mailto, javascript, anchors, and already proxied URLs
          if (url.startsWith('data:') || url.startsWith('mailto:') || url.startsWith('javascript:') ||
              url.startsWith('#') || url.startsWith('blob:') || url.startsWith('/app/crisp')) {
            return match;
          }

          // Convert relative URLs to absolute (for Crisp domain)
          if (!url.startsWith('http://') && !url.startsWith('https://')) {
            try {
              url = new URL(url, baseUrl).href;
            } catch (e) {
              return match;
            }
          }

          // Only proxy Crisp URLs
          if (!url.includes('app.crisp.chat') && !url.includes('crisp')) {
            return match;
          }

          // Route through proxy
          const proxiedUrl = '/app/crisp?url=' + encodeURIComponent(url);

          if (attr.toLowerCase() === 'url(') {
            return `url(${proxiedUrl})`;
          } else {
            return `${attr}="${proxiedUrl}"`;
          }
        });

        // Rewrite URLs in JSON-like strings (for API endpoints in JS)
        // Match Crisp URLs and relative paths that should be proxied
        content = content.replace(/"((?:https?:\/\/)?[^"]*(?:app\.crisp|\.crisp|\/(?:api|fonts|ws|static|website))[^"]*?)"/g, (match, url) => {
          if (url.startsWith('/app/crisp')) return match; // Already proxied

          let fullUrl = url;
          if (!url.startsWith('http://') && !url.startsWith('https://')) {
            try {
              fullUrl = new URL(url, baseUrl).href;
            } catch (e) {
              return match;
            }
          }

          return `"${'/app/crisp?url=' + encodeURIComponent(fullUrl)}"`;
        });

        // Rewrite URLs in JavaScript string literals (with single quotes)
        content = content.replace(/'((?:https?:\/\/)?[^']*(?:app\.crisp|\.crisp|\/(?:api|fonts|ws|static|website))[^']*)'/g, (match, url) => {
          if (url.startsWith('/app/crisp')) return match; // Already proxied

          let fullUrl = url;
          if (!url.startsWith('http://') && !url.startsWith('https://')) {
            try {
              fullUrl = new URL(url, baseUrl).href;
            } catch (e) {
              return match;
            }
          }

          return `'${'/app/crisp?url=' + encodeURIComponent(fullUrl)}'`;
        });

        // Rewrite URLs in template literals
        content = content.replace(/`((?:https?:\/\/)?[^`]*(?:app\.crisp|\.crisp|\/(?:api|fonts|ws|static|website))[^`]*?)`/g, (match, url) => {
          if (url.startsWith('/app/crisp')) return match; // Already proxied

          let fullUrl = url;
          if (!url.startsWith('http://') && !url.startsWith('https://')) {
            try {
              fullUrl = new URL(url, baseUrl).href;
            } catch (e) {
              return match;
            }
          }

          return `\`${'/app/crisp?url=' + encodeURIComponent(fullUrl)}\``;
        });

        return content;
      };

      // Inject script to intercept fetch/XMLHttpRequest and handle service workers
      const injectProxyScript = (html) => {
        const proxyScript = `
<script>
(function() {
  const proxyPath = '/app/crisp?url=';
  const baseUrl = 'https://app.crisp.chat';

  // Helper to check if URL should be proxied
  function shouldProxy(url) {
    if (!url || typeof url !== 'string') return false;
    if (url.startsWith('data:') || url.startsWith('blob:') || url.startsWith('javascript:')) return false;
    return url.includes('app.crisp.chat') || url.includes('crisp');
  }

  // Helper to normalize and proxy URL
  function proxyUrl(url) {
    if (!url) return url;
    try {
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = new URL(url, baseUrl).href;
      }
      if (shouldProxy(url)) {
        return proxyPath + encodeURIComponent(url);
      }
    } catch (e) {
      console.warn('[Proxy] Failed to parse URL:', url, e);
    }
    return url;
  }

  // Intercept fetch requests
  const originalFetch = window.fetch;
  window.fetch = function(...args) {
    if (args[0]) {
      args[0] = proxyUrl(args[0]);
    }
    return originalFetch.apply(this, args);
  };

  // Intercept XMLHttpRequest
  const originalOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(method, url, ...rest) {
    url = proxyUrl(url);
    return originalOpen.call(this, method, url, ...rest);
  };

  // Block service worker registration
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register = function() {
      console.warn('[Proxy] Service Worker registration blocked');
      return Promise.reject(new Error('Service Worker registration disabled by proxy'));
    };
  }

  // Intercept form submissions
  document.addEventListener('submit', function(e) {
    if (e.target && e.target.action) {
      e.target.action = proxyUrl(e.target.action);
    }
  }, true);

  // Intercept image loading dynamically
  const originalImage = Image;
  window.Image = class ProxiedImage extends originalImage {
    set src(value) {
      super.src = proxyUrl(value);
    }
    get src() {
      return super.src;
    }
  };

  // Intercept dynamic style/link injection
  const originalInsertBefore = Element.prototype.insertBefore;
  Element.prototype.insertBefore = function(newNode, refNode) {
    if (newNode && newNode.nodeType === Node.ELEMENT_NODE) {
      if (newNode.tagName === 'LINK' && newNode.href) {
        newNode.href = proxyUrl(newNode.href);
      }
      if (newNode.tagName === 'SCRIPT' && newNode.src) {
        newNode.src = proxyUrl(newNode.src);
      }
      if (newNode.tagName === 'IMG' && newNode.src) {
        newNode.src = proxyUrl(newNode.src);
      }
    }
    return originalInsertBefore.call(this, newNode, refNode);
  };

  // Intercept appendChild
  const originalAppendChild = Element.prototype.appendChild;
  Element.prototype.appendChild = function(node) {
    if (node && node.nodeType === Node.ELEMENT_NODE) {
      if (node.tagName === 'LINK' && node.href) {
        node.href = proxyUrl(node.href);
      }
      if (node.tagName === 'SCRIPT' && node.src) {
        node.src = proxyUrl(node.src);
      }
      if (node.tagName === 'IMG' && node.src) {
        node.src = proxyUrl(node.src);
      }
    }
    return originalAppendChild.call(this, node);
  };

  // Log proxy activity for debugging
  window.__proxyDebug = {
    log: function(msg) {
      console.log('[Proxy Debug] ' + msg);
    },
    error: function(msg) {
      console.error('[Proxy Error] ' + msg);
    },
    proxyUrl: proxyUrl
  };
})();
</script>
        `;
        return html.replace(/<head[^>]*>/i, (match) => match + proxyScript);
      };

      // Proxy for Crisp with comprehensive routing and session support
      devServer.app.use(
        "/app/crisp",
        createProxyMiddleware({
          target: "https://app.crisp.chat",
          changeOrigin: true,
          pathRewrite: {
            "^/app/crisp\\?url=": "",
            "^/app/crisp": "",
          },
          onProxyReq: (proxyReq, req, res) => {
            // Handle URL parameter if present
            if (req.url.includes('?url=')) {
              const urlMatch = req.url.match(/\?url=([^&]+)/);
              if (urlMatch) {
                const targetUrl = decodeURIComponent(urlMatch[1]);
                const parsedUrl = new URL(targetUrl);
                proxyReq.path = parsedUrl.pathname + parsedUrl.search;
                proxyReq.setHeader('Host', parsedUrl.hostname);
              }
            }

            // Set proper browser headers
            proxyReq.setHeader("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8");
            proxyReq.setHeader("Accept-Language", "en-US,en;q=0.9");
            proxyReq.setHeader("Accept-Encoding", "identity");
            proxyReq.setHeader("Connection", "keep-alive");
            proxyReq.setHeader("Upgrade-Insecure-Requests", "1");
            proxyReq.setHeader("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
            proxyReq.setHeader("Referer", "https://app.crisp.chat/");

            // Forward cookies for session persistence
            if (req.headers.cookie) {
              proxyReq.setHeader("Cookie", req.headers.cookie);
            }
          },
          selfHandleResponse: true,
          onProxyRes: (proxyRes, req, res) => {
            let body = "";

            proxyRes.on("data", (chunk) => {
              body += chunk.toString();
            });

            proxyRes.on("end", () => {
              // Remove restrictive security headers
              delete proxyRes.headers["x-frame-options"];
              delete proxyRes.headers["content-security-policy"];
              delete proxyRes.headers["x-content-security-policy"];
              delete proxyRes.headers["x-webkit-csp"];
              delete proxyRes.headers["content-encoding"];
              delete proxyRes.headers["transfer-encoding"];

              // Set permissive headers for iframe embedding
              proxyRes.headers["content-security-policy"] = "frame-ancestors 'self' http://localhost:* https://*.fly.dev; default-src * 'unsafe-inline' 'unsafe-eval'; script-src * 'unsafe-inline' 'unsafe-eval'; style-src * 'unsafe-inline'";
              proxyRes.headers["x-frame-options"] = "SAMEORIGIN";
              proxyRes.headers["access-control-allow-origin"] = "*";
              proxyRes.headers["access-control-allow-credentials"] = "true";

              // Handle redirects by rewriting location header
              if (proxyRes.statusCode >= 300 && proxyRes.statusCode < 400 && proxyRes.headers.location) {
                let location = proxyRes.headers.location;
                if (!location.startsWith('http://') && !location.startsWith('https://')) {
                  location = new URL(location, "https://app.crisp.chat").href;
                }
                proxyRes.headers.location = '/app/crisp?url=' + encodeURIComponent(location);
              }

              // Rewrite cookie domain for proxy
              if (proxyRes.headers["set-cookie"]) {
                const cookies = Array.isArray(proxyRes.headers["set-cookie"])
                  ? proxyRes.headers["set-cookie"]
                  : [proxyRes.headers["set-cookie"]];

                proxyRes.headers["set-cookie"] = cookies.map(cookie => {
                  // Remove domain restriction so cookies work through proxy
                  return cookie.replace(/Domain=[^;]*/i, '').replace(/SameSite=Strict/i, 'SameSite=None;Secure');
                });

                res.setHeader("Set-Cookie", proxyRes.headers["set-cookie"]);
              }

              // Rewrite URLs in HTML content
              if (proxyRes.headers["content-type"] && proxyRes.headers["content-type"].includes("text/html")) {
                body = rewriteUrls(body, "https://app.crisp.chat");
                body = injectProxyScript(body);
                body = body.replace(
                  /<head[^>]*>/i,
                  `<head><base href="/app/crisp/">`
                );
              }

              // Rewrite URLs in CSS
              if (proxyRes.headers["content-type"] && proxyRes.headers["content-type"].includes("text/css")) {
                body = rewriteUrls(body, "https://app.crisp.chat");
              }

              // Rewrite URLs in JavaScript
              if (proxyRes.headers["content-type"] && proxyRes.headers["content-type"].includes("javascript")) {
                body = rewriteUrls(body, "https://app.crisp.chat");
              }

              res.writeHead(proxyRes.statusCode, proxyRes.headers);
              res.end(body);
            });
          },
          onError: (err, req, res) => {
            console.error('[Proxy Error]', err);
            res.writeHead(502, { 'Content-Type': 'text/html' });
            res.end(`
              <html>
                <body style="font-family: Arial; padding: 20px;">
                  <h1>Proxy Error</h1>
                  <p>Failed to fetch the requested resource.</p>
                  <details>
                    <summary>Error Details</summary>
                    <pre>${err.message}</pre>
                  </details>
                </body>
              </html>
            `);
          },
          ws: true,
          logLevel: "warn",
        })
      );

      return middlewares;
    },
  },
  module: {
    rules: [
      {
        test: /\.m?js$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            presets: ["@babel/preset-env"],
          },
        },
      },
      {
        test: /\.css$/i,
        use: [
          MiniCssExtractPlugin.loader,
          "css-loader",
          {
            loader: "postcss-loader",
            options: {
              postcssOptions: {
                plugins: [
                  require("autoprefixer")({
                    overrideBrowserslist: ["last 2 versions"],
                  }),
                ],
              },
            },
          },
        ],
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/i,
        type: "asset/resource",
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/i,
        type: "asset/resource",
      },
      {
        test: /\.html$/,
        loader: "html-loader",
        options: {
          preprocessor: processNestedHtml,
        },
      },
    ],
  },
  plugins: [
    ...generateHTMLPlugins(),
    new MiniCssExtractPlugin({
      filename: "style.css",
      chunkFilename: "style.css",
    }),
  ],
  output: {
    filename: "bundle.js",
    path: path.resolve(__dirname, "build"),
    clean: true,
    assetModuleFilename: "[path][name][ext]",
  },
  target: "web", // fix for "browserslist" error message
  stats: "errors-only", // suppress irrelevant log messages
};
