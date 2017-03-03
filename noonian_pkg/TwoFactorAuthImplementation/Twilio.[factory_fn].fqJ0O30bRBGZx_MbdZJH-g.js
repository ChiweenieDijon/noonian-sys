function (nodeRequire, Q, config) {
    var getTwilioClient = nodeRequire('twilio');
    
    var formatPhone = function(phoneStr) {
        //Assume we're only dealing w/ US numbers
        //Format needs to be +1AAA#######
        
        //first clear out non-digits
        phoneStr = phoneStr && phoneStr.replace(/\D/g, '');
        
        //need at least areacode plus 7 digits
        if(!phoneStr || phoneStr.length <10) {
            return false;
        }
        if(phoneStr.length < 11) {
            phoneStr = '1'+phoneStr;
        }
        
        return '+'+phoneStr;
        
    };
    
    return {
        sendCode:function(dest, code) {
            console.log('TWILIO SEND CODE');
            var deferred = Q.defer();
            config.getParameter('twilio.auth', false).then(function(authParams) {
                console.log('TWILIO SEND CODE! %s %s %j', dest, code, authParams);
                if(!authParams || !authParams.sid || !authParams.token || !authParams.phone) {
                    console.error('Bad config twilio.auth');
                    deferred.reject('Bad config twilio.auth');
                }
                
                var to = formatPhone(dest);
                
                if(!to) {
                    return deferred.reject('Bad phone number '+dest);
                }
                
                var twilioClient = getTwilioClient(authParams.sid, authParams.token);
                
                
                
                twilioClient.sendMessage(
                    {
                        to: to, 
                        from: authParams.phone,
                        body: 'Verification Code: '+code
                    }, 
                    function(err, responseData) {
                        if(!err) {
                            deferred.resolve(responseData);
                        }
                        else {
                            deferred.reject(err);
                        }
                    }
                );
            });
            
            return deferred.promise;
        }
    };
}