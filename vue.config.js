// vue.config.js
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
  
    // Customize Webpack configuration if necessary
    configureWebpack: {
      // Example: Add a plugin or modify existing configurations
      plugins: [
        new MyCustomPlugin(),
      ],
    },
  
    // Customize CSS options
    css: {
      sourceMap: true,  // Enable CSS source maps in development
    },
  };