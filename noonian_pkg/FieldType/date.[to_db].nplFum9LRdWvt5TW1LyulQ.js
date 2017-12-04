function (value) {
    var properFormat = /^\d{4}-\d{2}-\d{2}$/;
    
    if(properFormat.test(value)) {
        return value;
    }
    else if(value) {
        var d = new Date(value);
        
        if(d.toString() === 'Invalid Date') {
            return null;
        }
        
        var yyyy = d.getFullYear();
        var mm = d.getMonth()+1;
        var dd = d.getDate();
        
        mm = mm < 10 ? '0'+mm : ''+mm;
        dd = dd < 10 ? '0'+dd : ''+dd;
        
        return yyyy+'-'+mm+'-'+dd;
    }
    
    return null;
}