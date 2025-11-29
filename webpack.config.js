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
      const { createProxyMiddleware } = require("http-proxy-middleware");

      // Proxy for Crisp with comprehensive routing
      devServer.app.use(
        "/app/crisp",
        createProxyMiddleware({
          target: "https://app.crisp.chat",
          changeOrigin: true,
          pathRewrite: {
            "^/app/crisp": "",
          },
          onProxyReq: (proxyReq, req, res) => {
            proxyReq.setHeader("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8");
            proxyReq.setHeader("Accept-Language", "en-US,en;q=0.5");
            proxyReq.setHeader("Accept-Encoding", "identity");
            proxyReq.setHeader("Connection", "keep-alive");
            proxyReq.setHeader("Upgrade-Insecure-Requests", "1");
            proxyReq.setHeader("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36");
          },
          onProxyRes: (proxyRes, req, res) => {
            delete proxyRes.headers["content-encoding"];
            delete proxyRes.headers["transfer-encoding"];
            delete proxyRes.headers["x-frame-options"];
            delete proxyRes.headers["content-security-policy"];
            delete proxyRes.headers["x-content-security-policy"];
            delete proxyRes.headers["x-webkit-csp"];

            proxyRes.headers["content-security-policy"] = "frame-ancestors 'self' http://localhost:* https://*.fly.dev";
            proxyRes.headers["x-frame-options"] = "SAMEORIGIN";
            proxyRes.headers["access-control-allow-origin"] = "*";

            if (req.path.endsWith(".js")) {
              proxyRes.headers["content-type"] = "application/javascript";
            }
          },
          selfHandleResponse: true,
          ws: true,
          onProxyRes: (proxyRes, req, res) => {
            let body = "";

            proxyRes.on("data", (chunk) => {
              body += chunk;
            });

            proxyRes.on("end", () => {
              // Remove restrictive headers
              delete proxyRes.headers["x-frame-options"];
              delete proxyRes.headers["content-security-policy"];
              delete proxyRes.headers["x-content-security-policy"];
              delete proxyRes.headers["x-webkit-csp"];
              delete proxyRes.headers["content-encoding"];

              // Set permissive headers
              proxyRes.headers["content-security-policy"] = "frame-ancestors 'self' http://localhost:* https://*.fly.dev";
              proxyRes.headers["x-frame-options"] = "SAMEORIGIN";
              proxyRes.headers["access-control-allow-origin"] = "*";

              // Inject base tag for HTML content
              if (proxyRes.headers["content-type"] && proxyRes.headers["content-type"].includes("text/html")) {
                body = body.replace(
                  /<head[^>]*>/i,
                  `<head><base href="/app/crisp/">`
                );
              }

              res.writeHead(proxyRes.statusCode, proxyRes.headers);
              res.end(body);
            });
          },
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
