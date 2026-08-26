const KEY="chatspace_v2";
const DEFAULT={users:{},rooms:{
 general:{topic:"Welcome to the community!",messages:[
  {u:"ChatSpace Bot",a:"C",t:"12:41",m:"Welcome to ChatSpace! 👋"},
  {u:"ChatSpace Bot",a:"C",t:"12:42",m:"Create an account and start chatting."}
 ]},
 gaming:{topic:"Talk games, consoles and everything gaming.",messages:[]},
 memes:{topic:"Drop your best memes 😂",messages:[]}
}};
let db=load(), currentRoom="general", authMode="login", currentUser=localStorage.getItem("chatspace_current")||"";
const $=id=>document.getElementById(id);
function load(){try{const x=JSON.parse(localStorage.getItem(KEY));return x&&x.users&&x.rooms?x:structuredClone(DEFAULT)}catch{return structuredClone(DEFAULT)}}
function save(){localStorage.setItem(KEY,JSON.stringify(db))}
function esc(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
function initials(s){return (s||"?").trim().slice(0,1).toUpperCase()}
function showAuth(){ $("authScreen").classList.remove("hidden");$("app").classList.add("hidden")}
function showApp(){ $("authScreen").classList.add("hidden");$("app").classList.remove("hidden");renderUser();renderRooms();renderMembers();renderMessages()}
function renderUser(){ $("currentUser").textContent=currentUser;$("memberName")?.remove();$("userAvatar").textContent=initials(currentUser)}
function renderRooms(){
 $("roomList").innerHTML="";
 Object.keys(db.rooms).forEach(name=>{
  const b=document.createElement("button");b.className="room"+(name===currentRoom?" active":"");b.dataset.room=name;b.textContent="# "+name;
  b.onclick=()=>{currentRoom=name;renderRooms();renderMessages()};$("roomList").appendChild(b)
 })
}
function renderMembers(){
 const users=Object.keys(db.users);
 $("memberList").innerHTML=`<div class="member"><span class="dot"></span><div class="avatar small">${initials(currentUser)}</div><span>${esc(currentUser)} (you)</span></div>`;
 $("memberCount").textContent=Math.max(1,users.length); 
}
function renderMessages(){
 const room=db.rooms[currentRoom]; if(!room)return;
 $("roomTitle").textContent="# "+currentRoom;$("roomTopic").textContent=room.topic;
 $("messageInput").placeholder="Message #"+currentRoom+"...";
 $("messages").innerHTML=room.messages.map(x=>`<article class="message"><div class="avatar">${initials(x.a)}</div><div class="message-content"><div class="message-meta"><strong>${esc(x.u)}</strong><span>${esc(x.t)}</span></div><p>${esc(x.m)}</p></div></article>`).join("");
 $("messages").scrollTop=$("messages").scrollHeight
}
function setMode(mode){
 authMode=mode;
 document.querySelectorAll(".tab").forEach(x=>x.classList.toggle("active",x.dataset.tab===mode));
 $("authSubmit").textContent=mode==="login"?"Login":"Create account";$("authError").textContent="";
 $("authPass").autocomplete=mode==="login"?"current-password":"new-password"
}
document.querySelectorAll(".tab").forEach(b=>b.onclick=()=>setMode(b.dataset.tab));
$("authForm").onsubmit=e=>{
 e.preventDefault();const u=$("authUser").value.trim(),p=$("authPass").value;
 if(!/^[A-Za-z0-9_-]{3,20}$/.test(u))return $("authError").textContent="Username: 3–20 letters, numbers, _ or -.";
 if(p.length<6)return $("authError").textContent="Password must be at least 6 characters.";
 if(authMode==="register"){
   if(db.users[u])return $("authError").textContent="That username already exists.";
   db.users[u]={password:p};save();currentUser=u;localStorage.setItem("chatspace_current",u);showApp();
 }else{
   if(!db.users[u]||db.users[u].password!==p)return $("authError").textContent="Wrong username or password.";
   currentUser=u;localStorage.setItem("chatspace_current",u);showApp();
 }
};
$("messageForm").onsubmit=e=>{
 e.preventDefault();const input=$("messageInput"),text=input.value.trim();if(!text)return;
 const now=new Date(),t=now.toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"});
 db.rooms[currentRoom].messages.push({u:currentUser,a:initials(currentUser),t,m:text});save();input.value="";renderMessages()
};
$("newRoomBtn").onclick=()=>{$("modal").classList.remove("hidden");$("roomInput").focus();$("roomError").textContent=""};
$("closeModal").onclick=()=>$("modal").classList.add("hidden");
$("createRoomBtn").onclick=()=>{
 let n=$("roomInput").value.trim().toLowerCase().replace(/[^a-z0-9_-]+/g,"-").replace(/^-+|-+$/g,"");
 if(!n)return $("roomError").textContent="Enter a room name.";
 if(db.rooms[n])return $("roomError").textContent="That room already exists.";
 db.rooms[n]={topic:"A new ChatSpace room.",messages:[]};save();currentRoom=n;$("roomInput").value="";$("modal").classList.add("hidden");renderRooms();renderMessages()
};
$("logoutBtn").onclick=()=>{currentUser="";localStorage.removeItem("chatspace_current");showAuth();$("authForm").reset();setMode("login")};
$("membersBtn").onclick=()=>{$("membersPanel").classList.toggle("mobile-open")};
if(currentUser&&db.users[currentUser])showApp();else showAuth();
