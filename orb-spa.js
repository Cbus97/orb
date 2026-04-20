(function(){
  if(window._orbLoaded) return;
  window._orbLoaded=true;

  /* Wrapper div */
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
  document.body.appendChild(wrap);

  /* ── Drag via postMessage from iframe (desktop) ── */
  var dragging=false, startX=0, startY=0, startLeft=0, startTop=0, dragMoved=false;

  function initPos(){
    var r=wrap.getBoundingClientRect();
    wrap.style.right=''; wrap.style.bottom='';
    wrap.style.left=Math.round(r.left)+'px';
    wrap.style.top=Math.round(r.top)+'px';
  }

  function startDrag(clientX, clientY){
    if(!wrap.style.left) initPos();
    dragging=true; dragMoved=false;
    startX=clientX; startY=clientY;
    startLeft=parseInt(wrap.style.left)||0;
    startTop=parseInt(wrap.style.top)||0;
    document.body.style.userSelect='none';
  }

  function moveDrag(clientX, clientY){
    if(!dragging) return;
    var dx=clientX-startX;
    var dy=clientY-startY;
    if(Math.abs(dx)>5||Math.abs(dy)>5){
      dragMoved=true;
      iframe.style.pointerEvents='none';
    }
    if(!dragMoved) return;
    var newLeft=Math.max(0,Math.min(window.innerWidth-340, startLeft+dx));
    var newTop=Math.max(0,Math.min(window.innerHeight-420, startTop+dy));
    wrap.style.left=newLeft+'px';
    wrap.style.top=newTop+'px';
  }

  function stopDrag(){
    dragging=false; dragMoved=false;
    iframe.style.pointerEvents='all';
    document.body.style.userSelect='';
    document.body.style.cursor='';
  }

  /* Desktop — postMessage from iframe canvas */
  window.addEventListener('message',function(e){
    if(!e.data) return;
    if(e.data.type==='orb-dragstart'){
      if(!wrap.style.left) initPos();
      startDrag(
        (parseInt(wrap.style.left)||0)+e.data.x,
        (parseInt(wrap.style.top)||0)+e.data.y
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

  /* Mobile — touch directly on wrapper */
  wrap.addEventListener('touchstart',function(e){
    startDrag(e.touches[0].clientX, e.touches[0].clientY);
  },{passive:true});

  document.addEventListener('touchmove',function(e){
    if(dragging&&dragMoved) e.preventDefault();
    moveDrag(e.touches[0].clientX, e.touches[0].clientY);
  },{passive:false});

  document.addEventListener('touchend',stopDrag,{passive:true});

  setTimeout(initPos, 300);

  setInterval(function(){
    if(!dragging&&iframe.style.pointerEvents==='none'){
      iframe.style.pointerEvents='all';
    }
  },200);

})();
