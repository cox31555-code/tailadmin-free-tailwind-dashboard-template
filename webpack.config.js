const path = require("path");
const fs = require("fs");
const glob = require("glob");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const { createProxyMiddleware } = require("http-proxy-middleware");
const { BetaAnalyticsDataClient } = require("@google-analytics/data");
const { GoogleAuth } = require("google-auth-library");

// Load GA credentials from JSON file
let gaCredentials = null;
const credentialsPath = path.join(__dirname, "ga-credentials.json");
if (fs.existsSync(credentialsPath)) {
  try {
    gaCredentials = JSON.parse(fs.readFileSync(credentialsPath, "utf8"));
  } catch (err) {
    console.error("Failed to load GA credentials:", err);
  }
}

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
          if (!gaCredentials) {
            throw new Error("GA credentials not loaded");
          }

          const serviceAccountKey = gaCredentials;

          // Debug logging
          console.log("[GA API] Using credentials:", {
            project_id: serviceAccountKey.project_id ? "✓" : "✗",
            private_key_id: serviceAccountKey.private_key_id ? "✓" : "✗",
            private_key: serviceAccountKey.private_key ? `✓ (${serviceAccountKey.private_key.length} chars)` : "✗",
            client_email: serviceAccountKey.client_email ? "✓" : "✗"
          });

          console.log("[GA API] Credentials object:", {
            type: serviceAccountKey.type,
            project_id: serviceAccountKey.project_id,
            private_key_id: serviceAccountKey.private_key_id,
            private_key_length: serviceAccountKey.private_key?.length,
            private_key_start: serviceAccountKey.private_key?.substring(0, 50),
            client_email: serviceAccountKey.client_email,
            client_id: serviceAccountKey.client_id
          });

          const analyticsDataClient = new BetaAnalyticsDataClient({
            credentials: serviceAccountKey,
          });

          const propertyId = "510184850";

          // Get real-time user count
          const realtimeResponse = await analyticsDataClient.runRealtimeReport({
            property: `properties/${propertyId}`,
            metrics: [
              { name: "activeUsers" },
            ],
          });

          // Get 30-day date range
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          const startDate = thirtyDaysAgo.toISOString().split("T")[0];
          const endDate = new Date().toISOString().split("T")[0];

          // Get daily data for trend chart (last 30 days)
          const dailyResponse = await analyticsDataClient.runReport({
            property: `properties/${propertyId}`,
            dateRanges: [
              {
                startDate: startDate,
                endDate: endDate,
              },
            ],
            metrics: [
              { name: "activeUsers" },
              { name: "sessions" },
              { name: "screenPageViews" },
            ],
            dimensions: [
              { name: "date" },
            ],
          });

          // Get sessions metric
          const sessionsResponse = await analyticsDataClient.runReport({
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
          });

          // Get page views metric
          const pageViewsResponse = await analyticsDataClient.runReport({
            property: `properties/${propertyId}`,
            dateRanges: [
              {
                startDate: startDate,
                endDate: endDate,
              },
            ],
            metrics: [
              { name: "screenPageViews" },
            ],
          });

          // Get total users
          const usersResponse = await analyticsDataClient.runReport({
            property: `properties/${propertyId}`,
            dateRanges: [
              {
                startDate: startDate,
                endDate: endDate,
              },
            ],
            metrics: [
              { name: "activeUsers" },
            ],
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
              { name: "sessions" },
            ],
            dimensions: [
              { name: "pagePath" },
            ],
          });

          // Get device breakdown
          const deviceResponse = await analyticsDataClient.runReport({
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
              { name: "deviceCategory" },
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
              { name: "firstUserSourceMedium" },
            ],
          });

          // Get countries
          const countriesResponse = await analyticsDataClient.runReport({
            property: `properties/${propertyId}`,
            dateRanges: [
              {
                startDate: startDate,
                endDate: endDate,
              },
            ],
            metrics: [
              { name: "sessions" },
              { name: "activeUsers" },
            ],
            dimensions: [
              { name: "country" },
            ],
          });

          // Get user type (new vs returning)
          const userTypeResponse = await analyticsDataClient.runReport({
            property: `properties/${propertyId}`,
            dateRanges: [
              {
                startDate: startDate,
                endDate: endDate,
              },
            ],
            metrics: [
              { name: "activeUsers" },
              { name: "sessions" },
            ],
            dimensions: [
              { name: "userType" },
            ],
          });

          // Get browsers
          const browsersResponse = await analyticsDataClient.runReport({
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
              { name: "browser" },
            ],
          });

          // Get operating systems
          const osResponse = await analyticsDataClient.runReport({
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
              { name: "operatingSystem" },
            ],
          });

          res.json({
            realtimeUsers: realtimeResponse[0]?.rows?.[0]?.metricValues?.[0]?.value || "0",
            totalUsers: usersResponse[0]?.rows?.[0]?.metricValues?.[0]?.value || "0",
            totalSessions: sessionsResponse[0]?.rows?.[0]?.metricValues?.[0]?.value || "0",
            totalPageViews: pageViewsResponse[0]?.rows?.[0]?.metricValues?.[0]?.value || "0",
            dailyData: dailyResponse[0]?.rows || [],
            topPages: topPagesResponse[0]?.rows || [],
            devices: deviceResponse[0]?.rows || [],
            trafficSources: trafficResponse[0]?.rows || [],
            countries: countriesResponse[0]?.rows || [],
            userTypes: userTypeResponse[0]?.rows || [],
            browsers: browsersResponse[0]?.rows || [],
            operatingSystems: osResponse[0]?.rows || [],
          });
        } catch (error) {
          console.error("GA API Error:", {
            message: error.message,
            code: error.code,
            details: error.details,
            credentials_check: {
              project_id: process.env.GA_PROJECT_ID ? "set" : "missing",
              private_key_id: process.env.GA_PRIVATE_KEY_ID ? "set" : "missing",
              private_key: process.env.GA_PRIVATE_KEY ? `set (${process.env.GA_PRIVATE_KEY.length} chars)` : "missing",
              client_email: process.env.GA_CLIENT_EMAIL ? "set" : "missing",
              client_id: process.env.GA_CLIENT_ID ? "set" : "missing"
            }
          });
          res.status(500).json({ error: error.message, code: error.code });
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
