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
  iframe.setAttribute('allowfullscreen','true');
  iframe.style.cssText='position:fixed;bottom:20px;right:20px;width:340px;height:420px;border:none;background:transparent;z-index:999999;pointer-events:all;';
  document.body.appendChild(iframe);

  /* ── Drag logic ── */
  var dragging=false,offsetX=0,offsetY=0,dragMoved=false;
  var dragStartTime=0;

  setTimeout(function(){
    var r=iframe.getBoundingClientRect();
    iframe.style.right='';iframe.style.bottom='';
    iframe.style.left=Math.round(r.left)+'px';
    iframe.style.top=Math.round(r.top)+'px';
  },300);

  window.addEventListener('message',function(e){
    if(!e.data) return;

    if(e.data.type==='orb-dragstart'){
      offsetX=e.data.x;offsetY=e.data.y;
      dragging=true;dragMoved=false;
      dragStartTime=Date.now();
      document.body.style.userSelect='none';
    }
    if(e.data.type==='orb-dragend') stopDrag();

    /* Navigate parent page on behalf of iframe */
    if(e.data.type==='orb-navigate'&&e.data.url){
      console.log('[Orb Parent] navigating to:',e.data.url);
      window.location.href=e.data.url;
    }
  });

  document.addEventListener('mousemove',function(e){
    if(!dragging) return;
    if(!dragMoved){
      var dx=Math.abs(e.clientX-(parseInt(iframe.style.left)||0)-offsetX);
      var dy=Math.abs(e.clientY-(parseInt(iframe.style.top)||0)-offsetY);
      if(dx<5&&dy<5) return;
      dragMoved=true;
      iframe.style.pointerEvents='none';
    }
    var l=Math.max(0,Math.min(window.innerWidth-340,e.clientX-offsetX));
    var t=Math.max(0,Math.min(window.innerHeight-100,e.clientY-offsetY));
    iframe.style.left=l+'px';iframe.style.top=t+'px';
  });

  document.addEventListener('touchmove',function(e){
    if(!dragging) return;
    var dx=Math.abs(e.touches[0].clientX-(parseInt(iframe.style.left)||0)-offsetX);
    var dy=Math.abs(e.touches[0].clientY-(parseInt(iframe.style.top)||0)-offsetY);
    /* Only drag if moved more than 10px — prevents accidental drag on tap */
    if(dx<10&&dy<10) return;
    dragMoved=true;
    iframe.style.pointerEvents='none';
    var l=Math.max(0,Math.min(window.innerWidth-340,e.touches[0].clientX-offsetX));
    var t=Math.max(0,Math.min(window.innerHeight-100,e.touches[0].clientY-offsetY));
    iframe.style.left=l+'px';iframe.style.top=t+'px';
  },{passive:true});

  function stopDrag(){
    /* If barely moved and quick tap — restore immediately so click registers */
    dragging=false;dragMoved=false;
    iframe.style.pointerEvents='all';
    document.body.style.userSelect='';
    document.body.style.cursor='';
  }

  document.addEventListener('mouseup',stopDrag);
  document.addEventListener('touchend',function(){
    stopDrag();
    /* Android fix: ensure iframe is always clickable after touch */
    setTimeout(function(){ iframe.style.pointerEvents='all'; },50);
  });
  document.addEventListener('mouseleave',stopDrag);

  /* Safety net — always restore pointer events when not dragging */
  setInterval(function(){
    if(!dragging&&iframe.style.pointerEvents==='none'){
      iframe.style.pointerEvents='all';
    }
  },200);

})();
