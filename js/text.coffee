fileInput = document.getElementById('fileInput')
fileDisplayArea = document.getElementById('fileDisplayArea')

# manipulate original fasta file
manipulate = (t) ->
  infos = []
  sequences = []
  format = d3.time.format("%Y-%m-%d")
  getInfo = (s) ->
    s = s[1..].split('|')
    {
      'date': format.parse(s[0].trim())
      'strain': s[1].trim()
    }
  fix = (s ,index, array) ->
    if s[0] is '>'
      sequences.push('')
      infos.push(getInfo(s))
    else
      sequences[sequences.length - 1] += s
  lines = t.split('\n')
  lines.forEach(fix)
  [infos,sequences]

mkPart = (s) ->
  res = '1'
  for i in [1..s.length - 1]
    res += if s[i] is s[i-1] then '0' else '1'
  res

eqClasses = (partitions) ->
  res = {}
  for part, index in partitions
    (res[part] or (res[part] = [])).push(index)
  res

entropy = (p) ->
  res = 0
  count = 1
  for i in p
    do (i) -> 
      if i is '0'
        count += 1
      else if count > 1
        res -= count * Math.log count
        count = 1
  if count > 1
    res -= count * Math.log count
  res/p.length + Math.log p.length

mcf = (p,q) ->
  [0..p.length-1].reduce ((previous,j) -> previous + (+p[j] and +q[j])), ''

mcr = (p,q) ->
  [0..p.length-1].reduce ((previous,j) -> previous + (+p[j] or +q[j])), ''

rohlin = (p,q) ->
  2 * entropy(mcr(p,q)) - entropy(p) - entropy(q)

reduction = (p,q) ->
  sigma = mcf(p,q)
  p_r = '1' + [1..p.length-1].reduce ((previous,j) -> previous + (+p[j] and +(not +sigma[j]))), ''
  q_r = '1' + [1..q.length-1].reduce ((previous,j) -> previous + (+q[j] and +(not +sigma[j]))), ''
  [p_r,q_r]

rohlin_reduced = (p,q) ->
  [p_r,q_r] = reduction(p,q)
  rohlin(p_r,q_r)

