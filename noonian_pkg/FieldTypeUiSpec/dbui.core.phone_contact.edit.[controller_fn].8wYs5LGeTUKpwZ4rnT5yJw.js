function ($scope, BusinessObjectModelFactory) {

    //Little editable datatable
    
    var fc = $scope.fieldCustomizations || {};
    var td = $scope.typeDesc;
    
    var tableItemTd = {
        number:{type:'phone'},
        type:{type:'enum', 'enum':'PhoneContactType'}
    };
    
    
    var itemModel = BusinessObjectModelFactory.getConstructor(
          tableItemTd, 
          'phonecontact', 
          {number:'Number',type:'Type'}
    );
    
    
    $scope.objMetaData = itemModel._bo_meta_data;
    $scope.subPerspective = {fields:['number','type']};
    
    
    //Action object to remove an item from the array:
    var removeAction = {
      icon:'fa-remove',
      fn:function(args) {
        if(args) {
            $scope.binding.value.splice(args.index, 1);
            $scope.binding.value = _.clone($scope.binding.value);
        }
        return true;
      }
    };
    
    //Config object for 
    $scope.tableConfig = fc.table_config || {
      cellEdit:true,    //allow 'global' edit (all fields editable) TODO configure from fieldCustomizations
      alwaysEdit:true, //dont switch between editor and viewer
      recordActions:[     //actions to be appended to any perspective actions.
          removeAction
      ]
    };
    
    
    
    //Ensure empty array binding when binding.value is null:
    var unwatchFn = $scope.$watch('binding.value', function(newBinding) {
        if(!newBinding) {
            $scope.binding.value = [];
        }
        unwatchFn();
    });
    
    
    
    $scope.addItem = function() {
      $scope.binding.value.push(new itemModel({}));
    }

}