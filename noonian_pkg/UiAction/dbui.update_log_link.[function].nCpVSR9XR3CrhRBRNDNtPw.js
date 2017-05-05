function ($rootScope, $uibModal) {
    
    var to = this.targetObj;
    
    var modalInstance;
      var scope = $rootScope.$new(true);

      var className = scope.boClass = to.object_class;
      var perspectiveName = scope.perspectiveName = 'default';
      var boId = scope.boId = to.object_id;

      modalInstance = $uibModal.open({
        templateUrl:'dbui/core/view-dialog.html',
        controller:'dbui_ViewCtrl',
        size:'lg',
        scope: scope,
        resolve: {
          theObject: function() {
            return db[className].findOne({_id:boId}).$promise;
          },
          viewPerspective:  function(Dbui) {
            return Dbui.getPerspective(perspectiveName, className, 'view');
          }
        }
      });
}