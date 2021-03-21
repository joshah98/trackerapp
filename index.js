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

    // set the dimensions and margins of the graph
    var width = 400
    height = 250
    margin = 100

    // The radius of the pieplot is half the width or half the height (smallest one). I subtract a bit of margin.
    var radius = 100;

    // append the svg object to the div called 'pie'
    var svg = d3.select("#pie")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .append("g")
    .attr("transform", "translate(" + 55 * width / 100 + "," + height / 2 + ")");

    // Create dummy data
    var data = {'G5 (ON)': t1on, 'G5 (OFF)': t1off, 'SERVO-I (ON)':t2on, 'SERVO-I (OFF)':t2off};

    // set the color scale
    const color = d3.scaleOrdinal(['mediumblue', 'skyblue', 'crimson', 'lightcoral']);

    // Compute the position of each group on the pie:
    var pie = d3.pie()
    .sort(null) // Do not sort group by size
    .value(function(d) {return d.value; })
    var data_ready = pie(d3.entries(data))

    // The arc generator
    var arc = d3.arc()
    .innerRadius(0)         // This is the size of the donut hole
    .outerRadius(radius * 0.8)

    // Another arc that won't be drawn. Just for labels positioning
    var outerArc = d3.arc()
    .innerRadius(radius * 0.9)
    .outerRadius(radius * 0.9)

    // Build the pie chart: Basically, each part of the pie is a path that we build using the arc function.
    svg
    .selectAll('allSlices')
    .data(data_ready)
    .enter()
    .append('path')
    .attr('d', arc)
    .attr('fill', function(d){ return(color(d.data.key)) })
    .attr("stroke", "white")
    .style("stroke-width", "2px")
    .style("opacity", 0.7)

    // Add the polylines between chart and labels:
    svg
    .selectAll('allPolylines')
    .data(data_ready)
    .enter()
    .append('polyline')
    .attr("stroke", "black")
    .style("fill", "none")
    .attr("stroke-width", 1)
    .attr('points', function(d) {
    var posA = arc.centroid(d) // line insertion in the slice
    var posB = outerArc.centroid(d) // line break: we use the other arc generator that has been built only for that
    var posC = outerArc.centroid(d); // Label position = almost the same as posB
    var midangle = d.startAngle + (d.endAngle - d.startAngle) / 2 // we need the angle to see if the X position will be at the extreme right or extreme left
    posC[0] = radius * 0.95 * (midangle < Math.PI ? 1 : -1); // multiply by 1 or -1 to put it on the right or on the left
    return [posA, posB, posC]
    })

    // Add the polylines between chart and labels:
    svg
    .selectAll('allLabels')
    .data(data_ready)
    .enter()
    .append('text')
    .text( function(d) { console.log(d.data.key) ; return d.data.key + ": " + d.data.value } )
    .attr('transform', function(d) {
        var pos = outerArc.centroid(d);
        var midangle = d.startAngle + (d.endAngle - d.startAngle) / 2
        pos[0] = radius * 0.99 * (midangle < Math.PI ? 1 : -1);
        return 'translate(' + pos + ')';
    })
    .style('text-anchor', function(d) {
        var midangle = d.startAngle + (d.endAngle - d.startAngle) / 2
        return (midangle < Math.PI ? 'start' : 'end')
    })

}, 3000);
 