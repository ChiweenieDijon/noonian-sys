function (Dbui, $uibModal, $rootScope) {
  return {
    /**
     *  Use uibModal to show a datatable alowing the selection of one or multiple BO's
     **/
    showDialog: function(theObject, perspective, title) {
        
        
        var modalInstance;
        var scope = $rootScope.$new(true);
        
        scope.title = title || 'Edit '+theObject._bo_meta_data.class_name;
        scope.theObject = theObject;
        scope.perspective = perspective;

        modalInstance = $uibModal.open({
          templateUrl:'dbui/reusable/dialog/object_editor_modal.html',
          size:'lg',
          scope: scope
        });
        
        return modalInstance.result;
    }
  };
}