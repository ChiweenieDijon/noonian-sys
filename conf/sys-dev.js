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
  
  /*
  two_factor_auth:{
      "implementation": "name of TwoFactorAuthImplementation used to send the code",
      "condition": "role(s) or query condition describing when login requires 2FA",
      "refresh_period": "number of hours a 2nd-factor auth is valid",
      "userToPhone[option2]": "a field on User",
      "userToPhone[option1]": {
        "refField": "reference field to User",
        "refClass": "Class name containing user reference",
        "phoneField": "field containing phone number"
      }
    },
  */  

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
