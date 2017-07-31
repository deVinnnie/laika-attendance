var express = require('express')
var app = express()
app.set('view engine', 'pug')

// Using authentication:
var wfs = require("webdav-fs")(
    process.env.WEBDAV_URL,
    process.env.WEBDAV_USER,
    process.env.WEBDAV_PASSWORD
);

let states = {
    "confirmed" : {
        symbol: "v",
        name: "aanwezig"
    },
    "absent" : {
        symbol: "x",
        name: "niet aanwezig"
    }
};

let config;

function update(person, state, success, error){
    let file = "/Main/Activiteiten_Main_Sequence/"+config.event.split("-")[0]+"/"+config.event+"/aanwezigen.txt";
    console.log("Reading file.");
    wfs.readFile(file, "utf8", function(error, data) {
        console.log("Running Regex");
        pattern = "[-vx] "+person;
        var re = new RegExp(pattern, "g");

        let d = data.replace(re, state.symbol + " " + person);
        
        console.log("Writing to file.");
        wfs.writeFile(file, d, function(err) {
            if(err !== null){
                error(err.message);
            }
            else{
                success();
            }
        });
    });
}

function reloadConfig(callback){
    console.log("Reading config file");
    wfs.readFile("/Main/bin/config.json", "utf8", function(error, data) {
        config = JSON.parse(data);
        callback();
    });
}

app.use('/assets', express.static(__dirname + '/assets'));
app.use('/assets/purecss/', express.static(__dirname + '/node_modules/purecss/build/'));
app.use('/assets/font-awesome/', express.static(__dirname + '/node_modules/font-awesome/'));

app.get('/', function (req, res) {
    res.render('index', { message: "The ships hung in the air like bricks don't." })
})

app.get('/:person', function (req, res) {
    reloadConfig(
        function(){
            let token = req.query.token;
            let person = req.params.person;
            
            if(!states.hasOwnProperty(req.query.state) || (token !== config.token)){
                res.render('index', { message: "That's invalid" })
            }
            else{
                let state = states[req.query.state];
                update(person, state, 
                    function(){
                        res.render('index', { message: `Status verandert naar ${state.name}.`})
                    },
                    function(error){
                        res.render('index', { message: "Er ging iets mis. Tip: probeer het later nog eens.", error: error })
                    });
            }
        }
    );
})

app.listen(3000);

console.log("[ OK ] Laika is ready");
