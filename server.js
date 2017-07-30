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
    "confirmed" : "v",
    "absent" : "x",
};

let config;

function update(person, state, success, error){
    let file = "/Main/Activiteiten_Main_Sequence/"+config.event.split("-")[0]+"/"+config.event+"/aanwezigen.txt";
    console.log("Reading file.");
    wfs.readFile(file, "utf8", function(error, data) {
        console.log("Running Regex");
        pattern = "[-vx] "+person;
        var re = new RegExp(pattern, "g");

        let d = data.replace(re, states[state] + " " + person);
        
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

app.get('/:person', function (req, res) {
    reloadConfig(
        function(){
            let state = req.query.state;
            let token = req.query.token;
            let person = req.params.person;
            
            if(!states.hasOwnProperty(state) || (token !== config.token)){
                res.render('index', { message: "That's invalid" })
            }
            else{
                update(person, state, 
                    function(){
                        res.render('index', { message: "Status updated to " + state })
                    },
                    function(error){
                        res.render('index', { message: "Something went wrong. Tip: try again later.", err: error })
                    });
            }
        }
    );
})

app.listen(3000);

console.log("[ OK ] Laika is ready");
