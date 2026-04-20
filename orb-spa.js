(function(){
  if(window._orbLoaded) return;
  window._orbLoaded=true;

  var isMobile=/Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  /* Wrapper */
  var wrap=document.createElement('div');
  wrap.id='voiceai-orb-wrap';
  wrap.style.cssText='position:fixed;bottom:20px;right:20px;width:340px;height:420px;z-index:999999;';

  /* Orb iframe */
  var iframe=document.createElement('iframe');
  iframe.id='voiceai-orb-iframe';
  iframe.src='https://cbus97.github.io/orb/orb-frame.html?t='+Date.now();
  iframe.setAttribute('allow','microphone;autoplay;camera');
  iframe.setAttribute('allowtransparency','true');
  iframe.setAttribute('frameborder','0');
  iframe.setAttribute('scrolling','no');
  iframe.style.cssText='width:340px;height:420px;border:none;background:transparent;display:block;position:absolute;top:0;left:0;';

  wrap.appendChild(iframe);

  /* Mobile only — transparent circular drag zone in center of orb */
  var dragZone=null;
  if(isMobile){
    dragZone=document.createElement('div');
    /* Position over center of orb canvas (150,150 center, 72px radius) */
    dragZone.style.cssText=[
      'position:absolute',
      'top:78px',       /* 150 - 72 = 78 */
      'left:84px',      /* (340-172)/2 = 84 */
      'width:172px',    /* 72*2+28 for some padding */
      'height:172px',
      'border-radius:50%',
      'background:transparent',
      'z-index:1',
      'touch-action:none',
      'cursor:grab',
    ].join(';');
    wrap.appendChild(dragZone);
  }

  document.body.appendChild(wrap);

  /* ── Drag state ── */
  var dragging=false, startX=0, startY=0, startLeft=0, startTop=0, dragMoved=false;

  function getPos(){
    var r=wrap.getBoundingClientRect();
    return {left:r.left,top:r.top};
  }

  function startDrag(clientX,clientY){
    dragging=true; dragMoved=false;
    startX=clientX; startY=clientY;
    var p=getPos();
    startLeft=p.left; startTop=p.top;
    wrap.style.right=''; wrap.style.bottom='';
    wrap.style.left=startLeft+'px';
    wrap.style.top=startTop+'px';
    iframe.style.pointerEvents='none';
    document.body.style.userSelect='none';
  }

  function moveDrag(clientX,clientY){
    if(!dragging) return;
    var dx=clientX-startX, dy=clientY-startY;
    if(Math.abs(dx)>5||Math.abs(dy)>5) dragMoved=true;
    if(!dragMoved) return;
    var l=Math.max(0,Math.min(window.innerWidth-340,startLeft+dx));
    var t=Math.max(0,Math.min(window.innerHeight-420,startTop+dy));
    wrap.style.left=l+'px';
    wrap.style.top=t+'px';
  }

  function stopDrag(){
    dragging=false; dragMoved=false;
    iframe.style.pointerEvents='all';
    document.body.style.userSelect='';
    document.body.style.cursor='';
    if(dragZone) dragZone.style.cursor='grab';
  }

  /* ── Desktop: postMessage from canvas ── */
  window.addEventListener('message',function(e){
    if(!e.data) return;
    if(e.data.type==='orb-dragstart'){
      startDrag(
        (parseInt(wrap.style.left)||startLeft||0)+e.data.x,
        (parseInt(wrap.style.top)||startTop||0)+e.data.y
      );
      document.body.style.cursor='grabbing';
    }
    if(e.data.type==='orb-dragend') stopDrag();
    if(e.data.type==='orb-navigate'&&e.data.url){
      window.location.href=e.data.url;
    }
  });

  document.addEventListener('mousemove',function(e){ moveDrag(e.clientX,e.clientY); });
  document.addEventListener('mouseup',stopDrag);
  document.addEventListener('mouseleave',stopDrag);

  /* ── Mobile: touch on transparent drag zone ── */
  if(dragZone){
    dragZone.addEventListener('touchstart',function(e){
      startDrag(e.touches[0].clientX,e.touches[0].clientY);
      e.preventDefault();
    },{passive:false});
  }

  document.addEventListener('touchmove',function(e){
    if(dragging&&dragMoved) e.preventDefault();
    moveDrag(e.touches[0].clientX,e.touches[0].clientY);
  },{passive:false});

  document.addEventListener('touchend',stopDrag,{passive:true});

  setTimeout(function(){
    var r=wrap.getBoundingClientRect();
    wrap.style.right=''; wrap.style.bottom='';
    wrap.style.left=Math.round(r.left)+'px';
    wrap.style.top=Math.round(r.top)+'px';
  },300);

  setInterval(function(){
    if(!dragging&&iframe.style.pointerEvents==='none'){
      iframe.style.pointerEvents='all';
    }
  },200);

})();
