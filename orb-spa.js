(function(){
  if(window._orbLoaded) return;
  window._orbLoaded=true;

  var isMobile=/Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  /* Wrapper div that we can drag */
  var wrap=document.createElement('div');
  wrap.id='voiceai-orb-wrap';
  wrap.style.cssText='position:fixed;bottom:20px;right:20px;width:340px;height:'+(isMobile?'440':'420')+'px;z-index:999999;';

  /* Drag handle — only visible on mobile, matches orb style */
  var handle=document.createElement('div');
  if(isMobile){
    handle.style.cssText=[
      'width:100%',
      'height:20px',
      'background:transparent',
      'cursor:grab',
      'display:flex',
      'align-items:center',
      'justify-content:center',
      'touch-action:none',
      'user-select:none',
    ].join(';');
    /* Small subtle drag indicator dots matching orb purple */
    handle.innerHTML='<div style="display:flex;gap:4px;opacity:0.5;">'
      +'<div style="width:4px;height:4px;border-radius:50%;background:#7F77DD;"></div>'
      +'<div style="width:4px;height:4px;border-radius:50%;background:#7F77DD;"></div>'
      +'<div style="width:4px;height:4px;border-radius:50%;background:#7F77DD;"></div>'
      +'<div style="width:4px;height:4px;border-radius:50%;background:#7F77DD;"></div>'
      +'<div style="width:4px;height:4px;border-radius:50%;background:#7F77DD;"></div>'
      +'</div>';
  } else {
    handle.style.cssText='width:100%;height:0px;';
  }

  /* Orb iframe */
  var iframe=document.createElement('iframe');
  iframe.id='voiceai-orb-iframe';
  iframe.src='https://cbus97.github.io/orb/orb-frame.html?t='+Date.now();
  iframe.setAttribute('allow','microphone;autoplay;camera');
  iframe.setAttribute('allowtransparency','true');
  iframe.setAttribute('frameborder','0');
  iframe.setAttribute('scrolling','no');
  iframe.style.cssText='width:340px;height:420px;border:none;background:transparent;display:block;';

  wrap.appendChild(handle);
  wrap.appendChild(iframe);
  document.body.appendChild(wrap);

  /* ── Drag logic ── */
  var dragging=false, startX=0, startY=0, startLeft=0, startTop=0;

  function getWrapPos(){
    var r=wrap.getBoundingClientRect();
    return {left:r.left, top:r.top};
  }

  function startDrag(clientX, clientY){
    dragging=true;
    startX=clientX; startY=clientY;
    var pos=getWrapPos();
    startLeft=pos.left; startTop=pos.top;
    wrap.style.right=''; wrap.style.bottom='';
    wrap.style.left=startLeft+'px';
    wrap.style.top=startTop+'px';
    handle.style.cursor='grabbing';
    iframe.style.pointerEvents='none';
    document.body.style.userSelect='none';
  }

  function moveDrag(clientX, clientY){
    if(!dragging) return;
    var newLeft=startLeft+(clientX-startX);
    var newTop=startTop+(clientY-startY);
    newLeft=Math.max(0,Math.min(window.innerWidth-340,newLeft));
    newTop=Math.max(0,Math.min(window.innerHeight-(isMobile?440:420),newTop));
    wrap.style.left=newLeft+'px';
    wrap.style.top=newTop+'px';
  }

  function stopDrag(){
    dragging=false;
    handle.style.cursor='grab';
    iframe.style.pointerEvents='all';
    document.body.style.userSelect='';
  }

  /* Mouse (desktop) */
  handle.addEventListener('mousedown',function(e){
    startDrag(e.clientX,e.clientY);
    e.preventDefault();
  });
  document.addEventListener('mousemove',function(e){ moveDrag(e.clientX,e.clientY); });
  document.addEventListener('mouseup',stopDrag);

  /* Touch (mobile) */
  handle.addEventListener('touchstart',function(e){
    startDrag(e.touches[0].clientX,e.touches[0].clientY);
    e.preventDefault();
  },{passive:false});
  document.addEventListener('touchmove',function(e){
    if(dragging){
      moveDrag(e.touches[0].clientX,e.touches[0].clientY);
      e.preventDefault();
    }
  },{passive:false});
  document.addEventListener('touchend',stopDrag);

  /* Navigate */
  window.addEventListener('message',function(e){
    if(e.data&&e.data.type==='orb-navigate'&&e.data.url){
      window.location.href=e.data.url;
    }
  });

  setInterval(function(){
    if(!dragging&&iframe.style.pointerEvents==='none'){
      iframe.style.pointerEvents='all';
    }
  },200);

})();
