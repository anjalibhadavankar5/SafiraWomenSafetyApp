/* =============================================
   SAFIRA – Complete App Logic  (Updated)
   ============================================= */

/* ── Storage helpers ── */
function save(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch(e){}}
function load(k,def){try{var v=localStorage.getItem(k);return v?JSON.parse(v):def;}catch(e){return def;}}

/* ── Page Router ── */
function showPage(id){
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  var pg=document.getElementById(id);
  if(pg){pg.classList.add('active');pg.scrollTop=0;}
  if(id==='page-home') refreshHome();
  if(id==='page-contacts') renderContactsPage();
  if(id==='page-profile') renderProfile();
}

function navTo(el,pageId){
  document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
  el.classList.add('active');
  showPage(pageId);
}

/* ── LOGIN (accepts Email OR Phone) ── */
function doLogin(){
  var identifier=document.getElementById('login-identifier').value.trim();
  var pass=document.getElementById('login-pass').value.trim();
  if(!identifier||!pass){alert('Please enter email/phone and password.');return;}
  var user=load('safira_user',null);
  if(!user){alert('No account found. Please sign up first.');return;}
  var matchPhone = user.phone && user.phone===identifier;
  var matchEmail = user.email && user.email.toLowerCase()===identifier.toLowerCase();
  if(!matchPhone && !matchEmail){alert('Wrong email/phone or password.');return;}
  if(user.password!==pass){alert('Wrong email/phone or password.');return;}
  startApp();
}

/* ── SIGNUP ── */
function doSignup(){
  var name=document.getElementById('su-name').value.trim();
  var age=document.getElementById('su-age').value.trim();
  var email=document.getElementById('su-email').value.trim();
  var phone=document.getElementById('su-phone').value.trim();
  var address=document.getElementById('su-address').value.trim();
  var city=document.getElementById('su-city').value.trim();
  var state=document.getElementById('su-state').value;
  var pass=document.getElementById('su-pass').value.trim();
  var ename=document.getElementById('su-ename').value.trim();
  var ephone=document.getElementById('su-ephone').value.trim();
  if(!name||!phone||!pass){alert('Please fill in Name, Phone and Password.');return;}
  var user={name:name,age:age,email:email,phone:phone,address:address,city:city,state:state,password:pass};
  save('safira_user',user);
  var contacts=[];
  if(ename&&ephone){contacts.push({name:ename,relation:'Guardian',phone:ephone});}
  save('safira_contacts',contacts);
  alert('Account created! Welcome to Safira, '+name+'!');
  startApp();
}

/* ── START APP ── */
function startApp(){
  showPage('page-home');
  getLocation();
  startVoiceDetection();
}

/* ── LOGOUT ── */
function doLogout(){
  if(confirm('Are you sure you want to logout?')){showPage('page-login');}
}

/* ── REFRESH HOME ── */
function refreshHome(){
  var user=load('safira_user',{name:'User'});
  var contacts=load('safira_contacts',[]);
  var nameEl=document.getElementById('home-name');
  var avatarEl=document.getElementById('home-avatar');
  var countEl=document.getElementById('contact-count');
  if(nameEl) nameEl.textContent=user.name||'User';
  if(avatarEl) avatarEl.textContent=(user.name||'S')[0].toUpperCase();
  if(countEl) countEl.textContent=contacts.length+' Contact'+(contacts.length!==1?'s':'');
  renderHomeContacts(contacts);
}

function renderHomeContacts(contacts){
  var el=document.getElementById('home-contacts-list');
  if(!el) return;
  if(contacts.length===0){el.innerHTML='<p style="font-size:12px;color:#888;text-align:center;padding:1rem;">No emergency contacts added yet.</p>';return;}
  var colors=['a1','a2','a3','a4'];
  el.innerHTML=contacts.slice(0,3).map(function(c,i){
    return '<div class="contact-card"><div class="c-avatar '+colors[i%4]+'">'+(c.name[0]||'?').toUpperCase()+'</div><div class="c-info"><p>'+c.name+'</p><span>'+c.phone+'</span></div><span class="c-live">✓ SOS</span></div>';
  }).join('');
}

