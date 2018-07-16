function (db, res) {
    res.type('application/javascript');
    
    
    
    //TODO {rolespec:{$satsifiedBy:user.roles}}
    return db.DbuiCustomPage.find({state_name:{$ne:null}}, {key:1,state_name:1,params:1}).lean().exec().then(function(pages) {
        
        return `angular.module('noonian.dbui').value('dbuiCustomStates', ${JSON.stringify(pages)});`;
    });
}