function ($scope, $stateParams, Dbui) {
    console.log('dbui.core.Array.composite.view', $scope);
    //Little editable datatable
    
    var fc = $scope.fieldCustomizations || {};
    var td = $scope.typeDesc[0];
    
    var stub = td.construct({});
    
    $scope.objMetaData = stub._bo_meta_data;
    
    
    //Action object to remove an item from the array:
    var removeAction = {
      icon:'fa-remove',
      fn:function(args) {
        if(args) {
          $scope.binding.value.splice(args.index, 1);
        }
        return true;
      }
    };
    
    //Config object for 
    $scope.tableConfig = fc.table_config || {
      cellEdit:false,    //allow 'global' edit (all fields editable) TODO configure from fieldCustomizations
      recordActions:[]
    };
    
    //Use 'list' perspective for editing an array of composites:
    if(fc.list_perspective) {
        var p = angular.copy(fc.list_perspective);
        $scope.subPerspective = p;
    }
    else {
        Dbui.getPerspective($stateParams.perspective, stub._bo_meta_data.class_name, 'list').then(function(subPerspective) {
            $scope.subPerspective = subPerspective;
        });
    }
    
    
    //Ensure empty array binding when binding.value is null:
    var unwatchFn = $scope.$watch('displayValue', function(newBinding) {
        if(!newBinding) {
            $scope.displayValue = [];
        }
        unwatchFn();
    });
    

}