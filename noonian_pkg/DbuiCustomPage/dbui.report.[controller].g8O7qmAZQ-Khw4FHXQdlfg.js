function (db, Dbui, NoonI18n, NoonWebService, BusinessObjectModelFactory, $stateParams) {
    
    var inputModel;
    var outputModel;
    
    
    
    NoonWebService.call('dbui/getReportSpec', {id:$stateParams.id}).then(function(result) {
        
        var reportSpec = $scope.reportSpec = result.reportSpec;
        var labels = $scope.reportLabels = result.labels;
        
        // db.makeCompositeBo(reportSpec.name+'#input', reportSpec.input_typedef, {});
        inputModel = BusinessObjectModelFactory.getConstructor(
              reportSpec.input_typedef, 
              reportSpec.name+'#input', 
              labels._input_fields
        );
        $scope.inputObj = new inputModel({});
        console.log($scope.inputObj)
        
        $scope.inputPerspective = reportSpec.input_perspective;
        $scope.inputPerspective.layout = Dbui.normalizeLayout($scope.inputPerspective.layout);
        
        
        outputModel = BusinessObjectModelFactory.getConstructor(
              reportSpec.output_typedef, 
              reportSpec.name+'#output', 
              labels._output_fields
        );
        
        $scope.outputPerspective = reportSpec.output_perspective;
        $scope.outputPerspective.layout = Dbui.normalizeLayout($scope.outputPerspective.layout);
        
    });
    
    
    $scope.submit = function() {
        NoonWebService.call($scope.reportSpec.web_service.path, {input:$scope.inputObj}).then(function(resp) {
            $scope.resultObj = new outputModel(resp); 
            console.log($scope.resultObj);
        });
    };
    
}