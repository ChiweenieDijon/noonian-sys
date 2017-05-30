function (NoonConfig, $rootScope) {
    
    var PREFS_KEY='sys.user.preferences';
    var prefs = {};
    
    /**
     * Dbui.init
     */
    this.init = function() {
        console.log('initializing DbuiUserPrefs');
        
        return NoonConfig.getParameter(PREFS_KEY).then(function(result) {
            $rootScope.userPrefs = prefs = result || {};
        }, 
        function(err) {
            console.log(err);
            $rootScope.userPrefs = prefs = {};
        });
    };
    
    /**
     * DbuiUserPrefs.get
     */
    this.getParameter = function(key) {
        return prefs[key];
    };
    
    this.setParameter = function(key, val) {
        prefs[key] = val;
        return NoonConfig.customizeParameter(PREFS_KEY, prefs);
    }
    
    
}