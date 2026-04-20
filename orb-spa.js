(function(){
  if(window._orbLoaded) return;
  window._orbLoaded=true;

  /* Wrapper */
  var wrap=document.createElement('div');
  wrap.id='voiceai-orb-wrap';
  wrap.style.cssText='position:fixed;bottom:20px;right:20px;width:340px;height:420px;z-index:999999;touch-action:none;';

  /* Orb iframe */
  var iframe=document.createElement('iframe');
  iframe.id='voiceai-orb-iframe';
  iframe.src='https://cbus97.github.io/orb/orb-frame.html?t='+Date.now();
  iframe.setAttribute('allow','microphone;autoplay;camera');
  iframe.setAttribute('allowtransparency','true');
  iframe.setAttribute('frameborder','0');
  iframe.setAttribute('scrolling','no');
  iframe.style.cssText='width:340px;height:420px;border:none;background:transparent;display:block;position:absolute;top:0;left:0;pointer-events:all;';
  wrap.appendChild(iframe);
  document.body.appendChild(wrap);

  /* Position */
  var curLeft=null, curTop=null;
  function ensurePos(){
    if(curLeft!==null) return;
    var r=wrap.getBoundingClientRect();
    curLeft=Math.round(r.left); curTop=Math.round(r.top);
    wrap.style.right=''; wrap.style.bottom='';
    wrap.style.left=curLeft+'px'; wrap.style.top=curTop+'px';
  }
  setTimeout(ensurePos,300);

  /* Drag */
  var dragging=false, offsetX=0, offsetY=0;

  function startDrag(cx,cy){
    ensurePos();
    dragging=true;
    offsetX=cx-curLeft; offsetY=cy-curTop;
    iframe.style.pointerEvents='none';
    document.body.style.userSelect='none';
  }

  function moveDrag(cx,cy){
    if(!dragging) return;
    curLeft=Math.max(0,Math.min(window.innerWidth-340, cx-offsetX));
    curTop=Math.max(0,Math.min(window.innerHeight-420, cy-offsetY));
    wrap.style.left=curLeft+'px';
    wrap.style.top=curTop+'px';
  }

  function stopDrag(){
    if(!dragging) return;
    dragging=false;
    iframe.style.pointerEvents='all';
    document.body.style.userSelect='';
    document.body.style.cursor='';
    wrap.style.opacity='1';
  }

  /* Desktop - postMessage from canvas (mousedown on canvas) */
  window.addEventListener('message',function(e){
    if(!e.data) return;
    if(e.data.type==='orb-dragstart'){
      ensurePos();
      startDrag(curLeft+e.data.x, curTop+e.data.y);
      document.body.style.cursor='grabbing';
    }
    if(e.data.type==='orb-dragend') stopDrag();
    if(e.data.type==='orb-navigate'&&e.data.url) window.location.href=e.data.url;
  });

  document.addEventListener('mousemove',function(e){
    if(!dragging) return;
    moveDrag(e.clientX,e.clientY);
  });
  document.addEventListener('mouseup',stopDrag);

  /* Mobile - direct touch on wrapper OUTSIDE iframe
     We capture touch on the wrapper itself which sits behind iframe.
     When drag starts we flip pointerEvents so wrapper receives touch */
  var touchStartX=0, touchStartY=0, longPressTimer=null, touchActive=false;

  /* On mobile, add a thin border ring around iframe to catch touches */
  var isMobile=/Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  if(isMobile){
    /* Make wrapper slightly bigger than iframe so edges are touchable */
    wrap.style.padding='0';
    /* Listen on document for touches in orb area */
    document.addEventListener('touchstart',function(e){
      var t=e.touches[0];
      var r=wrap.getBoundingClientRect();
      /* Check if touch is within orb bounds */
      if(t.clientX<r.left||t.clientX>r.right||t.clientY<r.top||t.clientY>r.bottom) return;
      touchStartX=t.clientX; touchStartY=t.clientY; touchActive=true;
      longPressTimer=setTimeout(function(){
        if(!touchActive) return;
        if(navigator.vibrate) navigator.vibrate(30);
        startDrag(touchStartX,touchStartY);
        wrap.style.opacity='0.85';
      },500);
    },{passive:true});

    document.addEventListener('touchmove',function(e){
      if(!touchActive) return;
      var t=e.touches[0];
      var dx=Math.abs(t.clientX-touchStartX);
      var dy=Math.abs(t.clientY-touchStartY);
      if(longPressTimer&&(dx>15||dy>15)){
        clearTimeout(longPressTimer); longPressTimer=null;
      }
      if(dragging) moveDrag(t.clientX,t.clientY);
    },{passive:true});

    document.addEventListener('touchend',function(){
      touchActive=false;
      if(longPressTimer){ clearTimeout(longPressTimer); longPressTimer=null; }
      stopDrag();
    },{passive:true});
  }

  setInterval(function(){
    if(!dragging&&iframe.style.pointerEvents==='none') iframe.style.pointerEvents='all';
  },500);

})();
