/*
 * Production assets generation
 */
const common = require('./webpack.config.common.js');
const conf = common.configuration;

const webpack = require('webpack');
const { merge } = require('webpack-merge');

const fs = require('fs');
const path = require('path');

const FaviconsWebpackPlugin = require('favicons-webpack-plugin');

const TerserPlugin = require('terser-webpack-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

//const ImageSpritePlugin = require('@a2nt/image-sprite-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const UIInfo = require('./package.json');
const UIVERSION = JSON.stringify(UIInfo.version);

const NODE_ENV = conf.NODE_ENV || process.env.NODE_ENV;
const COMPRESS = NODE_ENV === 'production' ? true : false;

const IP = process.env.IP || conf.HOSTNAME;
const PORT = process.env.PORT || conf.PORT;

console.log('NODE_ENV: ' + NODE_ENV);
console.log('COMPRESS: ' + COMPRESS);
console.log('WebP images: ' + conf['webp']);
console.log('GRAPHQL_API_KEY: ' + conf['GRAPHQL_API_KEY']);

let plugins = [
    new webpack.ProvidePlugin({
        react: 'React',
        'react-dom': 'ReactDOM',
        /*$: 'jquery',
        jQuery: 'jquery',
        Popper: ['popper.js', 'default'],
        Util: 'exports-loader?Util!bootstrap/js/dist/util',
        Alert: 'exports-loader?Alert!bootstrap/js/dist/alert',
        Button: 'exports-loader?Button!bootstrap/js/dist/button',
        Carousel: 'exports-loader?Carousel!bootstrap/js/dist/carousel',
        Collapse: 'exports-loader?Collapse!bootstrap/js/dist/collapse',
        Dropdown: 'exports-loader?Dropdown!bootstrap/js/dist/dropdown',
        Modal: 'exports-loader?Modal!bootstrap/js/dist/modal',
        Tooltip: 'exports-loader?Tooltip!bootstrap/js/dist/tooltip',
        Popover: 'exports-loader?Popover!bootstrap/js/dist/popover',
        Scrollspy: 'exports-loader?Scrollspy!bootstrap/js/dist/scrollspy',
        Tab: 'exports-loader?Tab!bootstrap/js/dist/tab',*/
      }),
    new webpack.DefinePlugin({
        'process.env': {
            NODE_ENV: JSON.stringify(NODE_ENV),
          },
        UINAME: JSON.stringify(UIInfo.name),
        UIVERSION: UIVERSION,
        UIAUTHOR: JSON.stringify(UIInfo.author),
        GRAPHQL_API_KEY: JSON.stringify(conf['GRAPHQL_API_KEY']),
        SWVERSION: JSON.stringify(`sw-${new Date().getTime()}`),
        BASE_HREF: JSON.stringify(''),
      }),
    new webpack.LoaderOptionsPlugin({
        minimize: COMPRESS,
        debug: !COMPRESS,
      }),
    new MiniCssExtractPlugin({
        filename: 'css/[name].css',
        //allChunks: true,
      }),
];

if (COMPRESS) {
  plugins.push(require('autoprefixer'));

  /*plugins.push(
      new ImageSpritePlugin({
          exclude: /exclude|original|default-|icons|sprite|svg|logo|favicon/,
          commentOrigin: false,
          compress: COMPRESS,
          extensions: ['png'],
          indent: '',
          log: true,
          //outputPath: path.join(__dirname, conf.APPDIR, conf.DIST),
          outputFilename: 'img/sprite-[hash].png',
          padding: 0,
      }),
  );*/
}

const indexPath = path.join(__dirname, conf.APPDIR, conf.SRC, 'index.html');
if (fs.existsSync(indexPath)) {
  plugins.push(
      new HtmlWebpackPlugin({
          publicPath: '',
          template: path.join(conf.APPDIR, conf.SRC, 'index.html'),
          templateParameters: {
              NODE_ENV: NODE_ENV,
              GRAPHQL_URL: conf['GRAPHQL_URL'],
              STATIC_URL: conf['STATIC_URL'],
              REACT_SCRIPTS: NODE_ENV === 'production' ?
                  '<script crossorigin src="https://unpkg.com/react@17/umd/react.production.min.js"></script><script crossorigin src="https://unpkg.com/react-dom@17/umd/react-dom.production.min.js"></script>' : '<script crossorigin src="https://unpkg.com/react@17/umd/react.development.js"></script><script crossorigin src="https://unpkg.com/react-dom@17/umd/react-dom.development.js"></script>',
            },
          xhtml: true,
        }),
  );
}

const faviconPath = path.join(__dirname, conf.APPDIR, conf.SRC, 'favicon.png');
if (fs.existsSync(faviconPath)) {
  plugins.push(
      new FaviconsWebpackPlugin({
          title: 'Webpack App',
          logo: faviconPath,
          prefix: '/icons/',
          emitStats: false,
          persistentCache: true,
          inject: false,
          statsFilename: path.join(
              conf.APPDIR,
              conf.DIST,
              'icons',
              'iconstats.json',
          ),
          icons: {
              android: true,
              appleIcon: true,
              appleStartup: true,
              coast: true,
              favicons: true,
              firefox: true,
              opengraph: true,
              twitter: true,
              yandex: true,
              windows: true,
            },
        }),
  );
}

// add themes favicons
common.themes.forEach((theme) => {
    const faviconPath = path.join(__dirname, theme, conf.SRC, 'favicon.png');
    if (fs.existsSync(faviconPath)) {
      plugins.push(
          new FaviconsWebpackPlugin({
              title: 'Webpack App',
              logo: faviconPath,
              prefix: '/' + theme + '-icons/',
              emitStats: false,
              persistentCache: true,
              inject: false,
              statsFilename: path.join(
                  conf.APPDIR,
                  conf.DIST,
                  theme + '-icons',
                  'iconstats.json',
              ),
              icons: {
                  android: true,
                  appleIcon: true,
                  appleStartup: true,
                  coast: true,
                  favicons: true,
                  firefox: true,
                  opengraph: true,
                  twitter: true,
                  yandex: true,
                  windows: true,
                },
            }),
      );
    }
  });

const BundleAnalyzerPlugin = require('webpack-bundle-analyzer')
    .BundleAnalyzerPlugin;
plugins.push(
    new BundleAnalyzerPlugin({
        analyzerMode: 'static',
        openAnalyzer: false,
      }),
);

const cfg = merge(common.webpack, {
    mode: NODE_ENV,
    cache: {
        type: 'filesystem',
      },
    recordsPath: path.join(__dirname, conf.APPDIR, conf.DIST, 'records.json'),
    optimization: {
        //removeAvailableModules: false,
        //realContentHash: false,
        splitChunks: {
            name: 'vendor',
            minChunks: 2,
          },
        concatenateModules: true, //ModuleConcatenationPlugin
        minimizer: [
            new TerserPlugin({
                terserOptions: {
                    module: false,
                    parse: {
                        // we want terser to parse ecma 8 code. However, we don't want it
                        // to apply any minfication steps that turns valid ecma 5 code
                        // into invalid ecma 5 code. This is why the 'compress' and 'output'
                        // sections only apply transformations that are ecma 5 safe
                        // https://github.com/facebook/create-react-app/pull/4234
                        ecma: 8,
                      },
                    compress: {
                        ecma: 5,
                        warnings: false,
                        // Disabled because of an issue with Uglify breaking seemingly valid code:
                        // https://github.com/facebook/create-react-app/issues/2376
                        // Pending further investigation:
                        // https://github.com/mishoo/UglifyJS2/issues/2011
                        comparisons: false,
                      },
                    keep_fnames: true,
                    keep_classnames: true,

                    mangle: {
                        safari10: true,
                        keep_fnames: true,
                        keep_classnames: true,
                        reserved: ['$', 'jQuery', 'jquery'],
                      },
                    output: {
                        ecma: 5,
                        comments: false,
                        // Turned on because emoji and regex is not minified properly using default
                        // https://github.com/facebook/create-react-app/issues/2488
                        ascii_only: true,
                      },
                  },
                // Use multi-process parallel running to improve the build speed
                // Default number of concurrent runs: os.cpus().length - 1
                parallel: true,
              }),
            new CssMinimizerPlugin({
                parallel: true,
                minimizerOptions: [{
                    preset: [
                        'default',
                        {
                            discardComments: { removeAll: true },
                            zindex: true,
                            cssDeclarationSorter: true,
                            reduceIdents: false,
                            mergeIdents: true,
                            mergeRules: true,
                            mergeLonghand: true,
                            discardUnused: true,
                            discardOverridden: true,
                            discardDuplicates: true,
                          },
                    ],
                  },],
                minify: [
                    CssMinimizerPlugin.cssnanoMinify,
                    //CssMinimizerPlugin.cleanCssMinify,
                ],
              }),
        ],
      },

    output: {
        publicPath: path.join(conf.APPDIR, conf.DIST),
        path: path.join(__dirname, conf.APPDIR, conf.DIST),
        filename: path.join('js', '[name].js'),
      },

    module: {
        rules: [{
                test: /\.jsx?$/,
                //exclude: /node_modules/,
                use: {
                    loader: 'babel-loader', //'@sucrase/webpack-loader',
                    options: {
                        //transforms: ['jsx']
                        presets: [
                            '@babel/preset-env',
                            '@babel/react',
                            {
                                plugins: [
                                    '@babel/plugin-proposal-class-properties',
                                ],
                              },
                        ], //Preset used for env setup
                        plugins: [
                            ['@babel/transform-react-jsx'],
                        ],
                        cacheDirectory: true,
                        cacheCompression: true,
                      },
                  },
              },
            {
                test: /\.s?css$/,
                use: [{
                        loader: MiniCssExtractPlugin.loader,
                      },
                    {
                        loader: 'css-loader',
                        options: {
                            sourceMap: true,
                          },
                      },
                    {
                        loader: 'resolve-url-loader',
                      },
                    {
                        loader: 'sass-loader',
                        options: {
                            sourceMap: true,
                          },
                      },
                ],
              },
            {
                test: /fontawesome([^.]+).(ttf|otf|eot|svg|woff(2)?)(\?[a-z0-9]+)?$/,
                use: [{
                    loader: 'file-loader',
                    options: {
                        name: '[name].[ext]',
                        outputPath: 'fonts/',
                        publicPath: '../fonts/',
                      },
                  },],
              },
            {
                test: /\.(ttf|otf|eot|woff(2)?)$/,
                use: [{
                    loader: 'file-loader',
                    options: {
                        name: '[name].[ext]',
                        outputPath: 'fonts/',
                        publicPath: '../fonts/',
                      },
                  },],
              },
            {
                test: /\.(png|webp|jpg|jpeg|gif|svg)$/,
                use: [{
                    loader: 'img-optimize-loader',
                    options: {
                        name: '[name].[ext]',
                        outputPath: 'img/',
                        publicPath: '../img/',
                        compress: {
                            // This will take more time and get smaller images.
                            mode: 'low', // 'lossless', 'high', 'low'
                            disableOnDevelopment: true,
                            webp: conf['webp'],
                            // loseless compression for png
                            optipng: {
                                optimizationLevel: 4,
                              },
                            // lossy compression for png. This will generate smaller file than optipng.
                            pngquant: {
                                quality: [0.2, 0.8],
                              },
                            // Compression for svg.
                            svgo: true,
                            // Compression for gif.
                            gifsicle: {
                                optimizationLevel: 3,
                              },
                            // Compression for jpg.
                            mozjpeg: {
                                progressive: true,
                                quality: 60,
                              },
                          },
                        inline: {
                            limit: 1,
                          },
                      },
                  },],
              },
        ],
      },

    plugins: plugins,
  });

console.log(cfg);
module.exports = cfg;
