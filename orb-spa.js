(function(){
  if(window._orbLoaded) return;
  window._orbLoaded=true;

  /* Inject orb iframe */
  var iframe=document.createElement('iframe');
  iframe.id='voiceai-orb-iframe';
  iframe.src='https://cbus97.github.io/orb/orb-frame.html?t='+Date.now();
  iframe.setAttribute('allow','microphone;autoplay;camera');
  iframe.setAttribute('allowtransparency','true');
  iframe.setAttribute('frameborder','0');
  iframe.setAttribute('scrolling','no');
  iframe.style.cssText='position:fixed;bottom:20px;right:20px;width:340px;height:420px;border:none;background:transparent;z-index:999999;pointer-events:all;touch-action:none;';
  document.body.appendChild(iframe);

  /* ── Position init ── */
  var curLeft=null, curTop=null;

  setTimeout(function(){
    var r=iframe.getBoundingClientRect();
    iframe.style.right=''; iframe.style.bottom='';
    curLeft=Math.round(r.left);
    curTop=Math.round(r.top);
    iframe.style.left=curLeft+'px';
    iframe.style.top=curTop+'px';
  },300);

  /* ── Drag state ── */
  var dragging=false, offsetX=0, offsetY=0, dragMoved=false;

  function startDrag(clientX, clientY){
    dragging=true; dragMoved=false;
    offsetX=clientX-(curLeft||0);
    offsetY=clientY-(curTop||0);
    document.body.style.userSelect='none';
  }

  function moveDrag(clientX, clientY){
    if(!dragging) return;
    var dx=Math.abs(clientX-(curLeft||0)-offsetX);
    var dy=Math.abs(clientY-(curTop||0)-offsetY);
    if(dx>8||dy>8) dragMoved=true;
    if(!dragMoved) return;
    iframe.style.pointerEvents='none';
    curLeft=Math.max(0,Math.min(window.innerWidth-340,clientX-offsetX));
    curTop=Math.max(0,Math.min(window.innerHeight-100,clientY-offsetY));
    iframe.style.left=curLeft+'px';
    iframe.style.top=curTop+'px';
  }

  function stopDrag(){
    dragging=false;
    iframe.style.pointerEvents='all';
    document.body.style.userSelect='';
    document.body.style.cursor='';
  }

  /* ── Mouse drag (desktop) ── */
  window.addEventListener('message',function(e){
    if(!e.data) return;
    if(e.data.type==='orb-dragstart'){
      startDrag(
        (curLeft||0)+e.data.x,
        (curTop||0)+e.data.y
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

  /* ── Touch drag (mobile) ── */
  /* On mobile we detect long-press on the iframe to start drag */
  var touchStartX=0, touchStartY=0, longPressTimer=null;

  iframe.addEventListener('touchstart',function(e){
    touchStartX=e.touches[0].clientX;
    touchStartY=e.touches[0].clientY;
    /* Long press (600ms) triggers drag mode */
    longPressTimer=setTimeout(function(){
      startDrag(touchStartX, touchStartY);
      /* Visual feedback */
      iframe.style.opacity='0.8';
    },600);
  },{passive:true});

  iframe.addEventListener('touchmove',function(e){
    if(longPressTimer){
      var dx=Math.abs(e.touches[0].clientX-touchStartX);
      var dy=Math.abs(e.touches[0].clientY-touchStartY);
      /* Cancel long press if moved before it fires */
      if(dx>10||dy>10){ clearTimeout(longPressTimer); longPressTimer=null; }
    }
    if(dragging){
      e.preventDefault();
      moveDrag(e.touches[0].clientX, e.touches[0].clientY);
    }
  },{passive:false});

  iframe.addEventListener('touchend',function(){
    if(longPressTimer){ clearTimeout(longPressTimer); longPressTimer=null; }
    stopDrag();
    iframe.style.opacity='1';
  },{passive:true});

  /* Safety net */
  setInterval(function(){
    if(!dragging&&iframe.style.pointerEvents==='none'){
      iframe.style.pointerEvents='all';
    }
  },200);

})();
