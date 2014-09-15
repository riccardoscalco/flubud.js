// Generated by CoffeeScript 1.6.3
(function() {
  var drawGraph, entropy, eqClasses, fileDisplayArea, fileInput, manipulate, mcf, mcr, mkPart, reduction, rohlin, rohlin_reduced;

  fileInput = document.getElementById('fileInput');

  fileDisplayArea = document.getElementById('fileDisplayArea');

  manipulate = function(t) {
    var fix, format, getInfo, infos, lines, sequences;
    infos = [];
    sequences = [];
    format = d3.time.format("%Y-%m-%d");
    getInfo = function(s) {
      s = s.slice(1).split('|');
      return {
        'date': format.parse(s[0].trim()),
        'strain': s[1].trim()
      };
    };
    fix = function(s, index, array) {
      if (s[0] === '>') {
        sequences.push('');
        return infos.push(getInfo(s));
      } else {
        return sequences[sequences.length - 1] += s;
      }
    };
    lines = t.split('\n');
    lines.forEach(fix);
    return [infos, sequences];
  };

  mkPart = function(s) {
    var i, res, _i, _ref;
    res = '1';
    for (i = _i = 1, _ref = s.length - 1; 1 <= _ref ? _i <= _ref : _i >= _ref; i = 1 <= _ref ? ++_i : --_i) {
      res += s[i] === s[i - 1] ? '0' : '1';
    }
    return res;
  };

  eqClasses = function(partitions) {
    var index, part, res, _i, _len;
    res = {};
    for (index = _i = 0, _len = partitions.length; _i < _len; index = ++_i) {
      part = partitions[index];
      (res[part] || (res[part] = [])).push(index);
    }
    return res;
  };

  entropy = function(p) {
    var count, i, res, _fn, _i, _len;
    res = 0;
    count = 1;
    _fn = function(i) {
      if (i === '0') {
        return count += 1;
      } else if (count > 1) {
        res -= count * Math.log(count);
        return count = 1;
      }
    };
    for (_i = 0, _len = p.length; _i < _len; _i++) {
      i = p[_i];
      _fn(i);
    }
    if (count > 1) {
      res -= count * Math.log(count);
    }
    return res / p.length + Math.log(p.length);
  };

  mcf = function(p, q) {
    var _i, _ref, _results;
    return (function() {
      _results = [];
      for (var _i = 0, _ref = p.length - 1; 0 <= _ref ? _i <= _ref : _i >= _ref; 0 <= _ref ? _i++ : _i--){ _results.push(_i); }
      return _results;
    }).apply(this).reduce((function(previous, j) {
      return previous + (+p[j] && +q[j]);
    }), '');
  };

  mcr = function(p, q) {
    var _i, _ref, _results;
    return (function() {
      _results = [];
      for (var _i = 0, _ref = p.length - 1; 0 <= _ref ? _i <= _ref : _i >= _ref; 0 <= _ref ? _i++ : _i--){ _results.push(_i); }
      return _results;
    }).apply(this).reduce((function(previous, j) {
      return previous + (+p[j] || +q[j]);
    }), '');
  };

  rohlin = function(p, q) {
    return 2 * entropy(mcr(p, q)) - entropy(p) - entropy(q);
  };

  reduction = function(p, q) {
    var p_r, q_r, sigma, _i, _j, _ref, _ref1, _results, _results1;
    sigma = mcf(p, q);
    p_r = '1' + (function() {
      _results = [];
      for (var _i = 1, _ref = p.length - 1; 1 <= _ref ? _i <= _ref : _i >= _ref; 1 <= _ref ? _i++ : _i--){ _results.push(_i); }
      return _results;
    }).apply(this).reduce((function(previous, j) {
      return previous + (+p[j] && +(!+sigma[j]));
    }), '');
    q_r = '1' + (function() {
      _results1 = [];
      for (var _j = 1, _ref1 = q.length - 1; 1 <= _ref1 ? _j <= _ref1 : _j >= _ref1; 1 <= _ref1 ? _j++ : _j--){ _results1.push(_j); }
      return _results1;
    }).apply(this).reduce((function(previous, j) {
      return previous + (+q[j] && +(!+sigma[j]));
    }), '');
    return [p_r, q_r];
  };

  rohlin_reduced = function(p, q) {
    var p_r, q_r, _ref;
    _ref = reduction(p, q), p_r = _ref[0], q_r = _ref[1];
    return rohlin(p_r, q_r);
  };

  drawGraph = function(equivClasses, infos, sequences) {
    var band, colorScale, colors, compareNumbers, data, el, format, getRandomInt, graph, height, info, infoDate, infoName, last, margin, randomColor, resize, svg, width, xAxis, xAxisSVG, xScale, yScale;
    resize = function(id) {
      var aspect, chart, container;
      chart = $("#" + id);
      aspect = chart.width() / chart.height();
      container = chart.parent();
      resize = function() {
        var targetWidth;
        targetWidth = container.width();
        chart.attr("width", targetWidth);
        return chart.attr("height", Math.round(targetWidth / aspect));
      };
      $(window).on("resize", resize).trigger("resize");
      return $(window).on("ready", resize).trigger("resize");
    };
    compareNumbers = function(a, b) {
      return a - b;
    };
    getRandomInt = function(min, max) {
      return Math.floor(Math.random() * (max - min + 1)) + min;
    };
    randomColor = function(colors, last) {
      var color;
      color = colors[getRandomInt(0, colors.length - 1)];
      if (color !== last) {
        return color;
      } else {
        return randomColor(colors, last);
      }
    };
    margin = {
      top: 40,
      right: 40,
      bottom: 40,
      left: 40
    };
    width = 500 - margin.left - margin.right;
    height = 500 - margin.top - margin.bottom;
    xScale = d3.time.scale().domain(d3.extent(infos, function(e) {
      return e.date;
    })).range([0, width]);
    equivClasses.sort(function(a, b) {
      return d3.median(a, function(i) {
        return xScale(infos[i].date);
      }) - d3.median(b, function(i) {
        return xScale(infos[i].date);
      });
    });
    data = equivClasses.map(function(e, index) {
      var i, _i, _len, _results;
      _results = [];
      for (_i = 0, _len = e.length; _i < _len; _i++) {
        i = e[_i];
        _results.push([infos[i].strain, infos[i].date, index + 1]);
      }
      return _results;
    });
    data = data.reduce(function(a, b) {
      return a.concat(b);
    });
    data.sort(function(a, b) {
      return a[1] - b[1];
    });
    svg = d3.select("#graph").append("svg").attr("id", "graphSVG").attr("viewBox", "0 0 500 500").attr("preserveAspectRatio", "xMidYMid").attr("width", width + margin.left + margin.right).attr("height", height + margin.top + margin.bottom).append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    svg.append('defs').append('pattern').attr('id', 'diagonalHatchCase5').attr('patternUnits', 'userSpaceOnUse').attr('width', 4).attr('height', 4).append('path').attr('d', 'M-1,1 l2,-2 M0,4 l4,-4 M3,5 l2,-2').attr('stroke', '#eee').attr('stroke-width', 1);
    info = svg.append("g").attr("transform", "translate(100,0)").style({
      "fill": "#333",
      "font-size": "12px",
      "font-family": "Lato"
    });
    info.append("rect").attr({
      "x": "-100",
      "y": "0",
      "height": "50",
      "width": width
    }).style("fill", "url(#diagonalHatchCase5)");
    info.append("text").text("Strain Name: ").attr("dy", "20").style({
      "text-anchor": "end",
      "font-weight": "700"
    });
    info.append("text").attr("dy", "35").text("Isolation Date: ").style({
      "text-anchor": "end",
      "font-weight": "700"
    });
    infoName = info.append("text").attr("dx", "7").attr("dy", "20").text("A/Wisconsin/11/2013");
    infoDate = info.append("text").attr("dx", "7").attr("dy", "35").text("June 23, 2013");
    format = d3.time.format("%B %d, %Y");
    yScale = d3.scale.ordinal().domain(data.map(function(i) {
      return i[2];
    }).sort(compareNumbers)).rangeBands([height, 50], 0.5, 0.5);
    band = yScale.rangeBand();
    xAxis = d3.svg.axis().scale(xScale).tickSize(4, 1).orient("bottom");
    xAxisSVG = svg.append("g").attr("transform", "translate(0," + height + ")").call(xAxis);
    xAxisSVG.selectAll("text").style({
      "fill": "#333",
      "font-size": "9px",
      "font-family": "Lato",
      "font-weight": "700"
    });
    xAxisSVG.selectAll("path").style({
      "fill": "#333",
      "stroke": "#333",
      "stroke-width": "0px"
    });
    xAxisSVG.selectAll("line").style({
      "fill": "#333",
      "stroke": "#333",
      "stroke-width": "1.5px"
    });
    last = void 0;
    colors = ["#ea5818", "#602917", "#a4330e", "#e2b03a", "#4f2b17", "#b24c18", "#e59523", "#fcd24d"];
    colorScale = d3.scale.ordinal().domain(data.map(function(i) {
      return i[2];
    }).sort(compareNumbers));
    colorScale.range(colorScale.domain().map(function(c) {
      return last = randomColor(colors, last);
    }));
    graph = svg.append("g");
    el = graph.selectAll(".element").data(data).enter().append("line").attr("x1", function(d) {
      return xScale(d[1]);
    }).attr("x2", function(d) {
      return xScale(d[1]);
    }).attr("y1", function(d) {
      return yScale(d[2]);
    }).attr("y2", function(d) {
      return yScale(d[2]) + band;
    }).style("stroke", function(d) {
      return colorScale(d[2]);
    }).style({
      "stroke-width": "1px",
      "stroke-opacity": "1"
    }).on("mouseover", function(d) {
      var self;
      infoName.text(d[0]);
      infoDate.text(format(d[1]));
      self = d3.select(this);
      return self.style({
        "stroke": "#fff"
      });
    }).on("mouseout", function(d) {
      var self;
      self = d3.select(this);
      return self.style("stroke", function(d) {
        return colorScale(d[2]);
      });
    });
    /*
    el.transition()
        .duration(600)
        .delay((e,i) -> i)
        .style("stroke-opacity","1")
    */

    return resize("graphSVG");
  };

  fileInput.addEventListener('change', function(e) {
    var file, reader;
    NProgress.start();
    d3.select("#graphSVG").remove();
    file = fileInput.files[0];
    reader = new FileReader();
    reader.onload = function(e) {
      var clust, clustTree, ec, infos, iteration, merge, partitions, pos, s, sequences, setEqCl, tree, unPack, _ref;
      _ref = manipulate(reader.result), infos = _ref[0], sequences = _ref[1];
      partitions = (function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = sequences.length; _i < _len; _i++) {
          s = sequences[_i];
          _results.push(mkPart(s));
        }
        return _results;
      })();
      ec = d3.values(eqClasses(partitions)).filter(function(e) {
        return e.length > 10;
      });
      setEqCl = ec.map(function(e) {
        return partitions[e[0]];
      });
      pos = setEqCl.reduce((function(obj, x, i) {
        obj[x] = i;
        return obj;
      }), {});
      iteration = 0;
      merge = function(tree, level) {
        if (tree.left && tree.right) {
          iteration += 1;
          if (iteration >= level) {
            return _.flatten([merge(tree.left, level), merge(tree.right, level)]);
          } else {
            return [merge(tree.left, level), merge(tree.right, level)];
          }
        } else {
          return [pos[tree.value]];
        }
      };
      unPack = function(clustTree) {
        if (typeof clustTree[0] === 'object') {
          unPack(clustTree[0]);
          return unPack(clustTree[1]);
        } else {
          return clust.push(clustTree);
        }
      };
      tree = clusterfck.hcluster(setEqCl, rohlin, "complete");
      clust = [];
      clustTree = merge(tree, 8);
      unPack(clustTree);
      return drawGraph(ec, infos, sequences);
    };
    reader.readAsText(file);
    return NProgress.done();
  });

}).call(this);