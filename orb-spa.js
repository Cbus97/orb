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

  /* Mobile only — thin ring around edge of orb as drag zone
     Center of orb (where user taps to talk) stays clear */
  var dragZone=null;
  if(isMobile){
    dragZone=document.createElement('div');
    /* Ring: full orb size but with transparent center using box-shadow */
    dragZone.style.cssText=[
      'position:absolute',
      'top:50px',           /* top of orb area */
      'left:20px',          /* left edge */
      'width:300px',
      'height:300px',
      'border-radius:50%',
      'background:transparent',
      /* Invisible ring - only outer 40px is active, center passes through */
      'box-shadow:inset 0 0 0 110px transparent',
      'z-index:2',
      'touch-action:none',
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
    document.body.style.userSelect='none';
    /* Don't disable pointer events yet — wait until actual movement */
  }

  function moveDrag(clientX,clientY){
    if(!dragging) return;
    var dx=clientX-startX, dy=clientY-startY;
    if(Math.abs(dx)>8||Math.abs(dy)>8){
      if(!dragMoved){
        dragMoved=true;
        /* Only NOW disable iframe pointer events */
        iframe.style.pointerEvents='none';
        document.body.style.cursor='grabbing';
      }
    }
    if(!dragMoved) return;
    curLeft=Math.max(0,Math.min(window.innerWidth-340,startLeft+dx));
    curTop=Math.max(0,Math.min(window.innerHeight-420,startTop+dy));
    wrap.style.left=curLeft+'px';
    wrap.style.top=curTop+'px';
  }

  function stopDrag(){
    if(!dragging) return;
    dragging=false;
    dragMoved=false;
    /* Always restore pointer events on stop */
    iframe.style.pointerEvents='all';
    document.body.style.userSelect='';
    document.body.style.cursor='';
  }

  /* ── Desktop: postMessage from canvas ── */
  window.addEventListener('message',function(e){
    if(!e.data) return;
    if(e.data.type==='orb-dragstart'){
      ensurePos();
      startDrag(curLeft+e.data.x, curTop+e.data.y);
    }
    if(e.data.type==='orb-dragend') stopDrag();
    if(e.data.type==='orb-navigate'&&e.data.url){
      window.location.href=e.data.url;
    }
  });

  document.addEventListener('mousemove',function(e){ moveDrag(e.clientX,e.clientY); });
  document.addEventListener('mouseup',stopDrag);
  document.addEventListener('mouseleave',stopDrag);

  /* ── Mobile: touch on ring drag zone ── */
  if(dragZone){
    dragZone.addEventListener('touchstart',function(e){
      startDrag(e.touches[0].clientX,e.touches[0].clientY);
    },{passive:true});

    dragZone.addEventListener('touchend',function(){
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
