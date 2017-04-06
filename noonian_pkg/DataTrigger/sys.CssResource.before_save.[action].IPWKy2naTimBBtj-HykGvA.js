function (nodeRequire, Q) {
    if(
        (this.preprocessor === 'sass' || this.preprocessor === 'scss') &&
        this.content
    ) {
        var deferred = Q.defer();
        var sass = nodeRequire('node-sass');
        
        var THIS = this;
        
        sass.render( {
                data:this.content
            },
            function(err, result) {
                if(err) {
                    console.error(err.message);
                    return deferred.reject(err);
                }
                THIS.compiled_content = result.css.toString();
                deferred.resolve(THIS);
            }
        )
        
        return deferred.promise;
    }
    
}