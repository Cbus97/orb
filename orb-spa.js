(function(){
  if(window._orbLoaded) return;
  window._orbLoaded=true;

  var isMobile=/Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  /* Wrapper */
  var wrap=document.createElement('div');
  wrap.id='voiceai-orb-wrap';
  wrap.style.cssText='position:fixed;bottom:20px;right:20px;width:340px;height:420px;z-index:999999;';

  /* Orb iframe — always fully clickable */
  var iframe=document.createElement('iframe');
  iframe.id='voiceai-orb-iframe';
  iframe.src='https://cbus97.github.io/orb/orb-frame.html?t='+Date.now();
  iframe.setAttribute('allow','microphone;autoplay;camera');
  iframe.setAttribute('allowtransparency','true');
  iframe.setAttribute('frameborder','0');
  iframe.setAttribute('scrolling','no');
  iframe.style.cssText='width:340px;height:420px;border:none;background:transparent;display:block;position:absolute;top:0;left:0;z-index:1;pointer-events:all;';

  wrap.appendChild(iframe);
  document.body.appendChild(wrap);

  /* Position tracking */
  var curLeft=null, curTop=null;
  function ensurePos(){
    if(curLeft===null){
      var r=wrap.getBoundingClientRect();
      curLeft=Math.round(r.left); curTop=Math.round(r.top);
      wrap.style.right=''; wrap.style.bottom='';
      wrap.style.left=curLeft+'px'; wrap.style.top=curTop+'px';
    }
  }
  setTimeout(ensurePos,300);

  /* Drag state */
  var dragging=false, offsetX=0, offsetY=0, dragMoved=false;

  function doMove(clientX,clientY){
    if(!dragging) return;
    dragMoved=true;
    curLeft=Math.max(0,Math.min(window.innerWidth-340,clientX-offsetX));
    curTop=Math.max(0,Math.min(window.innerHeight-420,clientY-offsetY));
    wrap.style.left=curLeft+'px'; wrap.style.top=curTop+'px';
  }

  function doStop(){
    dragging=false; dragMoved=false;
    document.body.style.userSelect='';
    document.body.style.cursor='';
  }

  /* DESKTOP: drag via postMessage from canvas
     iframe stays fully interactive — pointer events never disabled */
  window.addEventListener('message',function(e){
    if(!e.data) return;
    if(e.data.type==='orb-dragstart'){
      ensurePos();
      dragging=true; dragMoved=false;
      /* For mobile: e.data.x/y is page clientX/Y from touchstart
         offsetX = how far touch is from wrap left edge */
      offsetX=e.data.x-curLeft;
      offsetY=e.data.y-curTop;
      document.body.style.userSelect='none';
      document.body.style.cursor='grabbing';
      wrap.style.opacity='0.85';
    }
    if(e.data.type==='orb-dragend'){
      doStop();
      wrap.style.opacity='1';
    }
    if(e.data.type==='orb-touchmove') doMove(e.data.x, e.data.y);
    if(e.data.type==='orb-navigate'&&e.data.url) window.location.href=e.data.url;
  });

  document.addEventListener('mousemove',function(e){ doMove(e.clientX,e.clientY); });
  document.addEventListener('mouseup',doStop);

  /* MOBILE: drag via long press on wrapper background
     Short tap passes straight through to iframe */
  if(isMobile){
    var touchTimer=null, touchStartX=0, touchStartY=0;

    wrap.addEventListener('touchstart',function(e){
      touchStartX=e.touches[0].clientX;
      touchStartY=e.touches[0].clientY;
      /* Long press 500ms = drag mode */
      touchTimer=setTimeout(function(){
        ensurePos();
        dragging=true; dragMoved=false;
        /* Same offset approach as desktop */
        startX=touchStartX-curLeft;
        startY=touchStartY-curTop;
        startLeft=curLeft; startTop=curTop;
        wrap.style.opacity='0.85';
        /* Haptic feedback if available */
        if(navigator.vibrate) navigator.vibrate(30);
      },400);
    },{passive:true});

    wrap.addEventListener('touchmove',function(e){
      if(touchTimer){
        var dx=Math.abs(e.touches[0].clientX-touchStartX);
        var dy=Math.abs(e.touches[0].clientY-touchStartY);
        /* Only cancel long press if moved significantly */
        if(dx>25||dy>25){ clearTimeout(touchTimer); touchTimer=null; }
      }
      doMove(e.touches[0].clientX,e.touches[0].clientY);
    },{passive:true});

    wrap.addEventListener('touchend',function(){
      if(touchTimer){ clearTimeout(touchTimer); touchTimer=null; }
      doStop();
      wrap.style.opacity='1';
    },{passive:true});
  }

})();
