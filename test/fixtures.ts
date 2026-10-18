// The two blocks every markvis host is checked against: the first valid
// example and the first invalid one from the markvis repository
// (examples/valid/01-bar-basic.md, examples/invalid/01-unknown-type.md).
// Obsidian passes a processor the text between the fences, as here.

export const VALID = `markvis: 2
type: bar
title: Mar led Midtown box office at 9.2k tickets
unit: tickets
x: month
y: tickets

month,tickets
Sep,5200
Oct,6100
Nov,7800
Dec,8500
Jan,4800
Feb,7200
Mar,9200
Apr,6900
`;

export const INVALID = `type: donut
title: Bad
x: name
y: value

name,value
A,1
B,2
`;

/** A block with markup in its cells; it must come out as text. */
export const HOSTILE = `type: bar
x: name
y: value

name,value
<img src=x onerror=alert(1)>,1
<script>alert(2)</script>,2
`;

/** A block with no title, so the note's filename names the chart. */
export const UNTITLED = `type: line
x: day
y: visits

day,visits
Mon,3
Tue,5
Wed,4
`;

/** A fence with nothing in it. */
export const EMPTY = "";

/** A block cut off mid-line, as while typing. */
export const CUT = "markvis: 2\ntype: ba";

/**
 * One block per chart family, from the markvis examples, to collect the CSS
 * variables markvis paints with. Together they reach every paint name.
 */
export const THEMING: Record<string, string> = {
  bar: VALID,
  line: `type: line
title: Walk-up still leads member
x: week
y: count
series: channel

week,channel,count
W1,walk-up,64
W1,member,28
W2,walk-up,68
W2,member,32
W3,walk-up,71
W3,member,35
`,
  heatmap: `type: heatmap
title: Ten o'clock still fills the market
x: hour
y: visits
series: weekday

hour,weekday,visits
8am,Wed,55
9am,Wed,95
10am,Wed,140
8am,Sat,210
9am,Sat,480
10am,Sat,720
`,
  treemap: `type: treemap
title: Red Line still carries Midtown mornings
x: station
y: boardings
series: line

station,line,boardings
Five Points,Red,4200
Midtown,Red,3100
Arts Center,Red,1800
Airport,Gold,3600
Peachtree Center,Gold,2200
Lindbergh,Green,900
Bankhead,Green,720
Ashby,Blue,640
`,
  pie: `type: pie
title: Transit takes the largest mode share
x: mode
y: count

mode,count
Transit,38
Walk,24
Drive,22
Bike,11
Other,8
`,
  waterfall: `type: waterfall
title: City match still lifts the fund
unit: USD k
x: step
y: delta

step,delta
Opening balance,120
Donor gifts,45
City match,60
Resurfacing,-80
Lighting,-25
`,
};
