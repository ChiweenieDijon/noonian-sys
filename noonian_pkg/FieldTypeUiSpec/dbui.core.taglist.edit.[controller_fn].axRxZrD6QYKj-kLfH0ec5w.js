function ($scope, NoonWebService) {
    var td = $scope.typeDesc;
    var fc = $scope.fieldCustomizations || {};
    var contextObject = $scope.contextObject;
    // console.log($scope);
    
    $scope.placeholderText = fc.placeholder || 'Add a tag';
    
    $scope.getAutocomplete = function(val) {
        
        var query = {
            class_name:contextObject._bo_meta_data.class_name,
            type_desc:td, 
            search_term:val, 
            field_customizations:fc,
            exclude:$scope.binding.value,
            field_name:$scope.elemId
        };
        
        return NoonWebService.call('dbui/getTaglistTypeahead', query);
    };

}