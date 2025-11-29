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


      // Proxy for Crisp with comprehensive routing and session support
      devServer.app.use(
        "/app/crisp",
        createProxyMiddleware({
          target: "https://app.crisp.chat",
          changeOrigin: true,
          // Don't use pathRewrite - handle it in onProxyReq instead
          onProxyReq: (proxyReq, req, res) => {
            let targetUrl = "https://app.crisp.chat";
            let targetPath = req.url.replace(/^\/app\/crisp/, "");

            // Handle URL parameter if present (e.g., /app/crisp?url=https%3A%2F%2Fapp.crisp.chat%2Fapi%2Fv1...)
            if (req.url.includes('?url=')) {
              const urlMatch = req.url.match(/\?url=([^&]+)/);
              if (urlMatch) {
                targetUrl = decodeURIComponent(urlMatch[1]);
                const parsedUrl = new URL(targetUrl);
                targetPath = parsedUrl.pathname + (parsedUrl.search || '');
                proxyReq.setHeader('Host', parsedUrl.hostname);
              }
            } else {
              // For requests without ?url= parameter, assume they're for app.crisp.chat
              // This handles relative requests from the iframe
              targetUrl = "https://app.crisp.chat";
              targetPath = req.url.replace(/^\/app\/crisp/, "");
              proxyReq.setHeader('Host', 'app.crisp.chat');
            }

            // Set the correct path for the upstream request
            proxyReq.path = targetPath;

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

            console.log(`[Proxy] Routing ${req.url} -> ${targetUrl}${targetPath}`);
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

              // No need to inject base tag - proxy handles all requests

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
