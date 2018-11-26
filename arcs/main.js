// Global functions called when select elements changed

var svg = d3.select('svg');

// Get layout parameters
var svgWidth = +svg.attr('width');
var svgHeight = +svg.attr('height');

var padding = {t: 40, r: 40, b: 40, l: 40};

// Compute chart dimensions
var chartWidth = svgWidth - padding.l - padding.r;
var chartHeight = svgHeight - padding.t - padding.b;
console.log('width and height: ', chartHeight);

// fixed node radius
var radius = 4;
var malexfix = padding.l + 100;
var femaleyfix = svgWidth - padding.r - 100;

// Create a group element for appending chart elements
var chartG = svg.append('g')
    .attr('transform', 'translate('+[padding.l, padding.t]+')');

// Create groups for the x- and y-axes
var xAxisG = chartG.append('g')
    .attr('class', 'x axis')
    .attr('transform', 'translate('+[0, chartHeight]+')');
var yAxisG = chartG.append('g')
    .attr('class', 'y axis');

var cars = [];
var maleScale = function() { return ; };
var femaleScale = function() { return ; };
var male = [];
var female = [];

var mRadianScale = function() { return ;};
var fRadianScale = function() { return ;};


d3.json('./m0.json', function(error, dataset) {
    // Log and return from an error
    console.log(dataset);
    if(error) {
        console.error('Error while loading ./m0.json dataset.');
        console.error(error);
        return;
    }
    // Create global object called chartScales to keep state
    chartScales = {x: 'Male', y: 'Female'};

    male = dataset.male;
    female = dataset.female;
    links = dataset.links;
    cLinks = dataset.crossGenderLinks;
    maleScale = d3.scaleLinear()
    .domain([0, male.length - 1])
    .range([padding.t, chartHeight - padding.b]);
    femaleScale = d3.scaleLinear()
    .domain([0, female.length - 1])
    .range([padding.t, chartHeight - padding.b]);

    mRadianScale = d3.scaleLinear()
    .range([Math.PI / 2, 3 * Math.PI / 2]);

    // dataset.columns.forEach(function(column) {
    //     domainMap[column] = d3.extent(dataset, function(data_element){
    //         return data_element[column];
    //     });
    // });
    const maleG = svg.append('g').attr('class', 'male');
    const femaleG = svg.append('g').attr('class', 'female');
    linearLayout(male, malexfix, maleScale);
    linearLayout(female, femaleyfix, femaleScale);

    const allCharacters = male.concat(female);
    
    links.forEach(function(d, i) {
      // d.source = isNaN(d.source) ? d.source : male[d.source-1];
      d.source = allCharacters.find(el => el.id === d.source);
      // d.target = isNaN(d.target) ? d.target : male[d.target-1];
      d.target = allCharacters.find(el => el.id === d.target);
    });

    cLinks.forEach((d, i) => {
      d.source = allCharacters.find(el => el.id === d.source);
      d.target = allCharacters.find(el => el.id === d.target);
    });

    drawLinks(maleG, links, mRadianScale);
    drawCrossLinks(cLinks, maleScale, femaleScale);
    drawNodes(maleG, male, malexfix, maleScale);
    drawNodes(femaleG, female, femaleyfix, femaleScale);
});

function linearLayout(nodes, fix, scale) {
  nodes.forEach(function(d, i) {
      d.x = fix;
      d.y = scale(i);
  })
}
function drawCrossLinks (links, s1, s2) {
  console.log("cross", links);
  svg.selectAll('line')
  .data(links)
  .enter()
  .append('line')
  .attr('class', 'cLink')
  .attr('x1', malexfix)
  .attr('y1', function(d, i) {
    return d.source.y;
  })
  .attr('x2', femaleyfix)
  .attr('y2', function(d, i) {
    return d.target.y;
  })
  .style('stroke', '#000');
}

function drawLinks(group, links, scale) {
  var arc = d3.lineRadial()
  // .interpolate()
  // .tension(0)
  .angle(function(d) { return scale(d); });

  group.selectAll('path')
  .data(links)
  .enter()
  .append('path')
  .attr('class', 'link')
  .attr('transform', function(d, i) {
    return `translate(140,${d.source.y + (d.target.y-d.source.y)/2}) rotate(90)`
  })
  .attr('d', function(d, i) {
      var xDist = Math.abs(d.target.y - d.source.y);
      arc.radius(xDist / 2);
      var points = d3.range(0, Math.ceil(xDist / 3));
      scale.domain([0, points.length - 1]);
      return arc(points);
  })
  .style('stroke', '#000')
  .style('fill', 'none');
}

function drawNodes(group, nodes, fix, scale) {
  group.selectAll('circle')
  .data(nodes)
  .enter()
  .append('circle')
  .attr('class', 'node')
  .attr('cx', function(d, i) {
      return fix;
  })
  .attr('cy', function(d, i) {
      return scale(i);
  })
  .attr('r', radius);
};