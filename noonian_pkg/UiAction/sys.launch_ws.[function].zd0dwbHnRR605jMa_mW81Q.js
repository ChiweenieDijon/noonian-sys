function ($window) {
    let to = this.targetObj;
    if(to && to.path) {
        $window.open('ws'+to.path);
    }
}