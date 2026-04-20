(function(){
  if(window._orbLoaded) return;
  window._orbLoaded=true;

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
    offsetX=cx-curLeft;
    offsetY=cy-curTop;
    /* Don't disable pointer events here — only on actual move */
    document.body.style.userSelect='none';
  }

  var dragMoved=false;
  function moveDrag(cx,cy){
    if(!dragging) return;
    var newLeft=Math.max(0,Math.min(window.innerWidth-340,cx-offsetX));
    var newTop=Math.max(0,Math.min(window.innerHeight-420,cy-offsetY));
    if(!dragMoved&&(Math.abs(newLeft-curLeft)>8||Math.abs(newTop-curTop)>8)){
      dragMoved=true;
      iframe.style.pointerEvents='none';
    }
    if(!dragMoved) return;
    curLeft=newLeft; curTop=newTop;
    wrap.style.left=curLeft+'px';
    wrap.style.top=curTop+'px';
  }

  function stopDrag(){
    dragging=false; dragMoved=false;
    iframe.style.pointerEvents='all';
    document.body.style.userSelect='';
    document.body.style.cursor='';
    wrap.style.opacity='1';
  }

  /* ── DESKTOP: postMessage from canvas mousedown ── */
  window.addEventListener('message',function(e){
    if(!e.data) return;
    if(e.data.type==='orb-dragstart'){
      ensurePos();
      /* e.data.x/y is mousedown clientX/Y on the page */
      startDrag(e.data.x, e.data.y);
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

  /* ── MOBILE: long press anywhere on orb ── */
  var isMobile=/Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  if(isMobile){
    var lpTimer=null, lpStartX=0, lpStartY=0;

    document.addEventListener('touchstart',function(e){
      ensurePos();
      var t=e.touches[0];
      var r=wrap.getBoundingClientRect();
      if(t.clientX<r.left||t.clientX>r.right||t.clientY<r.top||t.clientY>r.bottom) return;
      lpStartX=t.clientX; lpStartY=t.clientY;
      lpTimer=setTimeout(function(){
        if(navigator.vibrate) navigator.vibrate(30);
        startDrag(lpStartX,lpStartY);
        wrap.style.opacity='0.85';
        /* Disable iframe pointer events so parent receives touchmove */
        iframe.style.pointerEvents='none';
        /* Tell iframe to ignore next touchend */
        iframe.contentWindow.postMessage({type:'orb-ignore-touch'},'*');
      },500);
    },{passive:true});

    document.addEventListener('touchmove',function(e){
      var t=e.touches[0];
      if(lpTimer){
        var dx=Math.abs(t.clientX-lpStartX);
        var dy=Math.abs(t.clientY-lpStartY);
        if(dx>15||dy>15){ clearTimeout(lpTimer); lpTimer=null; }
      }
      if(dragging){
        e.preventDefault();
        moveDrag(t.clientX,t.clientY);
      }
    },{passive:false});

    document.addEventListener('touchend',function(){
      if(lpTimer){ clearTimeout(lpTimer); lpTimer=null; }
      stopDrag();
    },{passive:true});
  }

  setInterval(function(){
    if(!dragging&&iframe.style.pointerEvents==='none') iframe.style.pointerEvents='all';
  },500);

})();
