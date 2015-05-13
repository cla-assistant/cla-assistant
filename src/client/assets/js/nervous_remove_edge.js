/*jslint */
/*global AdobeEdge: false, window: false, document: false, console:false, alert: false */
(function (compId) {

    "use strict";
    var im='assets/images/nervous_remove/',
        aud='media/',
        vid='media/',
        js='assets/js/',
        fonts = {
        },
        opts = {
            'gAudioPreloadPreference': 'auto',
            'gVideoPreloadPreference': 'auto'
        },
        resources = [
        ],
        scripts = [
        ],
        symbols = {
            "stage": {
                version: "5.0.1",
                minimumCompatibleVersion: "5.0.0",
                build: "5.0.1.386",
                scaleToFit: "none",
                centerStage: "none",
                resizeInstances: false,
                content: {
                    dom: [
                        {
                            id: 'nervous-36',
                            type: 'image',
                            rect: ['-81px', '-6px', '320px', '237px', 'auto', 'auto'],
                            fill: ["rgba(0,0,0,0)",im+"nervous-36.svg",'0px','0px']
                        },
                        {
                            id: 'nervous_eye2-392',
                            type: 'image',
                            rect: ['-81px', '-6px', '320px', '237px', 'auto', 'auto'],
                            fill: ["rgba(0,0,0,0)",im+"nervous_eye2-392.svg",'0px','0px']
                        },
                        {
                            id: 'nervous_eye1-372',
                            type: 'image',
                            rect: ['-80px', '-6px', '320px', '237px', 'auto', 'auto'],
                            fill: ["rgba(0,0,0,0)",im+"nervous_eye1-372.svg",'0px','0px']
                        },
                        {
                            id: 'nervous_drop3-393',
                            type: 'image',
                            rect: ['0px', '139px', '31px', '33px', 'auto', 'auto'],
                            opacity: '1',
                            fill: ["rgba(0,0,0,0)",im+"nervous_drop3-393.svg",'0px','0px']
                        },
                        {
                            id: 'nervous_drop3-394',
                            display: 'none',
                            type: 'image',
                            rect: ['-8px', '41px', '48px', '50px', 'auto', 'auto'],
                            opacity: '1',
                            fill: ["rgba(0,0,0,0)",im+"nervous_drop3-394.svg",'0px','0px']
                        }
                    ],
                    style: {
                        '${Stage}': {
                            isStage: true,
                            rect: ['null', 'null', '161px', '206px', 'auto', 'auto'],
                            overflow: 'hidden',
                            fill: ["rgba(255,255,255,0.00)"]
                        }
                    }
                },
                timeline: {
                    duration: 850,
                    autoPlay: true,
                    labels: {
                        "Label 2": 0,
                        "Label 1": 37,
                        "Label 3": 850
                    },
                    data: [
                        [
                            "eid355",
                            "top",
                            160,
                            0,
                            "linear",
                            "${nervous_eye2-392}",
                            '-6px',
                            '-6px'
                        ],
                        [
                            "eid324",
                            "width",
                            0,
                            0,
                            "linear",
                            "${nervous_eye1-372}",
                            '320px',
                            '320px'
                        ],
                        [
                            "eid329",
                            "left",
                            86,
                            74,
                            "linear",
                            "${nervous_eye1-372}",
                            '-79px',
                            '-84px'
                        ],
                        [
                            "eid344",
                            "left",
                            160,
                            217,
                            "linear",
                            "${nervous_eye1-372}",
                            '-84px',
                            '-80px'
                        ],
                        [
                            "eid332",
                            "left",
                            377,
                            123,
                            "linear",
                            "${nervous_eye1-372}",
                            '-80px',
                            '-79px'
                        ],
                        [
                            "eid333",
                            "left",
                            500,
                            0,
                            "linear",
                            "${nervous_eye1-372}",
                            '-79px',
                            '-79px'
                        ],
                        [
                            "eid309",
                            "display",
                            0,
                            0,
                            "linear",
                            "${nervous_drop3-394}",
                            'none',
                            'none'
                        ],
                        [
                            "eid302",
                            "display",
                            160,
                            0,
                            "linear",
                            "${nervous_drop3-394}",
                            'none',
                            'none'
                        ],
                        [
                            "eid325",
                            "display",
                            250,
                            0,
                            "linear",
                            "${nervous_drop3-394}",
                            'none',
                            'block'
                        ],
                        [
                            "eid290",
                            "opacity",
                            588,
                            99,
                            "linear",
                            "${nervous_drop3-393}",
                            '1',
                            '0'
                        ],
                        [
                            "eid285",
                            "top",
                            0,
                            250,
                            "linear",
                            "${nervous_drop3-393}",
                            '39px',
                            '80px'
                        ],
                        [
                            "eid286",
                            "top",
                            250,
                            250,
                            "linear",
                            "${nervous_drop3-393}",
                            '80px',
                            '113px'
                        ],
                        [
                            "eid287",
                            "top",
                            500,
                            147,
                            "linear",
                            "${nervous_drop3-393}",
                            '113px',
                            '139px'
                        ],
                        [
                            "eid288",
                            "top",
                            647,
                            40,
                            "linear",
                            "${nervous_drop3-393}",
                            '139px',
                            '137px'
                        ],
                        [
                            "eid356",
                            "left",
                            160,
                            217,
                            "linear",
                            "${nervous_eye2-392}",
                            '-81px',
                            '-78px'
                        ],
                        [
                            "eid321",
                            "width",
                            0,
                            160,
                            "linear",
                            "${nervous_drop3-394}",
                            '48px',
                            '42px'
                        ],
                        [
                            "eid311",
                            "left",
                            0,
                            250,
                            "linear",
                            "${nervous_drop3-394}",
                            '0px',
                            '-4px'
                        ],
                        [
                            "eid323",
                            "left",
                            377,
                            0,
                            "linear",
                            "${nervous_drop3-394}",
                            '-4px',
                            '-4px'
                        ],
                        [
                            "eid310",
                            "top",
                            0,
                            160,
                            "linear",
                            "${nervous_drop3-394}",
                            '27px',
                            '32px'
                        ],
                        [
                            "eid320",
                            "top",
                            160,
                            90,
                            "linear",
                            "${nervous_drop3-394}",
                            '32px',
                            '37px'
                        ],
                        [
                            "eid312",
                            "top",
                            250,
                            171,
                            "linear",
                            "${nervous_drop3-394}",
                            '37px',
                            '53px'
                        ],
                        [
                            "eid313",
                            "top",
                            421,
                            124,
                            "linear",
                            "${nervous_drop3-394}",
                            '53px',
                            '78px'
                        ],
                        [
                            "eid314",
                            "top",
                            545,
                            102,
                            "linear",
                            "${nervous_drop3-394}",
                            '78px',
                            '89px'
                        ],
                        [
                            "eid315",
                            "top",
                            647,
                            40,
                            "linear",
                            "${nervous_drop3-394}",
                            '89px',
                            '112px'
                        ],
                        [
                            "eid316",
                            "top",
                            687,
                            63,
                            "linear",
                            "${nervous_drop3-394}",
                            '112px',
                            '120px'
                        ]
                    ]
                }
            }
        };

    AdobeEdge.registerCompositionDefn(compId, symbols, fonts, scripts, resources, opts);

    if (!window.edge_authoring_mode) AdobeEdge.getComposition(compId).load("assets/js/nervous_remove_edgeActions.js");
})("EDGE-216448673");
