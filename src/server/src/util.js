module.exports = {
    isUserAppAuthenticated: (user) => user && user.token && user.token.startsWith('ghu_')
}