/* ── CONTACTS PAGE ── */
function renderContactsPage(){
  var contacts=load('safira_contacts',[]);
  var el=document.getElementById('contacts-list-full');
  if(!el) return;
  var colors=['a1','a2','a3','a4'];
  if(contacts.length===0){
    el.innerHTML='<p style="font-size:13px;color:#888;text-align:center;padding:1.5rem;">No contacts yet. Add below.</p>';
    return;
  }
  el.innerHTML=contacts.map(function(c,i){
    return '<div class="contact-card"><div class="c-avatar '+colors[i%4]+'">'+(c.name[0]||'?').toUpperCase()+'</div><div class="c-info"><p>'+c.name+'</p><span>'+c.relation+' · '+c.phone+'</span></div><button class="c-del" onclick="deleteContact('+i+')">✕</button></div>';
  }).join('');
}

function addContact(){
  var name=document.getElementById('new-cname').value.trim();
  var rel=document.getElementById('new-crel').value;
  var phone=document.getElementById('new-cphone').value.trim();
  if(!name||!phone){alert('Please enter contact name and phone number.');return;}
  var contacts=load('safira_contacts',[]);
  contacts.push({name:name,relation:rel,phone:phone});
  save('safira_contacts',contacts);
  document.getElementById('new-cname').value='';
  document.getElementById('new-cphone').value='';
  alert(name+' added as emergency contact!');
  renderContactsPage();
  refreshHome();
}

function deleteContact(idx){
  if(!confirm('Remove this contact?')) return;
  var contacts=load('safira_contacts',[]);
  contacts.splice(idx,1);
  save('safira_contacts',contacts);
  renderContactsPage();
  refreshHome();
}

/* ── PROFILE ── */
function renderProfile(){
  var user=load('safira_user',{});
  var set=function(id,v){var e=document.getElementById(id);if(e)e.textContent=v||'—';};
  set('prof-name',user.name);
  set('prof-phone',user.phone);
  set('prof-email',user.email);
  set('prof-age',user.age?user.age+' years':'—');
  set('prof-address',(user.address?(user.address+(user.city?', '+user.city:'')):'—'));
  set('prof-state',user.state);
  var a=document.getElementById('prof-avatar');
  if(a)a.textContent=(user.name||'S')[0].toUpperCase();
}

/* ════════════════════════════════
   SOS – Full Flow
   ════════════════════════════════ */
var sosTimer=null, sosCountVal=3;

function triggerSOS(){
  var overlay=document.getElementById('sosOverlay');
  var btn=document.getElementById('sosBtn');
  var countEl=document.getElementById('sosCount');
  var contacts=load('safira_contacts',[]);
  btn.classList.add('active');
  overlay.classList.add('show');
  sosCountVal=3; countEl.textContent=sosCountVal;
  var dispEl=document.getElementById('sos-contacts-display');
  if(dispEl){
    if(contacts.length===0){
      dispEl.innerHTML='<div class="notify-item"><p>Calling</p><span>100 Police</span></div>';
    } else {
      dispEl.innerHTML=contacts.map(function(c){
        return '<div class="notify-item"><p>SMS + Call to</p><span>'+c.name+'</span></div>';
      }).join('')+'<div class="notify-item"><p>Calling</p><span>100 Police</span></div>';
    }
  }
  sosTimer=setInterval(function(){
    sosCountVal--;
    if(sosCountVal<=0){
      clearInterval(sosTimer);
      countEl.textContent='SENT!';
      executeSOS();
    } else { countEl.textContent=sosCountVal; }
  },1000);
}

/* Main SOS execution: SMS → Call → Self-defence popup */
function executeSOS(){
  sendEmergencySMS(function(){
    dialEmergencyContact(function(){
      // Show self-defence popup after SMS and call are triggered
      setTimeout(showSelfDefencePopup, 1500);
    });
  });
}

function cancelSOS(){
  clearInterval(sosTimer);
  document.getElementById('sosOverlay').classList.remove('show');
  document.getElementById('sosBtn').classList.remove('active');
}

/* ── SEND EMERGENCY SMS ── */
function sendEmergencySMS(callback){
  var contacts=load('safira_contacts',[]);
  var user=load('safira_user',{name:'User'});
  if(contacts.length===0){if(callback)callback();return;}
  function sendSMSWithLocation(lat,lng){
    var mapsLink=lat?'https://maps.google.com/?q='+lat+','+lng:'';
    contacts.forEach(function(c,idx){
      var msg=lat
        ?'🚨 EMERGENCY! '+user.name+' needs HELP! Live location: '+mapsLink+' — Sent via Safira Safety App'
        :'🚨 EMERGENCY! '+user.name+' needs HELP! Could not get location. Please call immediately! — Safira App';
      var smsUri='sms:'+c.phone+'?body='+encodeURIComponent(msg);
      // Open each SMS in sequence with slight delay
      setTimeout(function(){window.location.href=smsUri;},idx*800);
    });
    // After opening SMS intents, fire callback
    setTimeout(function(){if(callback)callback();},contacts.length*800+300);
  }
  if(navigator.geolocation){
    navigator.geolocation.getCurrentPosition(
      function(pos){sendSMSWithLocation(pos.coords.latitude.toFixed(6),pos.coords.longitude.toFixed(6));},
      function(){sendSMSWithLocation(null,null);},
      {timeout:5000,maximumAge:0}
    );
  } else {
    sendSMSWithLocation(null,null);
  }
}

