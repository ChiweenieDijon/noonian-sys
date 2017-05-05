function ($scope, $parse) {
    
    var td = $scope.typeDesc;
    var fc = $scope.fieldCustomizations;
    var context = $scope.contextObject;
    

    var modeMap = {
      'function':'javascript',
      'sourcecode':(td.language ? td.language : 'javascript')
    };

    var mode = modeMap[td.type];
    
    var theme = 'dawn';
    if(fc && fc.displayTheme) {
        
        if(typeof fc.displayTheme === 'string'){
            theme = fc.displayTheme;
        }
        else {
            var appliesKey = td.applicable || 'default';
            if(fc.displayTheme[appliesKey]) {
                theme = fc.displayTheme[appliesKey];
            }
        }
        
    }
    
    if(fc && fc.aceConfig) {
        if(fc.aceConfig.mode) {
            var getMode = $parse(fc.aceConfig.mode);
            mode = getMode(context) || mode;
            
            $scope.$watch(
                function(currentscope) {
                    return getMode(context) || mode;
                }, 
                
                function(newVal, oldVal) {
                    if(newVal) {
                        $scope.aceInit.mode = newVal;
                    }
                }
            );
        }
    }
    

    $scope.aceInit = {
      theme:theme,
      mode: mode,
      useWrapMode : true,
      showGutter: true,
      require: ['ace/ext/language_tools'],
      advanced: {
          enableSnippets: false,
          enableBasicAutocompletion: true,
          enableLiveAutocompletion: true
      }
    };
    
    $scope.aceInit.onLoad = function(editor) {
        $scope.aceEditor = editor;
        editor.$blockScrolling = Infinity;
        // var session = editor.getSession(); //http://ajaxorg.github.io/ace/#nav=api&api=edit_session
    };
    
    

}