function () {
    return {
        templateUrl:'dbui/core/helper/date_string_editor.html',
        
        restrict: 'E',
        
        require:'ngModel',
        
        scope: {
            displayFormat: '@',
            elemId:'@'
        },
        
        
        link: function(scope, iElement, iAttributes, ngModel) {
    
            //Add listener to clear text box when it contains invalid date
            var textBox = iElement.find('input');
            textBox.on('blur', function() {
                if(textBox.val() && (!scope.binding || !scope.binding.value)) {
                    textBox.css('background-color','red');
                }
                else {
                    textBox.css('background-color','');
                }
            });
            
            //1. Wire up converter for ng-model object (string)--> internal $viewValue representation (date)
            ngModel.$formatters.push(function(modelValue) {
                if(modelValue) {
                    return {value:new Date(moment(modelValue).format())};
                }
                return {value:null};
            });
            
            //2. Wire up converter for internal $viewValue representation (date) --> ng-model object (string)
            ngModel.$parsers.push(function(viewValue) {
                if(viewValue && viewValue.value instanceof Date) {
                    return moment(viewValue.value).format('YYYY-MM-DD');
                }
                
                return null;
            });
            
            //3. Wire up trigger for scope object --> $viewValue
            scope.$watch('binding', function() {
                //must *replace* the viewValue object in order for change to propogate to ng-model!
                if(scope.binding && !angular.equals(ngModel.$viewValue, scope.binding)) {
                    ngModel.$setViewValue({value:scope.binding.value});
                    if(scope.binding.value) {
                        textBox.css('background-color','');
                    }
                }
                
            }, 
            true); 
            
            //4. Wire up callback for $viewValue update --> scope object
            ngModel.$render = function() {
                if(!scope.binding) {
                    scope.binding = {};
                }
                if(!angular.equals(ngModel.$viewValue, scope.binding)) {
                    scope.binding.value = ngModel.$viewValue.value;
                }
            };
            
            
        },
        
      
      controller: function($scope) {
          
        $scope.dateOptions = {
          formatYear: 'yyyy'
        };
        
        
        if(!$scope.displayFormat) {
            $scope.displayFormat = 'MMMM dd, yyyy'; 
        }
        
        $scope.altFormats = [
            'MMM d, yyyy',
            'MMM dd, yyyy',
            'M/d/yy',
            'MM/dd/yy',
            'M/d/yyyy',
            'MM/dd/yyyy',
            'M-d-yy',
            'MM-dd-yy',
            'M-d-yyyy',
            'MM-dd-yyyy',
        ];
        
        $scope.pickerOpen = false;
    
        $scope.togglePicker = function() {
            $scope.pickerOpen = !$scope.pickerOpen;
        };
          
          
      }
      
    };
  }