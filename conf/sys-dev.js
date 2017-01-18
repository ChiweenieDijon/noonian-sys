module.exports = {
  instanceId:'sys',
  instanceName:'sys-dev',

  serverListen: {
    port: 9000,
    host: '127.0.0.1'
  },

  mongo: {
    uri: 'mongodb://localhost/noonian-sys-dev'
  },

  enablePackaging:true,
  enableHistory:false, //awaiting fix to system to enable this
  
  packageFsConfig:{
    'sys':'../noonian-sys/noonian_pkg'
  },
  
  // Secret for session, TODO configure to use PKI
  secrets: {
    session: 'change me'
  },
  
  urlBase:'sys-dev',
  
  dev:true

};
