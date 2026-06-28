module.exports = {
  apps: [
    {
      name: "intel-refinery-bot",
      script: "src/index.js",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production"
      }
    }
  ]
};
