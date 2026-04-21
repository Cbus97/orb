(function(){
  if(window._orbLoaded) return;
  window._orbLoaded=true;

  var isMobile=/Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  console.log('[Orb SPA] isMobile=',isMobile,'UA=',navigator.userAgent.slice(0,80));

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

  /* Navigate + debug all messages */
  /* ════════════════════════════════════════
     DESKTOP DRAG — postMessage from canvas
     ════════════════════════════════════════ */
  if(!isMobile){
    var dragging=false;

    /* Single message listener handles everything */
    window.addEventListener('message',function(e){
      if(!e.data) return;
      if(e.data.type) console.log('[Orb SPA] message received:',e.data.type);
      if(e.data.type==='orb-navigate'&&e.data.url){
        window.location.href=e.data.url;
      }
      /* Only start drag once — ignore duplicates */
      if(e.data.type==='orb-dragstart'&&!dragging){
        ensurePos();
        dragging=true;
        iframe.style.pointerEvents='none';
        document.body.style.cursor='grabbing';
        document.body.style.userSelect='none';
      }
    });

    var prevX=null, prevY=null;
    document.addEventListener('mousemove',function(e){
      if(!dragging) return;
      if(prevX===null){ prevX=e.clientX; prevY=e.clientY; return; }
      curLeft=Math.max(0,Math.min(window.innerWidth-340, curLeft+(e.clientX-prevX)));
      curTop=Math.max(0,Math.min(window.innerHeight-420, curTop+(e.clientY-prevY)));
      prevX=e.clientX; prevY=e.clientY;
      wrap.style.left=curLeft+'px';
      wrap.style.top=curTop+'px';
    });

    document.addEventListener('mouseup',function(){
      if(!dragging) return;
      dragging=false; prevX=null; prevY=null;
      setTimeout(function(){ iframe.style.pointerEvents='all'; },50);
      document.body.style.cursor='';
      document.body.style.userSelect='';
    });

    setInterval(function(){
      if(!dragging&&iframe.style.pointerEvents==='none') iframe.style.pointerEvents='all';
    },500);
  }

  /* ════════════════════════════════════════
     MOBILE DRAG — via postMessage from iframe
     orb-frame.html handles long press + touch
     and sends delta moves here
     ════════════════════════════════════════ */
  if(isMobile){
    var mDragging=false;

    window.addEventListener('message',function(e){
      if(!e.data) return;
      if(e.data.type==='orb-navigate'&&e.data.url){
        window.location.href=e.data.url;
      }
      if(e.data.type==='orb-mobile-dragstart'){
        console.log('[Orb SPA] mobile dragstart received');
        ensurePos();
        mDragging=true;
        wrap.style.opacity='0.85';
      }
      if(e.data.type==='orb-mobile-dragmove'&&mDragging){
        console.log('[Orb SPA] mobile dragmove dx:',e.data.dx,'dy:',e.data.dy);
        curLeft=Math.max(0,Math.min(window.innerWidth-340, curLeft+e.data.dx));
        curTop=Math.max(0,Math.min(window.innerHeight-420, curTop+e.data.dy));
        wrap.style.left=curLeft+'px';
        wrap.style.top=curTop+'px';
      }
      if(e.data.type==='orb-mobile-dragend'){
        console.log('[Orb SPA] mobile dragend received');
        mDragging=false;
        wrap.style.opacity='1';
      }
    });
  }

})();
