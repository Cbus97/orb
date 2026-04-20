(function(){
  if(window._orbLoaded) return;
  window._orbLoaded=true;

  /* Inject orb iframe */
  var iframe=document.createElement('iframe');
  iframe.id='voiceai-orb-iframe';
  iframe.src='https://cbus97.github.io/orb/orb-frame.html?v=8';
  iframe.setAttribute('allow','microphone');
  iframe.setAttribute('allowtransparency','true');
  iframe.setAttribute('frameborder','0');
  iframe.setAttribute('scrolling','no');
  iframe.style.cssText='position:fixed;bottom:20px;right:20px;width:340px;height:420px;border:none;background:transparent;z-index:999999;';
  document.body.appendChild(iframe);

  /* ── Drag logic ── */
  var dragging=false,offsetX=0,offsetY=0,dragMoved=false;

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
      document.body.style.userSelect='none';
      document.body.style.cursor='grabbing';
    }
    if(e.data.type==='orb-dragend') stopDrag();
  });

  document.addEventListener('mousemove',function(e){
    if(!dragging) return;
    if(!dragMoved){
      var dx=Math.abs(e.clientX-(parseInt(iframe.style.left)||0)-offsetX);
      var dy=Math.abs(e.clientY-(parseInt(iframe.style.top)||0)-offsetY);
      if(dx<3&&dy<3) return;
      dragMoved=true;
      iframe.style.pointerEvents='none';
    }
    var l=Math.max(0,Math.min(window.innerWidth-340,e.clientX-offsetX));
    var t=Math.max(0,Math.min(window.innerHeight-100,e.clientY-offsetY));
    iframe.style.left=l+'px';iframe.style.top=t+'px';
  });

  document.addEventListener('touchmove',function(e){
    if(!dragging) return;
    dragMoved=true;iframe.style.pointerEvents='none';
    var l=Math.max(0,Math.min(window.innerWidth-340,e.touches[0].clientX-offsetX));
    var t=Math.max(0,Math.min(window.innerHeight-100,e.touches[0].clientY-offsetY));
    iframe.style.left=l+'px';iframe.style.top=t+'px';
  },{passive:false});

  function stopDrag(){
    dragging=false;dragMoved=false;
    iframe.style.pointerEvents='all';
    document.body.style.userSelect='';
    document.body.style.cursor='';
  }

  document.addEventListener('mouseup',stopDrag);
  document.addEventListener('touchend',stopDrag);
  document.addEventListener('mouseleave',stopDrag);

  setInterval(function(){
    if(!dragging&&iframe.style.pointerEvents==='none') iframe.style.pointerEvents='all';
  },500);

  /* ── Single Page Navigation ── */
  function isSameDomain(url){
    try{ return new URL(url,window.location.href).hostname===window.location.hostname; }
    catch(e){ return false; }
  }

  function navigate(url){
    if(!isSameDomain(url)){ window.open(url,'_blank'); return; }
    document.body.style.opacity='0.7';
    document.body.style.transition='opacity 0.2s';
    fetch(url)
      .then(function(r){ return r.text(); })
      .then(function(html){
        var parser=new DOMParser();
        var doc=parser.parseFromString(html,'text/html');
        document.title=doc.title;
        var newContent=doc.querySelector('.page-wrapper')||doc.querySelector('#page-wrapper')||doc.querySelector('main')||doc.querySelector('#main');
        var current=document.querySelector('.page-wrapper')||document.querySelector('#page-wrapper')||document.querySelector('main')||document.querySelector('#main');
        if(newContent&&current){
          current.innerHTML=newContent.innerHTML;
        } else {
          var orb=document.getElementById('voiceai-orb-iframe');
          var newOrb=doc.getElementById('voiceai-orb-iframe');
          if(newOrb) newOrb.remove();
          document.body.innerHTML=doc.body.innerHTML;
          document.body.appendChild(orb);
        }
        window.history.pushState({},'',url);
        window.scrollTo(0,0);
        attachLinks();
        document.body.style.opacity='1';
        iframe.contentWindow&&iframe.contentWindow.postMessage({type:'page-changed',url:url},'*');
      })
      .catch(function(){ window.location.href=url; });
  }

  function attachLinks(){
    document.querySelectorAll('a[href]').forEach(function(a){
      if(a._orb) return;
      a._orb=true;
      a.addEventListener('click',function(e){
        var href=a.getAttribute('href');
        if(!href||href.startsWith('#')||href.startsWith('mailto:')||href.startsWith('tel:')||a.target==='_blank'||a.hasAttribute('download')) return;
        try{
          var full=new URL(href,window.location.href).href;
          if(!isSameDomain(full)) return;
          e.preventDefault();
          navigate(full);
        }catch(err){}
      });
    });
  }

  window.addEventListener('popstate',function(){ navigate(window.location.href); });

  /* Wait for DOM then attach */
  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',attachLinks);
  } else {
    attachLinks();
  }

  var observer=new MutationObserver(attachLinks);
  observer.observe(document.body,{childList:true,subtree:true});

})();
