const express = require('express');
const Datastore = require('nedb');
const path = require('path');

// Start listening to port 8000 for updates from tracker
const app = express();
app.listen(8000, () => console.log('listening to 8000...'));

// Set all the pie chart variables
let t1off = 0; // These are all ventilators of type 1 that have the off status
let t1on = 0;
let t2off = 0;
let t2on = 0;

// Create database to store tracker info
const db = new Datastore('vents.db');
db.loadDatabase();

// This decides what is public to the client side, in this case just index.html
app.use(express.static('public'));
app.get('/', (req, res) => {
    console.log('rendering');
    res.render('index', {t1off: t1off, t1on: t1on, t2off: t2off, t2on: t2on});
});
app.set('view engine', 'ejs');
app.use(express.json());

// When the tracker posts, insert it into the database
app.post('/', (req, res) => {    
    db.update({"_id": req.body._id}, { $set: {"location": req.body.location, "status": req.body.status}}, {}, (err, numReplaced) => {
        if (numReplaced === 0) {
            db.insert(req.body);
        }
    });
    
    // Verifying that there are no duplicates in the db (weird bug shows duplicates when updating)
    db.find({"_id": req.body._id}, (err, docs) => {
        console.log(docs.length);
    });
    
    res.end();
});





const interval = setInterval(function() {
    
    db.find({type: 1, status:0}, (err, docs) => {
        t1off = docs.length;
    });
    db.find({type: 1, status: 1}, (err, docs) => {
        t1on = docs.length;
    });
    db.find({type: 2, status: 0}, (err, docs) => {
        t2off = docs.length;
    });
    db.find({type: 2, status: 1}, (err, docs) => {
        t2on = docs.length;
    });
    
    console.log("t1off: " +t1off);
    console.log("t1on: " +t1on);
    console.log("t2off: " +t2off);
    console.log("t2on: " +t2on);  
    console.log("-----------------------------------------------") ;
 
    
}, 3000);
 