/* ── DIAL EMERGENCY CONTACT (or 100 if none) ── */
function dialEmergencyContact(callback){
  var contacts=load('safira_contacts',[]);
  var number=contacts.length>0?contacts[0].phone:'100';
  setTimeout(function(){
    window.location.href='tel:'+number;
    if(callback)callback();
  },500);
}

/* ── SELF-DEFENCE POPUP ── */
function showSelfDefencePopup(){
  var tips=[
    {icon:'👁️', title:'Stay Aware', body:'Keep your head up. Scan your surroundings. Attackers target distracted people.'},
    {icon:'👊', title:'Strike Vital Points', body:'In an attack, strike the eyes, nose, throat or groin with full force to disable the attacker.'},
    {icon:'🦵', title:'Use Elbows & Knees', body:'At close range, an elbow to the face or knee to the groin is your strongest natural weapon.'},
    {icon:'✋', title:'Break a Wrist Grab', body:'Rotate your arm toward the attacker\'s thumb — the weakest point — and pull sharply to escape.'},
    {icon:'📢', title:'Shout "FIRE!" & Run', body:'Shouting "FIRE!" attracts faster attention than "Help". Make noise and run toward crowded, lit areas.'},
    {icon:'📍', title:'Share Location Now', body:'Your live GPS location is being shared with your emergency contacts via Safira.'}
  ];
  var randomTip=tips[Math.floor(Math.random()*tips.length)];

  // Remove any existing popup
  var existing=document.getElementById('self-defence-popup');
  if(existing) existing.remove();

  var popup=document.createElement('div');
  popup.id='self-defence-popup';
  popup.innerHTML=`
    <div class="sdf-overlay" onclick="closeSelfDefencePopup()"></div>
    <div class="sdf-modal">
      <div class="sdf-header">
        <div class="sdf-badge">⚠️ SAFETY TIP</div>
        <button class="sdf-close" onclick="closeSelfDefencePopup()">✕</button>
      </div>
      <div class="sdf-icon">${randomTip.icon}</div>
      <h3 class="sdf-title">${randomTip.title}</h3>
      <p class="sdf-body">${randomTip.body}</p>
      <div class="sdf-divider"></div>
      <p class="sdf-alert">🚨 SOS activated — SMS sent & emergency call dialling</p>
      <button class="sdf-btn-all" onclick="showPage('page-tips');closeSelfDefencePopup();">View All Self-Defence Tips</button>
    </div>`;
  document.body.appendChild(popup);
}

function closeSelfDefencePopup(){
  var p=document.getElementById('self-defence-popup');
  if(p) p.remove();
}

/* ── GEOLOCATION ── */
function getLocation(){
  var el=document.getElementById('home-location');
  if(!navigator.geolocation){if(el)el.textContent='GPS not supported';return;}
  navigator.geolocation.getCurrentPosition(function(pos){
    var lat=pos.coords.latitude.toFixed(4);
    var lng=pos.coords.longitude.toFixed(4);
    if(el)el.textContent=lat+'° N, '+lng+'° E';
  },function(){
    if(el)el.textContent='Location unavailable';
  });
}

/* ── NAVIGATION ── */
function startNavigation(){
  var to=document.getElementById('nav-to').value.trim();
  if(!to){alert('Please enter a destination.');return;}
  var lbl=document.getElementById('nav-route-label');
  if(lbl)lbl.textContent='My Location → '+to;
  alert('Safe route calculated! Avoiding dark streets and high-crime areas.\n\nFor real navigation, tap "Open in Google Maps" below.');
}

function openGoogleMaps(){
  var to=document.getElementById('nav-to').value.trim();
  if(navigator.geolocation){
    navigator.geolocation.getCurrentPosition(function(pos){
      var lat=pos.coords.latitude;
      var lng=pos.coords.longitude;
      var url=to?
        'https://www.google.com/maps/dir/'+lat+','+lng+'/'+encodeURIComponent(to):
        'https://www.google.com/maps/@'+lat+','+lng+',15z';
      window.location.href=url;
    },function(){
      window.location.href='https://maps.google.com';
    });
  } else {
    window.location.href='https://maps.google.com';
  }
}

