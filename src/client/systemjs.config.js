(function (global) {

    // map tells the System loader where to look for things
    var map = {
        'app': 'dist/client/app', // 'dist',
        '@angular': 'node_modules/@angular',
        'rxjs': 'dist/client/lib/rxjs',
        'ng2-select': 'node_modules/ng2-select'
    };

    // packages tells the System loader how to load when no filename and/or no extension
    var packages = {
        'app': { main: 'main.js', defaultExtension: 'js' },
        'rxjs': {  main: 'bundles/Rx.umd.min.js', defaultExtension: 'js' },
        'ng2-select': {  main: 'ng2-select.js', defaultExtension: 'js' },
    };

    var ngPackageNames = [
        'common',
        'compiler',
        'core',
        'forms',
        'http',
        'platform-browser',
        'platform-browser-dynamic',
        'router'
    ];
    // Individual files (~300 requests):
    function packIndex(pkgName) {
        packages['@angular/' + pkgName] = { main: 'index.js', defaultExtension: 'js' };
    }
    // Bundled (~40 requests):
    function packUmd(pkgName) {
        packages['@angular/' + pkgName] = { main: 'bundles/' + pkgName + '.umd.min.js', defaultExtension: 'js' };
    }

    // Most environments should use UMD; some (Karma) need the individual index files
    var setPackageConfig = System.packageWithIndex ? packIndex : packUmd;
    // Add package entries for angular packages
    ngPackageNames.forEach(setPackageConfig);
    
    var config = {
        map: map,
        packages: packages
    };
    System.config(config);

})(this);