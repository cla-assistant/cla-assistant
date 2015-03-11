
module.exports = function(req, res, next) {

    if (req.isAuthenticated()) {
        return next();
    }

    res.status(401).send('Authentication required');
};
