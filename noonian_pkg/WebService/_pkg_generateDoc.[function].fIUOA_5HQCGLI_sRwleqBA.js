function (queryParams, NoonianDocBuilder) {
    var bopId = queryParams.id;
    if(!bopId) {
        throw 'invalid package id';
    }
    
    console.log('build package docs for %s ...', bopId);
    
    return NoonianDocBuilder.buildDocForPackage(bopId).then(function(result) {
        return {message:'created package documentation '+result.output_desc};
    });
}