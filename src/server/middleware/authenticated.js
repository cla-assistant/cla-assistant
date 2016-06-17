
module.exports = function(req, res, next) {
    var freeApi = ['/api/cla/get', '/api/cla/getLinkedItem'];

    if (req.isAuthenticated() || freeApi.indexOf(req.originalUrl) > -1) {
        return next();
    }

    res.status(401).send('Authentication required');
};
