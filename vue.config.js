const VuePlugin = require('vue-plugin');  // Adjust to the actual name of the plugin

module.exports = {
  // Set the base URL for your app
  publicPath: '/',
  
  // Output directory for build files
  outputDir: 'dist',  // Default: 'dist'

  // Disable source maps in production for security reasons
  productionSourceMap: false,

  // Configure the development server (useful for API proxying)
  devServer: {
    open: true,  // Automatically open the browser when the server starts
    port: 8080,  // Change the default port if needed
    proxy: {
      '/api': {
        target: 'http://localhost:3000',  // Proxy API calls to a backend
        changeOrigin: true,
      },
    },
  },

  // Configure webpack plugins
  configureWebpack: {
    plugins: [
      new VuePlugin(),  // Initialize the plugin (adjust based on the plugin's documentation)
    ],
  },

  // Customize CSS options
  css: {
    sourceMap: true,  // Enable CSS source maps in development
  },
};
