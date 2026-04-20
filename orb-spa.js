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
  iframe.style.cssText='width:340px;height:420px;border:none;background:transparent;display:block;position:absolute;top:0;left:0;z-index:1;';

  wrap.appendChild(iframe);

  /* Mobile only — transparent circular drag zone over orb center */
  var dragZone=null;
  if(isMobile){
    dragZone=document.createElement('div');
    dragZone.style.cssText=[
      'position:absolute',
      'top:78px',
      'left:84px',
      'width:172px',
      'height:172px',
      'border-radius:50%',
      'background:transparent',
      'z-index:2',           /* above iframe */
      'touch-action:none',
      'cursor:grab',
      'pointer-events:all',
    ].join(';');
    wrap.appendChild(dragZone);
  }

  document.body.appendChild(wrap);

  /* ── Position tracking ── */
  var curLeft=null, curTop=null;

  function ensurePos(){
    if(curLeft===null){
      var r=wrap.getBoundingClientRect();
      curLeft=Math.round(r.left);
      curTop=Math.round(r.top);
      wrap.style.right=''; wrap.style.bottom='';
      wrap.style.left=curLeft+'px';
      wrap.style.top=curTop+'px';
    }
  }

  setTimeout(ensurePos, 300);

  /* ── Drag state ── */
  var dragging=false, startX=0, startY=0, startLeft=0, startTop=0, dragMoved=false;

  function startDrag(clientX,clientY){
    ensurePos();
    dragging=true; dragMoved=false;
    startX=clientX; startY=clientY;
    startLeft=curLeft; startTop=curTop;
    iframe.style.pointerEvents='none';
    document.body.style.userSelect='none';
  }

  function moveDrag(clientX,clientY){
    if(!dragging) return;
    var dx=clientX-startX, dy=clientY-startY;
    if(Math.abs(dx)>5||Math.abs(dy)>5) dragMoved=true;
    if(!dragMoved) return;
    curLeft=Math.max(0,Math.min(window.innerWidth-340,startLeft+dx));
    curTop=Math.max(0,Math.min(window.innerHeight-420,startTop+dy));
    wrap.style.left=curLeft+'px';
    wrap.style.top=curTop+'px';
  }

  function stopDrag(){
    if(!dragging) return;
    dragging=false;
    /* If barely moved — restore immediately so click reaches iframe */
    if(!dragMoved){
      iframe.style.pointerEvents='all';
    } else {
      setTimeout(function(){ iframe.style.pointerEvents='all'; },50);
    }
    dragMoved=false;
    document.body.style.userSelect='';
    document.body.style.cursor='';
    if(dragZone) dragZone.style.cursor='grab';
  }

  /* ── Desktop: postMessage from canvas ── */
  window.addEventListener('message',function(e){
    if(!e.data) return;
    if(e.data.type==='orb-dragstart'){
      ensurePos();
      /* e.data.x/y is position within iframe, add iframe offset */
      startDrag(curLeft+e.data.x, curTop+e.data.y);
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
      /* Don't preventDefault here — allows tap to pass through if not dragging */
    },{passive:true});

    dragZone.addEventListener('touchend',function(e){
      if(!dragMoved){
        /* Tap — forward to iframe by temporarily hiding drag zone */
        dragZone.style.pointerEvents='none';
        setTimeout(function(){ dragZone.style.pointerEvents='all'; },300);
      }
      stopDrag();
    },{passive:true});
  }

  document.addEventListener('touchmove',function(e){
    if(dragging&&dragMoved) e.preventDefault();
    moveDrag(e.touches[0].clientX,e.touches[0].clientY);
  },{passive:false});

  setInterval(function(){
    if(!dragging&&iframe.style.pointerEvents==='none'){
      iframe.style.pointerEvents='all';
    }
  },300);

})();
