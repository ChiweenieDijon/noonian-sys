function ($rootScope, $timeout) {
    
    var THIS = this;
    
    var closeDbuiAlert = function(alertObj) {
        var arr = $rootScope.alertMenu.alerts;
        
        for(var i=0; i < arr.length; i++) {
            if(arr[i] === alertObj) {
                arr.splice(i, 1);
                break;
            }
        }
        
        if(arr.length === 0) {
            $rootScope.alertMenu.isOpen = false;
        }
        $rootScope.alertMenu.newAlerts.splice(0, $rootScope.alertMenu.newAlerts.length);
    };
    
    var dismissDbuiAlerts = function() {
        var arr = $rootScope.alertMenu.alerts;
        arr.splice(0, arr.length);
        $rootScope.alertMenu.isOpen = false;
    };
    
    var lastTimeout;
    
    this.alert = function(type, message, timeout) {
        console.log('DbuiAlert.alert', type, message, timeout);
        if(!$rootScope.closeDbuiAlert) {
            $rootScope.closeDbuiAlert = closeDbuiAlert;
            $rootScope.dismissDbuiAlerts = dismissDbuiAlerts;
        }
        
        if(!timeout) {
            timeout = 5000;
        }
        
        var alertObj = {
            msg:message,
            type:type,
            dismiss_timeout:timeout
        };
        
        // $rootScope.dbui_alerts.push(alertObj);
        $rootScope.alertMenu.alerts.unshift(alertObj);
        $rootScope.alertMenu.newAlerts.unshift(alertObj);
        $rootScope.alertMenu.showQueue = true;
        
        
        if(lastTimeout) {
            $timeout.cancel(lastTimeout);
        }
        
        lastTimeout = $timeout(function() {
            $rootScope.alertMenu.showQueue = false;
            $rootScope.alertMenu.newAlerts.splice(0, $rootScope.alertMenu.newAlerts.length);
            lastTimeout = false;
        }, timeout);
        
        
    };
    
    this.info = function(msg, timeout) {
        THIS.alert('info', msg, timeout);
    };
    
    this.success = function(msg, timeout) {
        THIS.alert('success', msg, timeout);
    };
    
    this.warning = function(msg, timeout) {
        THIS.alert('warning', msg, timeout);
    };
    
    this.danger = function(msg, timeout) {
        THIS.alert('danger', msg, timeout);
    };
    
    
}