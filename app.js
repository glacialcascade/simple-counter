//set up the server
const express = require( "express" );
const app = express();
const port = 8080;
const logger = require("morgan");

// logging middleware
app.use(logger("dev"));

// define middleware that serves static resources in the public directory
app.use(express.static(__dirname + '/public'));

// routes
app.get( "/", ( req, res ) => {
    res.sendFile( __dirname + "/views/index.html" );
} );

app.get( "/item", ( req, res ) => {
    res.sendFile( __dirname + "/views/item.html" );
} );

app.get( "/list", ( req, res ) => {
    res.sendFile( __dirname + "/views/list.html" );
} );

app.get( "/tag", ( req, res ) => {
    res.sendFile( __dirname + "/views/tag.html" );
} );

app.get( "/hist", ( req, res ) => {
    res.sendFile( __dirname + "/views/hist.html" );
} );

// start the server
app.listen( port, () => {
    console.log(`App server listening on ${ port }. (Go to http://localhost:${ port })` );
} );