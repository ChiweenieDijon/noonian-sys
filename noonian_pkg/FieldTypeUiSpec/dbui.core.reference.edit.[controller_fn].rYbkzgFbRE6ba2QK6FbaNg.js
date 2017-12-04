function ($scope, $stateParams, db, Dbui, DbuiObjectPicker, DbuiAction, NoonWebService) {
    var td = $scope.typeDesc;
    var refClass = td.ref_class;
    var fc = $scope.fieldCustomizations;
    
    $scope.getRefs = function(val) {
        
      //Text search for val; limit to a handful, sort so that those with _disp values containing val are at the top.
    //   return db[refClass].find({$fulltextsearch:val}, {}, {limit:10}).$promise;
        var query = {class_name:refClass, search_term:val};
        if(fc && fc.filter) {
            query.filter = fc.filter;
        }
        return NoonWebService.call('dbui/getReferenceTypeahead', query);
    };

    $scope.onSelect = function($item) {
        $scope.binding.value = {_id:$item._id, _disp:$item._disp};
    };

    $scope.lostFocus = function() {
        var boundVal = $scope.binding.value;
        if( !boundVal || $scope.refDisplayText !== boundVal._disp) {
          $scope.binding.value = null;
          $scope.refDisplayText = '';
        }
    }

    $scope.showPicker = function() {
        DbuiObjectPicker.showPickerDialog(refClass, $stateParams.perspective, true, $scope.onSelect);
    }

    $scope.$watch('binding.value', function(newValue) {
        if(newValue)
          $scope.refDisplayText = newValue._disp;
        else
          $scope.refDisplayText = '';
    });

    $scope.invokeAction = function(a) {
        DbuiAction.invokeAction($stateParams.perspective, ($scope.binding && $scope.binding.value), a);
    };
    
    $scope.viewRefObj = function() {
      var displayValue = $scope.binding.value;
      if(displayValue) {
          var action = DbuiAction.unalias('dialog-view');
          var args = {
              className:  td.ref_class || displayValue.ref_class,
              targetObj: displayValue
          };
          DbuiAction.invokeAction(null, null, action, args);
      }
    };
}