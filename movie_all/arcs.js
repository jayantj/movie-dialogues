// Global functions called when select elements changed
(function() {
var svgMain = d3.select('#main').select('svg');

// Get layout parameters
var svgMainWidth = +svgMain.attr('width');
var svgMainHeight = +svgMain.attr('height');

var MainPadding = {t: 90, r: 200, b: 60, l: 200};

var rectNodeHeight = 60;
var rectNodeWidth = 5;

// Compute chart dimensions
var mainChartWidth = svgMainWidth - MainPadding.l - MainPadding.r;
var mainChartHeight = svgMainHeight - MainPadding.t - MainPadding.b;
console.log('width and height: ', mainChartHeight);

// fixed node radius
var radius = 4;
var malexfix = MainPadding.l + 100;
var femalefix = svgMainWidth - MainPadding.r - 100;

var cars = [];
var maleScale = function() { return ; };
var femaleScale = function() { return ; };
var male = [];
var female = [];

var mRadianScale = function() { return ;};
var fRadianScale = function() { return ;};

var toolTip = d3.tip()
  .attr('class', 'dialogue-tip')
  .direction('s')
  .offset([-12, 0])
  .html(function(d) {
    return d.source.conv.dialogues.reduce((accu, dialogue, i) => {
      return `${accu}<span>${dialogue.characterName} : ${dialogue.text}</span><br/>`;
    }, '');
  });
  svgMain.call(toolTip);


d3.json('./../data/conv/m0.json', function(error, dataset) {
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
    maleLinks = dataset.maleLinks;
    femaleLinks = dataset.femaleLinks;
    cLinks = dataset.crossGenderLinks;
    var movieTitle = male[0].movieTitle;

    maleScale = d3.scaleLinear()
    .domain([0, male.length - 1])
    .range([MainPadding.t, mainChartHeight]);
    femaleScale = d3.scaleLinear()
    .domain([0, female.length - 1])
    .range([MainPadding.t, mainChartHeight]);

    mRadianScale = d3.scaleLinear()
    .range([Math.PI / 2, 3 * Math.PI / 2]);

    fRadianScale = d3.scaleLinear()
    .range([3 * Math.PI / 2, 5 * Math.PI / 2]);

    // dataset.columns.forEach(function(column) {
    //     domainMap[column] = d3.extent(dataset, function(data_element){
    //         return data_element[column];
    //     });
    // });
    const maleG = svgMain.append('g').attr('class', 'male');
    const femaleG = svgMain.append('g').attr('class', 'female');
    const crossG = svgMain.append('g').attr('class', 'cross-g');
    linearLayout(male, malexfix, maleScale);
    linearLayout(female, femalefix, femaleScale);

    const allCharacters = male.concat(female);
    
    maleLinks.forEach(function(d, i) {
      // d.source = isNaN(d.source) ? d.source : male[d.source-1];
      d.source = allCharacters.find(el => el.id === d.source);
      // d.target = isNaN(d.target) ? d.target : male[d.target-1];
      d.target = allCharacters.find(el => el.id === d.target);
    });

    femaleLinks.forEach(function(d, i) {
      d.source = allCharacters.find(el => el.id === d.source);
      d.target = allCharacters.find(el => el.id === d.target);
    });

    cLinks.forEach((d, i) => {
      d.source = allCharacters.find(el => el.id === d.source);
      d.target = allCharacters.find(el => el.id === d.target);
    });

    drawLinks(maleG, maleLinks, mRadianScale, malexfix);
    drawLinks(femaleG, femaleLinks, fRadianScale, femalefix);
    drawCrossLinks(crossG, cLinks, maleScale, femaleScale);
    drawNodes(maleG, male, malexfix, maleScale);
    drawNodes(femaleG, female, femalefix, femaleScale);

    svgMain.append('text')
    .attr('class', 'label')
    .attr('transform', `translate(${malexfix}, ${svgMainHeight - MainPadding.b + 20})`)
    .style('text-anchor', 'middle')
    .text('Male');

    svgMain.append('text')
    .attr('class', 'label')
    .attr('transform', `translate(${malexfix}, ${MainPadding.t - 20})`)
    .style('text-anchor', 'middle')
    .text('Male');

    svgMain.append('text')
    .attr('class', 'label')
    .attr('transform', `translate(${femalefix}, ${svgMainHeight - MainPadding.b + 20})`)
    .style('text-anchor', 'middle')
    .text('Female');

    svgMain.append('text')
    .attr('class', 'label')
    .attr('transform', `translate(${femalefix}, ${MainPadding.t - 20})`)
    .style('text-anchor', 'middle')
    .text('Female');

    svgMain.append('text')
    .attr('class', 'movie-title')
    .attr('transform', `translate(${mainChartWidth / 2 + MainPadding.l}, ${MainPadding.t - 50})`)
    .style('text-anchor', 'middle')
    .text(movieTitle.toUpperCase());

});

function linearLayout(nodes, fix, scale) {
  nodes.forEach(function(d, i) {
      d.x = fix;
      d.y = scale(i);
  })
}

function drawCrossLinks (group, links, s1, s2) {
  const linksOfConv = links.flatMap((l, i) => {
    const conversations = Array.from({length: l.lines.length}, (c, j) => {
      const interval = (l.counts > 1) ? (l.counts - 1) : l.counts;
      const temp = {
        source: {
          cname: l.source.cname,
          gender: l.source.gender,
          id: l.source.id,
          movieId: l.source.movieId,
          movieTitle: l.source.movieTitle,
          x: l.source.x + rectNodeWidth,
          y: (rectNodeHeight / interval) * j + l.source.y,
          conv: l.lines[j],
        },
        target: {
          cname: l.target.cname,
          gender: l.target.gender,
          id: l.target.id,
          movieId: l.target.movieId,
          movieTitle: l.target.movieTitle,
          x: l.target.x,
          y: (rectNodeHeight / interval) * j + l.target.y,
          conv: l.lines[j],
        },
        movieId: l.movieId,
      };
      return temp;
    });
    return conversations;
  });

  group.selectAll('line')
  .data(linksOfConv)
  .enter()
  .append('line')
  .attr('class', 'cLink')
  .attr('x1', function(d, i) {
    return d.source.x;
  })
  .attr('y1', function(d, i) {
    return d.source.y;
  })
  .attr('x2', function(d, i) {
    return d.target.x;
  })
  .attr('y2', function(d, i) {
    return d.target.y;
  })
  .on('mouseover', function(d, i) {
    // var clicked = d3.select(this);
    // console.log(clicked);
    toolTip.show(d, i);
  })
  .on('mouseout', toolTip.hide);
}

function drawLinks(group, links, scale, xFix) {
  var arc = d3.lineRadial()
  // .interpolate()
  // .tension(0)
  .angle(function(d) { return scale(d); });

  const linksOfConv = links.flatMap((l, i) => {
    const conversations = Array.from({length: l.lines.length}, (c, j) => {
      let {y, ...source} = l.source;
      const interval = (l.counts > 1) ? (l.counts - 1) : l.counts;
      const temp = {
        source: {
          source,
          y: (rectNodeHeight / interval) * j + l.source.y,
          conv: l.lines[j],
        },
        target: {
          cname: l.target.cname,
          gender: l.target.gender,
          id: l.target.id,
          movieId: l.target.movieId,
          movieTitle: l.target.movieTitle,
          x: l.target.x,
          y: (rectNodeHeight / interval) * j + l.target.y,
          conv: l.lines[j],
        },
        movieId: l.movieId,
      };
      return temp;
    });
    return conversations;
  });

  group.selectAll('path')
  .data(linksOfConv)
  .enter()
  .append('path')
  .attr('class', 'link')
  .attr('transform', function(d, i) {
    return `translate(${xFix},${d.source.y + (d.target.y-d.source.y)/2}) rotate(90)`
  })
  .attr('d', function(d, i) {
      var xDist = Math.abs(d.target.y - d.source.y);
      arc.radius(xDist / 2);
      var points = d3.range(0, Math.ceil(xDist / 3));
      scale.domain([0, points.length - 1]);
      return arc(points);
  })
  .style('fill', 'none')
  .on('mouseover', function(d, i) {
    // var clicked = d3.select(this);
    // console.log(clicked);
    toolTip.show(d, i);
  })
  .on('mouseout', toolTip.hide);
}

function drawNodes(group, nodes, fix, scale) {
  const characterGroup = group.selectAll('g')
  .data(nodes)
  .enter()
  .append('g');

  characterGroup
  .append('rect')
  .attr('class', 'node')
  .attr('x', function(d, i) {
      return fix;
  })
  .attr('y', function(d, i) {
      return scale(i);
  })
  .attr('width', `${rectNodeWidth}px`)
  .attr('height', `${rectNodeHeight}px`)
  .attr('fill', 'red');

  characterGroup
  .append('text')
  .attr('class', 'character-name')
  .attr('x', function(d, i) {
      return fix;
  })
  .attr('y', function(d, i) {
      return scale(i) + rectNodeHeight + 15;
  })
  .style('text-anchor', 'middle')
  .text(function(d, i) {
    return d.cname;
  });
};

})();