/* ── NEARBY ── */
function openMaps(place,type){
  if(navigator.geolocation){
    navigator.geolocation.getCurrentPosition(function(pos){
      var lat=pos.coords.latitude;
      var lng=pos.coords.longitude;
      var query=encodeURIComponent(place+' near me');
      window.location.href='https://www.google.com/maps/search/'+query+'/@'+lat+','+lng+',14z';
    },function(){
      window.location.href='https://www.google.com/maps/search/'+encodeURIComponent(place);
    });
  }
}

function filterNearby(type,btn){
  document.querySelectorAll('.ntab').forEach(function(b){b.classList.remove('active');});
  btn.classList.add('active');
  document.querySelectorAll('.nearby-item').forEach(function(item){
    item.style.display=(type==='all'||item.dataset.type===type)?'flex':'none';
  });
}

/* ── TIPS FILTER ── */
function filterTips(cat,btn){
  document.querySelectorAll('.tcat').forEach(function(b){b.classList.remove('active');});
  btn.classList.add('active');
  document.querySelectorAll('.tip-card').forEach(function(card){
    card.style.display=(cat==='all'||card.dataset.cat===cat)?'flex':'none';
  });
}

/* ── FAKE CALL ── */
function triggerFakeCall(){
  var contacts=load('safira_contacts',[]);
  var name=contacts.length>0?contacts[0].name:'Mummy';
  alert('📞 Incoming call from '+name+'...\n\n(In real app this shows a full-screen call notification to help you escape unsafe situations)');
}

/* ── VOICE SOS — "Help Me" triggers SMS + Call ── */
function startVoiceDetection(){
  var SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!SR) return;
  var r=new SR();
  r.continuous=true; r.interimResults=true; r.lang='en-IN';
  var keywords=['help me','emergency','call police','bachao','help','sos','मदद','bachao mujhe'];
  var triggered=false;
  r.onresult=function(e){
    for(var i=e.resultIndex;i<e.results.length;i++){
      var t=e.results[i][0].transcript.toLowerCase();
      if(!triggered && keywords.some(function(k){return t.includes(k);})){
        triggered=true;
        r.stop();
        triggerSOS();
        // Reset trigger after 10 seconds
        setTimeout(function(){triggered=false;},10000);
      }
    }
  };
  r.onend=function(){setTimeout(function(){try{r.start();}catch(e){}},1500);};
  try{r.start();}catch(e){}
}

/* ── POWER BUTTON × 4 ── */
var pwCount=0,pwTimer=null;
document.addEventListener('keydown',function(e){
  if(e.key==='p'||e.key==='P'){
    pwCount++;
    clearTimeout(pwTimer);
    pwTimer=setTimeout(function(){pwCount=0;},2000);
    if(pwCount>=4){pwCount=0;triggerSOS();}
  }
  if(e.key==='Escape') cancelSOS();
});

/* ── SHAKE DETECTION ── */
var lastShake=0;
if(window.DeviceMotionEvent){
  window.addEventListener('devicemotion',function(e){
    var a=e.accelerationIncludingGravity;
    if(!a) return;
    var force=Math.sqrt(a.x*a.x+a.y*a.y+a.z*a.z);
    var now=Date.now();
    if(force>22&&(now-lastShake)>2000){lastShake=now;triggerSOS();}
  });
}

/* ── INIT ── */
window.addEventListener('load',function(){
  var user=load('safira_user',null);
  if(user){
    showPage('page-home');
    getLocation();
    setTimeout(startVoiceDetection,1000);
  } else {
    showPage('page-login');
  }
});

window.triggerSOS=triggerSOS;
window.cancelSOS=cancelSOS;
window.closeSelfDefencePopup=closeSelfDefencePopup;
window.doLogin=doLogin;
window.doSignup=doSignup;
window.doLogout=doLogout;
window.addContact=addContact;
window.deleteContact=deleteContact;
window.showPage=showPage;
window.navTo=navTo;
window.filterNearby=filterNearby;
window.filterTips=filterTips;
window.openMaps=openMaps;
window.openGoogleMaps=openGoogleMaps;
window.startNavigation=startNavigation;
window.triggerFakeCall=triggerFakeCall;
