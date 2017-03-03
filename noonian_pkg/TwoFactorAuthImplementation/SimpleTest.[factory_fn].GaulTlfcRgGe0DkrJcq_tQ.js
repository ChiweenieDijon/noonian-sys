function () {
    return {
        sendCode:function(dest, code) {
            console.log('Sending to %s: [%s]', dest, code);
            return {result:dest+' '+code};
        }
    };
}