module.exports = {
  promisify: (fn) => (...args) => new Promise((resolve, reject) => fn(...args, (...a) => {
    const err = a.shift();
    if (err) {
      return reject(err);
    }
    resolve(a);
  })),
  promiseDelay (time) {
    return new Promise(function(resolve){
      setTimeout(() => { resolve(time); }, time);
    });
  }
};