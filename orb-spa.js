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
  iframe.style.cssText='width:340px;height:420px;border:none;background:transparent;display:block;position:absolute;top:0;left:0;pointer-events:all;';
  wrap.appendChild(iframe);
  document.body.appendChild(wrap);

  /* Shared position tracking */
  var curLeft=null, curTop=null;
  function ensurePos(){
    if(curLeft!==null) return;
    var r=wrap.getBoundingClientRect();
    curLeft=Math.round(r.left); curTop=Math.round(r.top);
    wrap.style.right=''; wrap.style.bottom='';
    wrap.style.left=curLeft+'px'; wrap.style.top=curTop+'px';
  }
  setTimeout(ensurePos,300);

  function moveWrap(cx,cy,ox,oy){
    var newLeft=cx-ox;
    var newTop=cy-oy;
    /* Use screen dimensions as fallback if innerWidth seems wrong */
    var maxW=Math.max(window.innerWidth, screen.width, document.documentElement.clientWidth)-340;
    var maxH=Math.max(window.innerHeight, screen.height, document.documentElement.clientHeight)-420;
    curLeft=Math.max(0,Math.min(maxW,newLeft));
    curTop=Math.max(0,Math.min(maxH,newTop));
    wrap.style.left=curLeft+'px';
    wrap.style.top=curTop+'px';
  }

  /* Navigate */
  window.addEventListener('message',function(e){
    if(e.data&&e.data.type==='orb-navigate'&&e.data.url){
      window.location.href=e.data.url;
    }
  });

  /* ════════════════════════════════════════
     DESKTOP DRAG — postMessage from canvas
     Only fires after 5px mouse movement
     Never disables iframe pointer events
     ════════════════════════════════════════ */
  if(!isMobile){
    var dragging=false, offsetX=0, offsetY=0, dragMoved=false;

    window.addEventListener('message',function(e){
      if(!e.data) return;
      if(e.data.type==='orb-dragstart'){
        ensurePos();
        dragging=true; dragMoved=false;
        offsetX=e.data.x-curLeft;
        offsetY=e.data.y-curTop;
        document.body.style.cursor='grabbing';
        document.body.style.userSelect='none';
      }
      if(e.data.type==='orb-dragend'){
        dragging=false; dragMoved=false;
        document.body.style.cursor='';
        document.body.style.userSelect='';
      }
    });

    document.addEventListener('mousemove',function(e){
      if(!dragging) return;
      dragMoved=true;
      moveWrap(e.clientX,e.clientY,offsetX,offsetY);
    });

    document.addEventListener('mouseup',function(){
      dragging=false; dragMoved=false;
      document.body.style.cursor='';
      document.body.style.userSelect='';
    });
  }

  /* ════════════════════════════════════════
     MOBILE DRAG — long press 500ms
     iframe pointer events disabled during drag
     so parent receives touchmove events
     ════════════════════════════════════════ */
  if(isMobile){
    var mDragging=false, mOffsetX=0, mOffsetY=0;
    var lpTimer=null, lpStartX=0, lpStartY=0;

    document.addEventListener('touchstart',function(e){
      ensurePos();
      var t=e.touches[0];
      var r=wrap.getBoundingClientRect();
      if(t.clientX<r.left||t.clientX>r.right||t.clientY<r.top||t.clientY>r.bottom) return;
      lpStartX=t.clientX; lpStartY=t.clientY;
      lpTimer=setTimeout(function(){
        mDragging=true;
        mOffsetX=lpStartX-curLeft;
        mOffsetY=lpStartY-curTop;
        iframe.style.pointerEvents='none';
        wrap.style.opacity='0.85';
        if(navigator.vibrate) navigator.vibrate(30);
        iframe.contentWindow.postMessage({type:'orb-ignore-touch'},'*');
      },500);
    },{passive:true});

    document.addEventListener('touchmove',function(e){
      if(lpTimer){
        var dx=Math.abs(e.touches[0].clientX-lpStartX);
        var dy=Math.abs(e.touches[0].clientY-lpStartY);
        if(dx>15||dy>15){ clearTimeout(lpTimer); lpTimer=null; }
      }
      if(mDragging){
        e.preventDefault();
        moveWrap(e.touches[0].clientX,e.touches[0].clientY,mOffsetX,mOffsetY);
      }
    },{passive:false});

    document.addEventListener('touchend',function(){
      if(lpTimer){ clearTimeout(lpTimer); lpTimer=null; }
      if(mDragging){
        mDragging=false;
        iframe.style.pointerEvents='all';
        wrap.style.opacity='1';
      }
    },{passive:true});

    /* Safety net */
    setInterval(function(){
      if(!mDragging&&iframe.style.pointerEvents==='none'){
        iframe.style.pointerEvents='all';
      }
    },1000);
  }

})();