# draw graph function
drawGraph = (equivClasses, infos, sequences) ->

  resize = (id) ->
    chart = $("#"+id)
    aspect = chart.width() / chart.height()
    container = chart.parent()
    resize = ->
      targetWidth = container.width()
      chart.attr("width", targetWidth)
      chart.attr("height", Math.round(targetWidth / aspect))
    $(window).on("resize", resize).trigger("resize")
    $(window).on("ready", resize).trigger("resize")

  compareNumbers = (a, b) -> a - b

  getRandomInt = (min, max) -> Math.floor(Math.random() * (max - min + 1)) + min

  randomColor = (colors, last) -> 
    color = colors[getRandomInt(0,colors.length-1)]
    if color isnt last then color else randomColor(colors, last)

  margin = {top: 40, right: 40, bottom: 40, left: 40}
  width = 500 - margin.left - margin.right
  height = 500 - margin.top - margin.bottom

  xScale = d3.time.scale()
      .domain(d3.extent(infos, (e) -> e.date))
      .range([0,width])

  #medians = equivClasses.map((e) -> d3.median(e, (i) -> xScale infos[i].date))
  equivClasses.sort (a,b) ->
    d3.median(a, (i) -> xScale infos[i].date) - d3.median(b, (i) -> xScale infos[i].date)

  data = equivClasses.map((e, index) -> [infos[i].strain, infos[i].date, index + 1] for i in e)
  data = data.reduce((a, b) -> a.concat(b))
  data.sort((a,b)->a[1]-b[1])

  svg = d3.select("#graph").append("svg")
      .attr("id","graphSVG")
      .attr("viewBox", "0 0 500 500")
      .attr("preserveAspectRatio", "xMidYMid")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
    .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
  svg
    .append('defs')
    .append('pattern')
      .attr('id', 'diagonalHatchCase5')
      .attr('patternUnits', 'userSpaceOnUse')
      .attr('width', 4)
      .attr('height', 4)
    .append('path')
      .attr('d', 'M-1,1 l2,-2 M0,4 l4,-4 M3,5 l2,-2')
      .attr('stroke', '#eee')
      .attr('stroke-width', 1)

  info = svg.append("g")
      .attr("transform","translate(100,0)")
      .style({
        "fill":"#333"
        "font-size":"12px"
        "font-family":"Lato"
      })
  info.append("rect")
      .attr({
        "x":"-100"
        "y":"0"
        "height":"50"
        "width":width
      })
      .style("fill","url(#diagonalHatchCase5)")
  info.append("text")
      .text("Strain Name: ")
      .attr("dy","20")
      .style({
        "text-anchor":"end"
        "font-weight":"700"
      });
  info.append("text")
      .attr("dy","35")
      .text("Isolation Date: ")
      .style({
        "text-anchor":"end"
        "font-weight":"700"
      });
  infoName = info.append("text")
      .attr("dx","7")
      .attr("dy","20")
      .text("A/Wisconsin/11/2013")
  infoDate = info.append("text")
      .attr("dx","7")
      .attr("dy","35")
      .text("June 23, 2013")

  format = d3.time.format("%B %d, %Y")

  yScale = d3.scale.ordinal()
      .domain(data.map((i) -> i[2]).sort(compareNumbers))
      .rangeBands([height, 50],0.5,0.5)

  band = yScale.rangeBand()

  xAxis = d3.svg.axis()
    .scale(xScale)
    .tickSize(4,1)
    .orient("bottom")

  xAxisSVG = svg.append("g")
    .attr("transform","translate(0," + height + ")")
    .call(xAxis)
  
  xAxisSVG.selectAll("text")
    .style({
      "fill":"#333"
      "font-size":"9px"
      "font-family":"Lato"
      "font-weight":"700"
    })

  xAxisSVG.selectAll("path")
    .style({
      "fill":"#333"
      "stroke":"#333"
      "stroke-width":"0px"
    })

  xAxisSVG.selectAll("line")
    .style({
      "fill":"#333"
      "stroke":"#333"
      "stroke-width":"1.5px"
    })
  
  last = undefined
  colors = ["#ea5818","#602917","#a4330e","#e2b03a","#4f2b17","#b24c18","#e59523","#fcd24d"]
  colorScale = d3.scale.ordinal()
    .domain(data.map((i) -> i[2]).sort(compareNumbers))

  colorScale.range(colorScale.domain().map((c) -> last = randomColor(colors, last)))

  graph = svg.append("g")
  el = graph.selectAll(".element")
      .data(data)
    .enter().append("line")
      .attr("x1",(d) -> xScale(d[1]))
      .attr("x2",(d) -> xScale(d[1]))
      .attr("y1",(d) -> yScale(d[2]))
      .attr("y2",(d) -> yScale(d[2]) + band)
      .style("stroke",(d) -> colorScale(d[2]))
      .style({
        "stroke-width":"1px"
        "stroke-opacity":"1"
      })
      .on("mouseover",(d) ->
        infoName.text(d[0])
        infoDate.text(format(d[1]))
        self = d3.select(this)
        self.style({
          "stroke":"#fff"
        })
      )
      .on("mouseout",(d) ->
        self = d3.select(this)
        self.style("stroke",(d) -> colorScale(d[2]))
      )

  ###
  el.transition()
      .duration(600)
      .delay((e,i) -> i)
      .style("stroke-opacity","1")
  ###

  resize("graphSVG")
  

# main
fileInput.addEventListener('change', (e) ->
  NProgress.start()
  d3.select("#graphSVG").remove()
  file = fileInput.files[0]
  reader = new FileReader()
  reader.onload = (e) ->

    # retrive sequences and relative information from the fasta file
    [infos,sequences] = manipulate reader.result

    # list of partitions
    partitions = (mkPart(s) for s in sequences)

    # select only equivalence classes with more than 5 elements
    ec = d3.values(eqClasses partitions).filter((e) -> e.length > 10)

    # set of equivalence classes
    setEqCl = ec.map((e) -> partitions[e[0]])

    pos = setEqCl.reduce(((obj, x, i) -> 
      obj[x] = i
      obj
      ), {})
    
    # -----
    # function useful to extract information from the tree returned by clusterfck.hcluster
    iteration = 0
    merge = (tree, level) ->
      if tree.left and tree.right
        iteration += 1
        if iteration >= level
          _.flatten([merge(tree.left, level),merge(tree.right, level)])
        else
          [merge(tree.left, level),merge(tree.right, level)]
      else
        [pos[tree.value]]

    unPack = (clustTree) ->
      if typeof(clustTree[0]) is 'object'
        unPack clustTree[0]
        unPack clustTree[1]
      else
        clust.push clustTree
    # ------


    # Hierarchical clustering, complete linkage
    tree = clusterfck.hcluster(setEqCl, rohlin, "complete")
    
    clust = []
    clustTree = merge(tree, 8)
    unPack(clustTree)

    drawGraph(ec, infos, sequences)

  reader.readAsText(file) 
  NProgress.done()
)




