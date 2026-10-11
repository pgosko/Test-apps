/* core/config.js — Static config: modes, presets, paint palettes, default state DEF. */
const MODES=[['photo','Photo'],['gray','Value'],['squint','Squint'],['values','Values'],['notan','Notan'],['palette','Palette'],['remap','Limited'],['temp','Temp'],['chroma','Chroma']];
const MODE_INFO={
  photo:['Photo','The reference as placed on your canvas. Tap anywhere to sample a colour (hex, value, suggested mix).'],
  gray:['Value check','Lightness only (CIE L*). If the picture doesn\u2019t read in gray, colour won\u2019t save it.'],
  squint:['Squint','Digital squint: detail drops away, leaving the big masses and value groupings.'],
  values:['Value study','Posterises lightness into steps. Tap a step to see where it falls. Black/white levels clip the ends; midpoint shifts where the middle value lands.'],
  notan:['Notan','Two (or three) value design. Does the composition read as a clear pattern of light and dark?'],
  palette:['Palette','Main colours found by k-means clustering in OKLab (a perceptual colour space). Tap a swatch to see where it appears. Blur + clean-up give “big shapes”.'],
  remap:['Limited palette','Re-paints the reference using only what your palette can mix (simulated, up to 3 paints + ratios). Colours the palette can\u2019t reach shift to the nearest mix.'],
  temp:['Temperature','Warm (orange) vs cool (blue) relative to neutral gray; strength shows how far from neutral.'],
  chroma:['Chroma','Brighter = more saturated. Most of a scene is lower chroma than it looks.']
};
const PRESETS=[['custom','Custom'],['5x7','5 × 7 in',5,7,'in'],['6x8','6 × 8 in',6,8,'in'],['8x10','8 × 10 in',8,10,'in'],['9x12','9 × 12 in',9,12,'in'],['11x14','11 × 14 in',11,14,'in'],['12x16','12 × 16 in',12,16,'in'],['16x20','16 × 20 in',16,20,'in'],['18x24','18 × 24 in',18,24,'in'],['24x30','24 × 30 in',24,30,'in'],['24x36','24 × 36 in',24,36,'in'],['30x40c','30 × 40 cm',30,40,'cm'],['40x50c','40 × 50 cm',40,50,'cm'],['50x70c','50 × 70 cm',50,70,'cm'],['A5','A5 (14.8 × 21 cm)',14.8,21,'cm'],['A4','A4 (21 × 29.7 cm)',21,29.7,'cm'],['A3','A3 (29.7 × 42 cm)',29.7,42,'cm'],['A2','A2 (42 × 59.4 cm)',42,59.4,'cm'],['A1','A1 (59.4 × 84.1 cm)',59.4,84.1,'cm'],['sq8','Square 8 × 8 in',8,8,'in'],['sq12','Square 12 × 12 in',12,12,'in'],['sq20','Square 20 × 20 in',20,20,'in'],['sq30c','Square 30 × 30 cm',30,30,'cm'],['photo','Match photo aspect']];
const PIG={white:['Titanium White','#f4f2ec'],black:['Ivory Black','#1a1c21'],ochre:['Yellow Ochre','#c9952f'],cadRedL:['Cadmium Red Light','#dc3d2a'],cadYelM:['Cadmium Yellow Medium','#f4b400'],cadYelL:['Cadmium Yellow Light','#f8d81c'],hansa:['Hansa Yellow','#f6d10b'],quinMag:['Quinacridone Magenta','#a3245e'],phthalo:['Phthalo Blue','#16478a'],ultra:['Ultramarine Blue','#273e9f'],aliz:['Alizarin Crimson','#8f1d2c'],bSienna:['Burnt Sienna','#8c4120'],bUmber:['Burnt Umber','#4b3223'],rUmber:['Raw Umber','#5c4b37'],viridian:['Viridian','#1f6f5b'],cerulean:['Cerulean Blue','#2b80b9']};
const PALS={zorn:['Zorn (white, ochre, cad red, black)',['white','ochre','cadRedL','black']],triad:['Primary triad',['white','hansa','quinMag','phthalo']],split:['Split primary (6 + white)',['white','cadYelM','hansa','cadRedL','quinMag','ultra','phthalo']],earth:['Earth palette',['white','ochre','bSienna','bUmber','ultra']],mono:['Monochrome (umber + white)',['white','bUmber']],extracted:['From extracted palette',null],custom:['Custom',null]};
const pigsOf=id=>PALS[id][1].map(k=>({n:PIG[k][0],c:PIG[k][1]}));

const DEF={mode:'photo',unit:'in',cw:12,ch:16,preset:'12x16',orient:'portrait',workRes:1200,
  thirds:false,phi:false,spiral:true,spiralRot:0,spiralFlip:false,spiralSq:false,diag:'off',recip:false,armature:false,center:false,
  compColor:'#ffd27a',compAlpha:0.9,compWidth:1.5,
  grid:false,gridMode:'count',gridCols:4,gridRows:4,gridSquare:true,gridSpacing:2,gridLabels:true,gridDiag:false,gridColor:'#ffffff',gridAlpha:0.75,gridWidth:1,
  lines:'off',lineSrc:'edges',lineBlur:2,lineDetail:40,lineClean:25,lineThick:2,lineColor:'#e8432e',lineAlpha:0.9,
  vSteps:5,vBlack:0,vWhite:100,vMid:50,vBlur:1,vSmooth:0,
  nThree:false,nMid:50,nBlur:2,nSmooth:1,squint:2,
  pK:8,pBlur:1,pSmooth:1,
  rPreset:'zorn',rMix:true,rBlur:1,pigments:pigsOf('zorn'),
  tStrength:1,cStrength:1,
  canvasColor:'#efebe2',place:{cx:0.5,cy:0.5,s:1,rot:0,fx:1,fy:1,auto:true},
  compare:'off',split:0.5,flipH:false,flipV:false,stageBg:'#3a3a3a',exportScale:2};
