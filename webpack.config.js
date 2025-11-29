const path = require("path");
const glob = require("glob");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const { createProxyMiddleware } = require("http-proxy-middleware");
const { BetaAnalyticsDataClient } = require("@google-analytics/data");
const { GoogleAuth } = require("google-auth-library");

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
      // Store the current Crisp URL context for the iframe
      let crispContext = "https://app.crisp.chat/website/80335e6a-e33e-478a-8ce3-1b88c05b4ad4/";

      // Simple URL rewriting for HTML content
      const rewriteHtmlUrls = (html, baseUrl) => {
        // Extract the base path from the request URL to maintain context
        baseUrl = baseUrl || crispContext;

        // Rewrite absolute URLs to use proxy
        html = html.replace(/(?:src|href|action|data)=["'](?!data:|javascript:|\/app\/crisp)(https?:\/\/[^"']+)["']/gi, (match, attr, url) => {
          const attrName = match.match(/^(\w+)=/)[1];
          return `${attrName}="/app/crisp?url=${encodeURIComponent(url)}"`;
        });

        // For relative URLs, just use base tag resolution (don't rewrite them)
        // Inject base tag to handle relative URL resolution
        if (baseUrl && !html.includes('<base')) {
          html = html.replace(/<head[^>]*>/i, (match) => {
            return match + `\n  <base href="${baseUrl}">`;
          });
        }

        return html;
      };


      // Google Analytics API endpoint
      devServer.app.get("/api/ga/metrics", async (req, res) => {
        try {
          const serviceAccountKey = {
            type: "service_account",
            project_id: "lc-website-479714",
            private_key_id: "18bdaa22d13dd555a4588dded8c83e08c86a81f8",
            private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCKpcJUIPOVgGry\nPIrRsdRuYj1j0jHmSJqL0QuZGFooC5BtABag+szsjaQroCGbc8N97Q1IodvEKmN9\nGqXG20g92CZwqQv8I1d6C/5TQIiZ93qb9BJP4RsGgBiVDMJW8VMPqMadq1dzCXm/\n6X8zWUJVCQ83wkxmIesyntK9l8ePzpmaA5GrnVw/nLCF0yj8PEJ5b91WUU5NlGgv\nYijid7mWWgW/E6PScGeex5GlNzDRQLe4X+8r4M6Hw1uOvG94UjBzWL02X3a3YVUr\nn3Y9e6zk3gvjsceXYsm49jXcslOGWPg+rUM2HByRJCUr5r7s7A4eKjRvA+hD3qKm\nolZi063BAgMBAAECggEAFiOr6UUtwES2TyINxLhRxKKZTPRGlZAoZYUnBfZWhyh5\nkn4+HsyNpoRjn7e9RhZxNA2DXoLCFgvywQpdSGjBm2aFlN3ZlRSLpmh93wtiBLv4\n7yhFOE4ow5v20O4tpjZ43fpEZO70UuFDeLqvXiK1reB5dpznGDP4W6fy3OV8r2DA\n/7nyVf4LPGFVUfXnogJH9QEBMeAPGhaZld/jDWfJa5Mj0bvf1Ggg4lkkkVJHOzWv\nFy99nltabB3gZaDOMUNAANRFu7DCa+xJCkZnkIyRmQDrBv4/QVB5mtOT3klkv8zp\nukdQju3j3INhRDgaI2HryWOUGakh9/tyu5b+5V31MQKBgQDDKdssMKqE0nEoSHFq\nd+R96sXPvm5cWxy/jWq+8/VtB4IID7v20qpU+jV0suTl+sruib1+KMVsoJ1cJS/R\nBVwfzkWNPMWaWWUJbIy4d7gBFkDQGDEVy6DZWui/Ur/zD2ihcb+Va31wQhjY+qkc\nYi79tdqnPgGW3ZKPHm1CA5vepQKBgQC13eXbXdQ1eW+xKIjFlrdeOURCgjTe3N/T\n9/cMdA29UjyFrM5OGit2dm8PdNUnNVopDcqpn0By0ckNV/Sv0NZhLGUMs3R6uHq+\nUKN9Y2v+c6yrLMJFuzo/WXL9Z2Y69XeUS2YDjQ+ro28Pog2CKozxNc+skisbI5Pn\nuAOBtd4j7QKBgDtrFeiJVJElxP/ftnAU2oMfpGQQdWc28jS7qIFEozczrvonWDHY\nh7VhjD7gbGI8jeY8F24+mYTuDZrNU5aOzDJ+yZwroXnRt7o7y0gqYuIp1UfF5cPe\nADXMwMnnNruYuGFW0V57oHA6H3iIME6M8gOah1yduzwkb4eVWuxbTuxlAoGAOleV\nBWp0STNLwWlfdwOCj5ePbkaW72er5jQF7NjOD43yHG/zPtrmVnpn5m10c7+JzOG/\nwep0omDqPn2Y4U39d+7l+80V8Mh9l9AGopLich5ppgAV0ojdhrULTn99LCzSz5/g\negMmo8kqN7mk270KudapaJL7gRlIuW0uss3FFYECgYEAnSUtZctcvnZfOeuq/Uip\nWgGz0VnYAnfnYlfP3S4QJO+99f/OqD1Qws17agy3V4h48AzoBsUI5mqdrAKNabAX\ncQ11VLuDUJVRTl8mA6MoyBUpmW6v9YTc9MRKL+sbYN4sEhn3tI+RA/A63T7s6o6G\nk8nvRgNG7RnbQDh6a5JXEO8=\n-----END PRIVATE KEY-----\n",
            client_email: "limitless@lc-website-479714.iam.gserviceaccount.com",
            client_id: "104950374673327892154",
            auth_uri: "https://accounts.google.com/o/oauth2/auth",
            token_uri: "https://oauth2.googleapis.com/token",
            auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
            client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/limitless%40lc-website-479714.iam.gserviceaccount.com",
            universe_domain: "googleapis.com"
          };

          const analyticsDataClient = new BetaAnalyticsDataClient({
            credentials: serviceAccountKey,
          });

          const propertyId = "372700632";

          // Get real-time user count
          const realtimeResponse = await analyticsDataClient.runRealtimeReport({
            property: `properties/${propertyId}`,
            metrics: [
              { name: "activeUsers" },
            ],
          });

          // Get 30-day metrics
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          const startDate = thirtyDaysAgo.toISOString().split("T")[0];
          const endDate = new Date().toISOString().split("T")[0];

          const monthlyResponse = await analyticsDataClient.runReport({
            property: `properties/${propertyId}`,
            dateRanges: [
              {
                startDate: startDate,
                endDate: endDate,
              },
            ],
            metrics: [
              { name: "totalUsers" },
              { name: "sessions" },
              { name: "screenPageViews" },
              { name: "averageSessionDuration" },
              { name: "bounceRate" },
            ],
            dimensions: [
              { name: "date" },
            ],
            limit: 30,
          });

          // Get top pages
          const topPagesResponse = await analyticsDataClient.runReport({
            property: `properties/${propertyId}`,
            dateRanges: [
              {
                startDate: startDate,
                endDate: endDate,
              },
            ],
            metrics: [
              { name: "screenPageViews" },
              { name: "avgSessionDuration" },
            ],
            dimensions: [
              { name: "pagePath" },
            ],
            limit: 10,
            orderBys: [
              {
                metric: { name: "screenPageViews" },
                descending: true,
              },
            ],
          });

          // Get traffic sources
          const trafficResponse = await analyticsDataClient.runReport({
            property: `properties/${propertyId}`,
            dateRanges: [
              {
                startDate: startDate,
                endDate: endDate,
              },
            ],
            metrics: [
              { name: "sessions" },
            ],
            dimensions: [
              { name: "sessionSource" },
            ],
            limit: 10,
            orderBys: [
              {
                metric: { name: "sessions" },
                descending: true,
              },
            ],
          });

          res.json({
            realtimeUsers: realtimeResponse[0]?.rows?.[0]?.metricValues?.[0]?.value || "0",
            monthlyData: monthlyResponse[0]?.rows || [],
            topPages: topPagesResponse[0]?.rows || [],
            trafficSources: trafficResponse[0]?.rows || [],
          });
        } catch (error) {
          console.error("GA API Error:", error);
          res.status(500).json({ error: error.message });
        }
      });

      // Proxy for Crisp with comprehensive routing and session support
      devServer.app.use(
        "/app/crisp",
        createProxyMiddleware({
          target: "https://app.crisp.chat",
          changeOrigin: true,
          onProxyReq: (proxyReq, req, res) => {
            let targetUrl = "https://app.crisp.chat";
            let targetPath = req.url.replace(/^\/app\/crisp/, "");
            let baseHref = crispContext;

            // Handle URL parameter if present
            if (req.url.includes('?url=')) {
              const urlMatch = req.url.match(/\?url=([^&]+)/);
              if (urlMatch) {
                targetUrl = decodeURIComponent(urlMatch[1]);
                const parsedUrl = new URL(targetUrl);
                targetPath = parsedUrl.pathname + (parsedUrl.search || '');
                baseHref = targetUrl.replace(/[?#].*$/, '').replace(/([^/])$/, '$1/');
                proxyReq.setHeader('Host', parsedUrl.hostname);
              }
            } else {
              // For requests without ?url= parameter, route to app.crisp.chat
              targetPath = req.url.replace(/^\/app\/crisp/, "");
              baseHref = "https://app.crisp.chat" + (targetPath.startsWith('/') ? '' : '/') + targetPath;
              baseHref = baseHref.replace(/([^/])$/, '$1/');
              proxyReq.setHeader('Host', 'app.crisp.chat');
            }

            proxyReq.path = targetPath;

            // Set browser headers
            proxyReq.setHeader("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8");
            proxyReq.setHeader("Accept-Language", "en-US,en;q=0.9");
            proxyReq.setHeader("Accept-Encoding", "identity");
            proxyReq.setHeader("Connection", "keep-alive");
            proxyReq.setHeader("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
            proxyReq.setHeader("Referer", "https://app.crisp.chat/");

            // Always include cookies, even if empty
            if (req.headers.cookie) {
              proxyReq.setHeader("Cookie", req.headers.cookie);
            }

            // Store baseHref in request for later use in response
            req.baseHref = baseHref;
            req.targetUrl = targetUrl;
            console.log(`[Proxy] Routing ${req.url} -> ${targetUrl}${targetPath} (base: ${baseHref})`);
          },
          selfHandleResponse: true,
          onProxyRes: (proxyRes, req, res) => {
            let body = "";

            proxyRes.on("data", (chunk) => {
              body += chunk.toString();
            });

            proxyRes.on("end", () => {
              // Remove restrictive headers
              delete proxyRes.headers["x-frame-options"];
              delete proxyRes.headers["content-security-policy"];
              delete proxyRes.headers["x-content-security-policy"];
              delete proxyRes.headers["x-webkit-csp"];
              delete proxyRes.headers["content-encoding"];
              delete proxyRes.headers["transfer-encoding"];

              // Set permissive headers
              proxyRes.headers["content-security-policy"] = "frame-ancestors 'self' http://localhost:* https://*.fly.dev; default-src * 'unsafe-inline' 'unsafe-eval'; script-src * 'unsafe-inline' 'unsafe-eval'; style-src * 'unsafe-inline'";
              proxyRes.headers["x-frame-options"] = "SAMEORIGIN";
              proxyRes.headers["access-control-allow-origin"] = "*";
              proxyRes.headers["access-control-allow-credentials"] = "true";

              // Handle redirects
              if (proxyRes.statusCode >= 300 && proxyRes.statusCode < 400 && proxyRes.headers.location) {
                let location = proxyRes.headers.location;
                if (!location.startsWith('http://') && !location.startsWith('https://')) {
                  location = new URL(location, "https://app.crisp.chat").href;
                }
                proxyRes.headers.location = '/app/crisp?url=' + encodeURIComponent(location);
              }

              // Rewrite cookies to allow cross-site usage
              if (proxyRes.headers["set-cookie"]) {
                const cookies = Array.isArray(proxyRes.headers["set-cookie"])
                  ? proxyRes.headers["set-cookie"]
                  : [proxyRes.headers["set-cookie"]];

                proxyRes.headers["set-cookie"] = cookies.map(cookie => {
                  // Remove Domain restrictions
                  cookie = cookie.replace(/Domain=[^;]*/i, '');
                  // Remove SameSite or set to None
                  cookie = cookie.replace(/SameSite=[^;]*/i, '');
                  // Add SameSite=None;Secure for cross-site cookies
                  if (!cookie.includes('SameSite')) {
                    cookie = cookie + '; SameSite=None; Secure';
                  }
                  return cookie;
                });

                res.setHeader("Set-Cookie", proxyRes.headers["set-cookie"]);
              }

              // Also add headers to allow credentials in cross-site requests
              proxyRes.headers["access-control-allow-credentials"] = "true";
              if (req.headers.origin) {
                proxyRes.headers["access-control-allow-origin"] = req.headers.origin;
              }

              // Rewrite HTML with base tag and inject credentials script
              if (proxyRes.headers["content-type"] && proxyRes.headers["content-type"].includes("text/html")) {
                body = rewriteHtmlUrls(body, req.baseHref);

                // Inject script to ensure credentials are sent with all requests
                const credentialScript = `<script>
(function() {
  // Intercept fetch to include credentials
  const originalFetch = window.fetch;
  window.fetch = function(...args) {
    if (!args[1]) args[1] = {};
    args[1].credentials = 'include';
    return originalFetch.apply(this, args);
  };

  // Intercept XMLHttpRequest to include credentials
  const originalOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(method, url, ...rest) {
    this.withCredentials = true;
    return originalOpen.call(this, method, url, ...rest);
  };
})();
</script>`;
                body = body.replace(/<head[^>]*>/i, (match) => match + credentialScript);
              }

              res.writeHead(proxyRes.statusCode, proxyRes.headers);
              res.end(body);
            });
          },
          onError: (err, req, res) => {
            console.error('[Proxy Error]', err);
            res.writeHead(502, { 'Content-Type': 'text/html' });
            res.end(`<html><body><h1>Proxy Error</h1><p>${err.message}</p></body></html>`);
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
