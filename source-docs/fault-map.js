function cMapPrintPreView($PrintArea){this.$moPrintArea=$PrintArea;this.$moPreViewOnly=$(null);}
cMapPrintPreView.prototype.Reset=function(){$('html').removeClass('PPV');this.$moPreViewOnly.remove();this.$moPreViewOnly=$(null);}
cMapPrintPreView.prototype.Hide=function($elms){$elms.removeClass('ppvShow').addClass('ppvHide');}
cMapPrintPreView.prototype.ShowOnly=function($elm){var $parents=$elm.parents();var $children=$elm.find('*');$elm.add($parents).add($children).removeClass('ppvHide').addClass('ppvShow');$parents.addClass('ppvParents');$elm.addClass('ppvSelf');$children.addClass('ppvChildren');this.Hide($('#PrintButton'));}
cMapPrintPreView.prototype.MakePrintArea=function(){this.$moPreViewOnly.remove();this.$moPreViewOnly=$(null);var $title=$('<div class="ppvPreViewOnly">'+'<h1>印刷範囲設定<h1/>'+'<p>印刷機能は InternetExplorer 9,10,11, Firefox, Google Chrome, および Safari に対応しています。</p>'+'<p>マップのドラッグやスケールバーを使って印刷範囲を調整できます。 背景地図もここで変更可能です。</p>'+'</div>');var $buttons=$('<div class="ppvPreViewOnly"><table><tr>'+'<td><input type="button" id="btnPrint" value="印刷..." '+'onClick="print();" /></td>'+'<td><input type="button" id="btnCancel" value="戻る" '+'onClick="oMap.ppvCancel();" /></td>'+'</tr></table></div>');$title.insertBefore(this.$moPrintArea);$buttons.insertAfter(this.$moPrintArea);this.$moPreViewOnly=$title.add($buttons);}
cMapPrintPreView.prototype.ShowPrintArea=function(){$('html').add('html',parent.document).addClass('PPV');this.Hide($('body, body *',parent.document));this.ShowOnly(this.$moPrintArea);$('html',parent.document).removeClass('ppvParents').addClass('ppvHTML');$('body',parent.document).removeClass('ppvParents').addClass('ppvBODY');this.$moPrintArea.parent().removeClass('ppvParents').addClass('ppvIframeParent');this.$moPrintArea.removeClass('ppvSelf').addClass('ppvPrintArea');this.MakePrintArea();}
L.cGeoJsonIcon=L.Icon.extend({options:{scale:1,originalSize:null,},_setIconStyles:function(img,name){L.Icon.prototype._setIconStyles.apply(this,[img,name]);this._setIconStylesCore(img);},_createImg:function(src,el){el=el||document.createElement('img');el.addEventListener('load',this._onloadImg.bind(this),false);el.src=src;return el;},_onloadImg:function(e){var img=e.currentTarget;this._setIconStylesCore.call(this,img);},_setIconStylesCore:function(img){var scale=this.options.scale;this.options.originalSize=[img.naturalWidth,img.naturalWidth];var originalSize=this.options.originalSize;var size=[scale*originalSize[0],scale*originalSize[1]];this.options.iconSize=size;img.style.width=size[0]+'px';img.style.height=size[1]+'px';var x=0;var y=0;if(!!this.options.iconAnchor){this.options.hotSpot=null;var anchor=this.options.iconAnchor;x=-anchor[0];y=-anchor[1];}
var hotSpot={};if(!!this.options.hotSpot){hotSpot=this.options.hotSpot;}else{hotSpot.x=0.5;hotSpot.y=0;}
x=(hotSpot.xunits==='pixels')?-hotSpot.x:-hotSpot.x*size[0];y=(hotSpot.yunits==='pixels')?hotSpot.y-size[1]+1:(-(1-hotSpot.y)*size[1])+1;img.style.marginLeft=x+'px';img.style.marginTop=y+'px';this.options.iconAnchor=[-x,-y];this.options.popupAnchor=[x+size[0]/2,y];}});function cMap(id,opt){"use strict";console_log('cMap( "'+id+'", opt )');console_table(opt);opt.crs=L.CRS.EPSG3857;opt.minZoom=4;opt.zoom=7;opt.maxBounds=[[17.5,119.9],[48.5,156.9]];opt.maxBoundsViscosity=1;opt.scrollWheelZoom='1';opt.inertia='';this._maxBounds=L.latLngBounds(opt.maxBounds);this._searchArea={bounds:null,rectangle:null,polygon:null,markers:null,isVisible:false,withMarkers:false};this._resultArea={bounds:null,rectangle:null};this._map=L.map('afmap',opt);this._opt=opt;var theMap=this;this._ovItems={};this._map.createPane('af_basemap');this._map.getPane('af_basemap').style.zIndex=1;this._map.createPane('af_areaborder');this._map.getPane('af_areaborder').style.zIndex=250;this._map.createPane('af_overlay');this._map.getPane('af_overlay').style.zIndex=350;this._map.createPane('af_tyousati');this._map.getPane('af_tyousati').style.zIndex=490;this._map.createPane('af_segment');this._map.getPane('af_segment').style.zIndex=410;this._map.createPane('af_polyline');this._map.getPane('af_polyline').style.zIndex=420;this._map.attributionControl.setPosition('bottomleft');this._initBaseMaps();this._initOverlapLayers();this._baseMaps[Context.lang==='ja'?'地理院地図 淡色':'GSI Hillshade'].addTo(this._map);this._map.zoomControl.setPosition('bottomright');L.control.zoomViewer().addTo(this._map);var scale=L.control.scale({imperial:false,position:'bottomright'}).addTo(this._map);var scaleContainer=scale.getContainer();L.DomEvent.disableClickPropagation(scaleContainer);var draggableScale=new L.Draggable(scaleContainer);draggableScale.enable();this.addMapPrintControl();this.addMapSelectControl();var funcEnd=function(e){var ll1=e.getSouthWest();var ll2=e.getNorthEast();var oSearchArea=new cRectangle([ll1.lat,ll1.lng],[ll2.lat,ll2.lng]);if(!!document.DB095SearchForm){document.DB095SearchForm.fval_tyousati_p1.value=oSearchArea.sp1();document.DB095SearchForm.fval_tyousati_p2.value=oSearchArea.sp2();}}
this._map.rangeSelector.onEnd(funcEnd,this);if((Context.name==='kishindan_segment')||(Context.name==='tyousati')||(Context.name==='aist_activefault')){this.showSidebar();}else{this.hideSidebar();}
this._sidebar=null;if((!!opt.sidebar)&&(!!opt.sidebar.id)){if(document.getElementById(opt.sidebar.id)!=null){this._sidebar=L.control.sidebar(opt.sidebar.id).addTo(this._map);setTimeout(function(){theMap._sidebar.open('home')},1000);}}
if((!!opt.searchArea)&&(!!opt.searchArea.rectangle)){this._searchArea.bounds=opt.searchArea.bounds;this._searchArea.polygon=this.drawSearchArea(opt.searchArea.rectangle,{withMarkers:true,fillOpacity:0.3});this._searchArea.isVisible=!!this._searchArea.polygon;if(!opt.searchArea.isVisible){this.hideSearchArea();}}}
cMap.prototype._initBaseMaps=function(){"use strict";if(Context.lang==='ja'){this._baseMaps={'地理院地図 陰影起伏図':this.initTile('BmkHillshade','af_basemap'),'地理院地図 標準':this.initTile('BmcStd','af_basemap'),'地理院地図 淡色':this.initTile('BmcPale','af_basemap'),'地理院地図 色別標高図':this.initTile('BmcRelief','af_basemap'),'地理院地図 白地図':this.initTile('BmcBlank','af_basemap'),'GoogleMaps 標準':L.gridLayer.googleMutant({maxZoom:18,type:'roadmap'}),'GoogleMaps 衛星':L.gridLayer.googleMutant({maxZoom:18,type:'satellite'}),'GoogleMaps 地形':L.gridLayer.googleMutant({maxZoom:18,type:'terrain'}),'川だけ地形地図':this.initTile('BmkRivers','af_basemap')};}
else{this._baseMaps={'GSI Hillshade':this.initTile('BmkHillshade','af_basemap'),'GSI Standard':this.initTile('BmcStd','af_basemap'),'GSI Relief':this.initTile('BmcRelief','af_basemap'),'GoogleMaps roadmap':L.gridLayer.googleMutant({maxZoom:18,type:'roadmap'}),'GoogleMaps satellite':L.gridLayer.googleMutant({maxZoom:18,type:'satellite'}),'GoogleMaps terrain':L.gridLayer.googleMutant({maxZoom:18,type:'terrain'}),'AllRivers':this.initTile('BmkRivers','af_basemap')};}}
cMap.prototype._initOverlapLayers=function(){"use strict";this._ovItems={'LatLngGrid':[L.latlngGraticule({color:'#111',opacity:0.6,weight:1,zoomInterval:[{start:0,end:3,interval:40},{start:4,end:4,interval:20},{start:5,end:5,interval:10},{start:6,end:7,interval:5},{start:8,end:8,interval:3},{start:9,end:9,interval:1},{start:10,end:10,interval:0.5},{start:11,end:11,interval:0.3},{start:12,end:12,interval:0.15},{start:13,end:13,interval:0.05},{start:14,end:14,interval:0.03},{start:15,end:15,interval:0.015},{start:16,end:16,interval:0.008},{start:17,end:17,interval:0.005},{start:18,end:20,interval:0.002},]})]}}
cMap.prototype.addMapSelectControl=function(){"use strict";L.control.layers(this._baseMaps,{},{collapsed:true}).addTo(this._map);}
cMap.prototype.addMapPrintControl=function(){"use strict";L.Control.printControl=L.Control.extend({options:{position:'topright',},onAdd:function(map){this._map=map;this._init();return this._container;},_init:function(){var container=L.DomUtil.create('div','leaflet-control-print leaflet-control');container.setAttribute('id','PrintButton');var button=L.DomUtil.create('a','leaflet-control-print-button');button.setAttribute('href','javascript:oMap.ppvShow();');button.setAttribute('role','button');L.DomEvent.on(button,'click',this._click,this);container.appendChild(button);this._container=container;},_click:function(e){e.stopPropagation();}});L.control.printControl=function(options){return new L.Control.printControl(options);};L.control.printControl({onClick:this.ppvShow}).addTo(this._map);}
cMap.prototype.ppvShow=function(){"use strict";if(!this.oMapPrintPreView){this.oMapPrintPreView=new cMapPrintPreView($('#afmap'));}
if(!this.oMapPrintPreView){return;}
this.oMapPrintPreView.ShowPrintArea();this.invalidateSize();}
cMap.prototype.ppvCancel=function(){"use strict";if(!this.oMapPrintPreView){return;}
this.oMapPrintPreView.Reset();this.oMapPrintPreView=null;this.invalidateSize();}
cMap.prototype.updateOverlayLayers=function(id,value,index){"use strict";if(!id){return'';}
if(!value){return'';}
if(!this._ovItems[id]){this._ovItems[id]=[];}
if(!index){this._ovItems[id].push(value);}else{this._ovItems[id][index]=value;}
return id;}
cMap.prototype.map=function(){return this._map;}
cMap.prototype.add=function(o){return o.addTo(this._map);}
cMap.prototype.remove=function(o){return o.removeFrom(this._map);}
cMap.prototype.invalidateSize=function(){var theMap=this._map;theMap.invalidateSize();}
cMap.prototype.getZoom=function(){return this._map.getZoom();}
cMap.prototype.closePopup=function(popup){return this._map.closePopup(popup);}
cMap.prototype.contains=function(o){return this._maxBounds.contains(o);}
cMap.prototype.searchArea=function(){return this._searchArea.rectangle;}
cMap.prototype.searchBounds=function(bounds){if(!this._searchArea){return null;}
if(bounds){this._searchArea.bounds=bounds;document.cookie='s='+encodeURIComponent(JSON.stringify(bounds));}
return this._searchArea.bounds;}
cMap.prototype.resultBounds=function(bounds){if(!this._resultArea){return null;}
if(bounds){this._resultArea.bounds=bounds;document.cookie='r='+encodeURIComponent(JSON.stringify(bounds));}
return this._resultArea.bounds;}
cMap.prototype.fitBounds=function(bounds){if(!bounds){bounds=this.resultBounds();}
if(!bounds){bounds=this.searchBounds();}
if(!bounds){bounds=this._opt.maxBounds;}
if(!this.contains(bounds)){bounds=this._opt.maxBounds;}
this._map.fitBounds(bounds);}
cMap.prototype.setMaxBounds=function(bounds){if(!bounds){bounds=this._maxBounds;}
if(!bounds){bounds=this._opt.maxBoounds;}
if(!bounds){bounds=this._opt.maxBoounds;}
this._map.setMaxBounds(bounds);}
cMap.prototype.drawSearchAreaMarker=function(p){"use strict";var theMap=this;var opt={draggable:true};var marker=L.marker(p,opt).on('drag',function(ev){theMap.redrawSearchArea();});if(this._searchArea.withMarkers){marker.addTo(this._map);}
return marker;}
cMap.prototype.drawSearchArea=function(oRectangle,_opt){"use strict";var opt={withMarkers:false,color:'#3300FF',opacity:0.5,weight:5,fillColor:'#3300FF',fillOpacity:0,show:false}
if(!_opt){_opt={};}
for(var key in _opt){opt[key]=_opt[key];}
this._searchArea.withMarkers=!!opt.withMarkers;this._searchArea.rectangle=oRectangle;this.searchBounds([[oRectangle.minX(),oRectangle.minY()],[oRectangle.maxX(),oRectangle.maxY()]]);if(this._searchArea.polygon!==null){this._searchArea.polygon.removeFrom(this._map);}
var searchArea=this._searchArea.polygon=L.polygon(oRectangle.edges(),opt);if(opt.show)
{searchArea.addTo(this._map);this._searchArea.isVisible=true;}
if(!!document.DB095SearchForm){document.DB095SearchForm.fval_tyousati_p1.value=oRectangle.sp1();document.DB095SearchForm.fval_tyousati_p2.value=oRectangle.sp2();}
return searchArea;}
cMap.prototype.redrawSearchArea=function(){"use strict";if(!this._searchArea.markers){return;}
var ll1=this._searchArea.markers.m1.getLatLng();var ll2=this._searchArea.markers.m2.getLatLng();var minLL=this._maxBounds.getSouthWest();var maxLL=this._maxBounds.getNorthEast();if(!this.contains(ll1)){if(ll1.lat<minLL.lat){ll1.lat=minLL.lat+1;}
if(maxLL.lat<ll1.lat){ll1.lat=maxLL.lat-1;}
if(ll1.lng<minLL.lng){ll1.lng=minLL.lng+1;}
if(maxLL.lng<ll1.lng){ll1.lng=maxLL.lng-1;}
this._searchArea.markers.m1.removeFrom(this._map);this._searchArea.markers.m1.setLatLng(ll1);this._searchArea.markers.m1.addTo(this._map);}
if(!this.contains(ll2)){if(ll2.lat<minLL.lat){ll2.lat=minLL.lat+1;}
if(maxLL.lat<ll2.lat){ll2.lat=maxLL.lat-1;}
if(ll2.lng<minLL.lng){ll2.lng=minLL.lng+1;}
if(maxLL.lng<ll2.lng){ll2.lng=maxLL.lng-1;}
this._searchArea.markers.m2.removeFrom(this._map);this._searchArea.markers.m2.setLatLng(ll2);this._searchArea.markers.m2.addTo(this._map);}
var oSearchArea=new cRectangle([ll1.lat,ll1.lng],[ll2.lat,ll2.lng]);this.drawSearchArea(oSearchArea,{withMarkers:this._searchArea.withMarkers,fillOpacity:0.3});}
cMap.prototype.ClearSearchArea=function(){"use strict";if(!!document.DB095SearchForm){document.DB095SearchForm.fval_tyousati_p1.value="";document.DB095SearchForm.fval_tyousati_p2.value="";}}
cMap.prototype.hideSearchArea=function(){"use strict";this.ClearSearchArea();this._map.rangeSelector.disable();this._map.dragging.enable();return;}
cMap.prototype.showSearchArea=function(){"use strict";this.ClearSearchArea();this._map.rangeSelector.enable();this._map.dragging.disable();return;}
cMap.prototype.hideResultArea=function(isDrag){"use strict";this._searchArea.polygon.removeFrom(this._map);return;}
cMap.prototype.showResultArea=function(isDrag){"use strict";this._searchArea.polygon.addTo(this._map);return;}
cMap.prototype.isExists=function(id,index){"use strict";if(!this._ovItems[id]){return false;}
if(!!index){return!!this._ovItems[id][index];}
return true;}
cMap.prototype.updateSearchCond=function(id,isVisible){if(this._searchCond===undefined){this._searchCond={};}
this._searchCond[id]=isVisible;}
cMap.prototype.show=function(id,isVisible,index){"use strict";isVisible=!!isVisible;if(!this._ovItems[id]){return;}
this.updateSearchCond(id,isVisible);if(!index){var theMap=this;isVisible?this._ovItems[id].forEach(function(layer){layer.addTo(theMap._map);}):this._ovItems[id].forEach(function(layer){layer.removeFrom(theMap._map);});}else{isVisible?this._ovItems[id][index].addTo(this._map):this._ovItems[id][index].removeFrom(this._map);}}
cMap.prototype._strUriDepth=function(id,depth){"use strict";if(depth<=20){return'_lt20km';}
if(depth<=40){return'_lt40km';}
if(depth<=60){return'_lt60km';}
if(depth<=80){return'_lt80km';}
if(depth<=100){return'_lt100km';}
{return'_ge100km';}}
cMap.prototype._strDepth=function(id,depth){if(!depth){return'ごく浅い';}
if(600<=depth){if(id=='QuakeDisp'){return'深さ 600km 以上';}}
return'深さ 約'+depth+'km';}
cMap.prototype._strMag=function(id,magnitude){if(8<magnitude){if(id=='QuakeDisp'){return'M8を超える巨大地震';}}
var sMag='M'+magnitude;if(sMag.indexOf('.')<0){sMag=sMag+'.0';}
return sMag;}
cMap.prototype._strMarkerPopup=function(id,opt,sDbgMsg){var sPlace=(!opt.place)?'':(opt.place+'<br />');var sName=(!opt.name)?'':(opt.name+'<br />');var sDate=(!opt.date)?'':(opt.date+'<br />');var sMag=(!opt.magnitude)?'':(this._strMag(id,opt.magnitude)+'<br />');var sDepth=this._strDepth(id,opt.depth)+'<br />';var sMax=(!opt.maxIntensity)?'':('最大震度'+opt.maxIntensity+'<br />');var sZindex=(!sDbgMsg)?'':('['+sDbgMsg+']');return'<div class="MarkerPopup">'+sPlace+sName+sDate+sMag+sDepth+sMax+sZindex+'</div>';}
cMap.prototype._mkMarkerIcon=function(id,opt){var depth=opt.depth;var mag=opt.mag;var root=Context.root+((id=='QuakeDisp')?'image/mag':'image/dia_mag');var url=root+mag+this._strUriDepth(id,depth)+'.png';var size=0;if(id=='QuakeDisp'){if(mag==4){size=22;}
else if(mag==5){size=32;}
else if(mag==6){size=52;}
else if(mag==7){size=78;}}else{if(mag==5){size=24;}
else if(mag==6){size=36;}
else if(mag==7){size=52;}
else if(mag==8){size=78;}}
return L.icon({iconUrl:url,iconRetinaUrl:url,iconSize:[size,size],iconAnchor:[size/2,size/2],popupAnchor:[0,-size/2],});}
cMap.prototype.openPopup=function(lat,lng,content){return L.popup().setLatLng([lat,lng]).setContent(content).openOn(this._map);}
cMap.prototype._mkMarkers=function(id,values){"use strict";if(!values){return;}
var theMap=this;var zIndex=100;values.forEach(function(value){if(!value){return;}
if(!value.options){return;}
var opt=value.options;zIndex++;var zIndexOffset=zIndex-opt.center[0];var marker=L.marker(opt.center,{icon:theMap._mkMarkerIcon(id,opt),zIndexOffset:zIndexOffset,}).bindPopup(theMap._strMarkerPopup(id,opt));theMap.updateOverlayLayers(id,marker);});}
cMap.prototype.mkMarkers=function(id,values){"use strict";var theMap=this;return new Promise(function(resolve,reject){theMap._mkMarkers(id,values);resolve(id);});}
cMap.prototype.mkIcons=function(opt){var theMap=this;var key=opt.key;var icons=opt.icons;var doShow=opt.doShow;if(typeof icons==='undefined'){return;}
this.mkMarkers(key,icons.values).then(function(id){theMap.show(id,doShow);$('#'+key+' input[type="checkbox"]').prop('checked',doShow);$('#'+key+' input[type="checkbox"]').triggerHandler('click');});}
cMap.prototype.mkLabelMarker=function(latlng,opt){var markerOpt={opacity:0.9};var size=17;markerOpt.icon=L.icon({iconUrl:opt.iconUrl,iconRetinaUrl:opt.iconRetinaUrl,iconSize:opt.iconSize,iconAnchor:opt.iconAnchor,popupAnchor:opt.popupAnchor,});var marker=this.Marker(latlng,markerOpt);return marker.addTo(this._map);}
cMap.prototype.Marker=function(latlng,opt){var marker=opt==null?L.marker(latlng):L.marker(latlng,opt);return marker.addTo(this._map);}
cMap.prototype.divIconMarker=function(latlng,opt){var divIcon=L.divIcon(opt);var marker=this.Marker(latlng,{icon:divIcon});return marker.addTo(this._map);}
cMap.prototype.Legend=function(title,content){var legend=L.control.legend();legend.setLabel(title);legend.setContent(content);legend.addTo(this._map);return legend;}
cMap.prototype.removeControl=function(control){control.remove();}
cMap.prototype.draggable=function(control){var draggable=new L.Draggable(control.getContainer());draggable.enable();return draggable;}
cMap.prototype.event_on=function(type,func){this._map.on(type,func);}
cMap.prototype.event_off=function(type,func){if('function'===typeof func){this._map.off(type,func);return;}
this._map.off(type);}
cMap.prototype.domEvent_on=function(target,type,func){L.DomEvent.on(target,type,func);}
cMap.prototype.polyline=function(latLngs,opt){return L.polyline(latLngs,opt).addTo(this._map);}
cMap.prototype._geojson_style=function(prop){var s={};for(name in prop){if(name.match(/^_/)&&!name.match(/_markerType/)){if(prop['_markerType']=='Circle'&&name=='_radius'){continue;}
s[name.substr(1)]=prop[name];}}
return s;}
cMap.prototype._popup_properties=function(prop){var s=''
for(name in prop){if(!name.match(/^_/)){s+=name+"："+prop[name]+"<br>";}}
return s;}
cMap.prototype._initGeoJSON=function(json){var theMap=this;var nx={_na:'name',_de:'description',_mt:'_markerType',_iu:'_iconUrl',_hs:'_hotSpot',_sc:'_scale'};return L.geoJson(json,{pointToLayer:function(feature,latlng){if(json._ss){var styles=json._ss;if(feature.properties._s!==null){var id=feature.properties._s;delete feature.properties._s;style=styles[id];for(var prop in style){feature.properties[prop]=style[prop];}}}
for(var prop in feature.properties){if(nx[prop]){var n=nx[prop];feature.properties[n]=feature.properties[prop];delete feature.properties[prop];}}
var s=theMap._geojson_style(feature.properties);if(feature.properties['_markerType']=='Icon'){var myIcon=new L.cGeoJsonIcon(s);return L.marker(latlng,{icon:myIcon});}
if(feature.properties['_markerType']=='DivIcon'){var myIcon=L.divIcon(s);return L.marker(latlng,{icon:myIcon});}
if(feature.properties['_markerType']=='Circle'){return L.circle(latlng,feature.properties['_radius'],s);}
if(feature.properties['_markerType']=='CircleMarker'){return L.circleMarker(latlng,s);}},style:function(feature){for(var prop in feature.properties){if(nx[prop]){var n=nx[prop];feature.properties[n]=feature.properties[prop];delete feature.properties[prop];}}
if(!feature.properties['_markerType']){var s=theMap._geojson_style(feature.properties);return s;}},onEachFeature:function(feature,layer){layer.bindPopup(theMap._popup_properties(feature.properties));}}).bindPopup(function(layer){var prop=layer.feature.properties;return'<b>'+prop.name+'</b><br />'+prop.description;});}
cMap.prototype.initGeoJSON=function(id,pane,doAdd){var theMap=this;if(!pane){pane='af_overlay';}
doAdd=!!doAdd;return fetch(Context.root+'fetch/'+id).then(function(response){return response.json();}).then(function(json){console_log(id+': done make json.');var layer=theMap._initGeoJSON(json);if(doAdd){layer.addTo(theMap._map);}
return layer;});}
cMap.prototype.initKML=function(id,pane,doAdd){var theMap=this;if(!pane){pane='af_overlay';}
doAdd=!!doAdd;return fetch(Context.root+'fetch/'+id).then(function(response){return response.text();}).then(function(kml){var o=new Blob([kml],{type:'text/xml;charset=UTF-8'});var url=URL.createObjectURL(o);var opt={async:true,pane:pane};id=id.split('.')[0]+'_ja';var info=map_infos[id];if(!!info){opt.icon={};if(!!info.icon){if(!!info.icon.size){opt.icon.size=info.icon.size;}}}
var layer=new L.KML(url,opt);if(doAdd){layer.addTo(theMap._map);}
map_infos[id]['layer']=layer;return layer;});}
cMap.prototype.initTileAsync=function(id,pane,doAdd){var theMap=this;return new Promise(function(resolve,reject){var layer=theMap.initTile(id,pane,doAdd);resolve(layer);})}
cMap.prototype.initTile=function(id,pane,doAdd){var theMap=this;if(!pane){pane='af_overlay';}
doAdd=!!doAdd;var idArray=id.split('.');id=idArray[0]+'_'+Context.lang;var info=map_infos[id];var uriNum=(idArray.length==2)?idArray[1]:0;if(!info){return null;}
var attribution=null;if(info.opt&&info.opt.attribution){attribution=info.opt.attribution;}
var layer=L.tileLayer(info.uris[uriNum],{id:id,attribution:attribution,pane:pane});if(doAdd){layer.addTo(this._map);this.updateSearchCond(idArray[0],true);}
map_infos[id]['layer']=layer;return layer;}
cMap.prototype.showSidebar=function(){$('#afmap-sidebar').show();}
cMap.prototype.hideSidebar=function(){$('#afmap-sidebar').hide();}
cMap.prototype.openSidebar=function(){this._sidebar.open();}
cMap.prototype.closeSidebar=function(){this._sidebar.close();}
function drawboxline(ll1,ll2,show){var theMap=map_infos.map;if(!ll1||!ll2){var bounds=theMap._map.getBounds();ll1=bounds.getNorthWest();ll2=bounds.getSouthEast();}
var oSearchArea=new cRectangle(ll1,ll2);theMap.drawSearchArea(oSearchArea,{show:show});}