var convict = require('convict');
const config = convict({
  jira: {
    host:{
      doc: 'jira instance on the cloud',
      default: 'http://example.com/',
      format: String,
      env: 'JIRA_API_BASE_URL'
    },
    jira_base_key:{
      doc: 'the version number of jira agile api',
      default:'1.0',
      format: String,
      env: 'JIRA_API_BASE_AUTH'
    },
    username:{
      doc: 'the version number of jira agile api',
      default:'1.0',
      format: String,
      env: 'USERNAME'
    },
    password:{
      doc: 'the version number of jira agile api',
      default:'1.0',
      format: String,
      env: 'PASSWORD'
    }
  }
});
module.exports = config;
