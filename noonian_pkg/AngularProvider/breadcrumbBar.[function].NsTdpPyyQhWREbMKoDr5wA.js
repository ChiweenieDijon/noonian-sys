function ($rootScope) {
    return {
        templateUrl:'dbui/core/breadcrumbar.html',
        
        restrict: 'E',
        
        
        controller:function($scope, $state) {
            
            
            //track "crumbs" as 
            var crumbHistory = $scope.crumbHistory = [];
            var findCrumb = function(s, sp) {
                for(var i=0; i < crumbHistory.length; i++) {
                    var c = crumbHistory[i];
                    if(angular.equals(c.state, s) && angular.equals(c.stateParams, sp)) {
                        return i;
                    }
                }
                return -1;
            };
            
            $rootScope.$on('$stateChangeSuccess', function(e, toState, toParams, fromState, fromParams) {
                //console.log(crumbHistory);
                var existingPos = findCrumb(toState, toParams);
                if(existingPos > -1) {
                    $scope.currentCrumb = crumbHistory[existingPos];
                }
                else {
                    var prevCrumb = $scope.currentCrumb || {};
                    var newCrumb = $scope.currentCrumb = {
                        state:toState,
                        stateParams:toParams,
                        title:$rootScope.pageTitle,
                        pos:crumbHistory.length
                    };
                    
                    
                    if(prevCrumb.pos < crumbHistory.length-1) {
                        var savedPins = [];
                        for(var i=prevCrumb.pos+1; i < crumbHistory.length; i++ ) {
                            var curr = crumbHistory[i];
                            if(curr.pinned) {
                                savedPins.push(curr);
                            }
                        }
                        console.log('savedPins', savedPins);
                        
                        crumbHistory.splice(prevCrumb.pos+1, crumbHistory.length);
                        
                        newCrumb.pos = crumbHistory.length
                        
                        crumbHistory.push(newCrumb);
                        
                        var newPos = crumbHistory.length;
                        _.forEach(savedPins, function(c) {
                            c.pos = newPos++;
                            crumbHistory.push(c);
                        });
                        
                    }
                    else {
                        crumbHistory.push(newCrumb);
                    }
                    
                    
                    
                }
            }); 
            
            $rootScope.$watch('pageTitle', function(newTitle) {
                if($scope.currentCrumb) {
                    $scope.currentCrumb.title = newTitle;
                }
            });
            
            $scope.selected = function(c) {
                $state.go(c.state, c.stateParams);
            };
            
            $scope.togglepin = function(c) {
                c.pinned = !c.pinned;
            };
        }
    }
}