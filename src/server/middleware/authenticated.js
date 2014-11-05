
module.exports = function(req, res, next) {

    if (req.isAuthenticated()) {
        return next();
    }

    res.send(401, 'Authentication required');
};
