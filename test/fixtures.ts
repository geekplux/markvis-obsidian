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
