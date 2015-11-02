var net = require('net');


var helper= require('./helperFunctions');

var PORT_NUMBER= 9399;
var listOfRooms = ["chat", "hottub", "test"]; 

var socketArray = [];
var socketNameToUserNameMap = {};
var userNameToRoomNameMap = {};
var roomNameToAudienceSocketArrayMap = {};


// TODO: Modularize the code
// TODO: Connect MongoDB to preserve the code, add search functionality?
// WHEN 2 people are typing, it cutsoff other person's messages.




// intiializae the roomNameToAudienceSocketArrayMap on startup
(function populateDifferentChatRooms(){
  for( var i=0; i < listOfRooms.length; i++){
    roomNameToAudienceSocketArrayMap[listOfRooms[i]] = [];
  }
})();



getUserNameForSocket = function (socket){
    return socketNameToUserNameMap['mysocket.' + socket.myId] ;
}



 // Method executed when data is received from a socket
function receiveData(socket, data) {

  var cleanData = helper.cleanInput(data);

  if(typeof  getUserNameForSocket(socket) === 'undefined'){
    assignUserName(socket, cleanData);
    return ; 
  }

/*

if probable command
  check if valid command
      if yes, act
      else, "say you mean a command?"

if not comand, 
    attempt at broadcast      

*/


if (cleanData.lastIndexOf("/", 0 ) === 0){

  switch (cleanData.toLowerCase()){
    case "/quit":
      quit(socket);
      break;

    case "/rooms":
      getListOfRooms(socket);
      break;

    case "/leave": 
      leaveARoom(socket);
      break;

    default: 
      if(cleanData.toLowerCase().lastIndexOf("/join", 0 ) === 0){
        joinARoom(socket, cleanData);
      }
      else {
           socket.write("Invalid command:" + cleanData + "/n/r");
           showPrompt(socket);
      }
    }
}
else{
  broadcaseMessage(socket, cleanData);
}

}
 





// When socker connection ends, remove socker from the array.
function closeSocket(socket) {
  var i = socketArray.indexOf(socket);
  if (i != -1) {
    socketArray.splice(i, 1);
  }
}
 




// Callback fucnction triggered when a new connection comes.
function newSocket(socket) {
  

  socket.myId = Math.floor((Math.random() * 1000000) + 1);;
  // Save in socker array
  socketArray.push(socket);


  // Welcome user
  socket.write("Welcome to the Chinmay's chat  server!\n");
  socket.write('Login Name? \n');


  // bind with few actions.
  socket.on('data', function(data) {
    receiveData(socket, data);
  })

  socket.on('end', function() {
    closeSocket(socket);
  })
}
 

function showPrompt(socket){
  socket.write( '<=' +  getUserNameForSocket(socket) + ": ");
}







//##################   ROOMS  ############################

function getListOfRooms(socket){
      socket.write( "<= Active rooms are: \r\n");
    for( var i=0; i < listOfRooms.length; i++){
       socket.write(" *"+ listOfRooms[i] );
       //TODO: calcualte count value here
       var count = roomNameToAudienceSocketArrayMap[listOfRooms[i]].length;
       socket.write("(" + count + ")\r\n");
      
    }
    socket.write( "<= end of list. \r\n");
    showPrompt(socket);
}



//##################   JOIN A ROOM ############################

function joinARoom(socket, cleanData){
    
    var room = cleanData.substring(cleanData.indexOf(" ") + 1, cleanData.length);
    console.log("Room Name = " + room + "\n");

    // check if this room name is valid
    if( -1 == listOfRooms.indexOf(room) ) {
      //invalid room
      // type error message and return
      socket.write( " Room with this name doesn't exist. \r\n");
      return;

    }
    // console.log("roomNameToAudienceSocketArrayMap= " + roomNameToAudienceSocketArrayMap + "\n");

    roomNameToAudienceSocketArrayMap[room].push(socket);
    user = getUserNameForSocket(socket);

    if( typeof userNameToRoomNameMap[user]  !== 'undefined'){
      var i =  roomNameToAudienceSocketArrayMap[userNameToRoomNameMap[user]].indexOf(socket);
      if (i != -1) {
        console.log("Removing user from room: "+ userNameToRoomNameMap[user]+ "\n");
        roomNameToAudienceSocketArrayMap[userNameToRoomNameMap[user]].splice(i, 1);
      }
    }
    socket.write( "Joined "  + room + " ! \r\n");

    userNameToRoomNameMap[user] = room;
    audience = roomNameToAudienceSocketArrayMap[room];

    for(var i = 0; i<audience.length; i++) {
      socket.write( '<= *' + getUserNameForSocket(audience[i]) );

      if(socket === audience[i])
        socket.write( '(** this is you) \n' );
      else
        socket.write( '\n' );     
   }

   showPrompt(socket);
}



//##################   SEND MESSAGE  ############################

function broadcaseMessage(socket, data){

    // get room
    // get list of users.

    var user =  getUserNameForSocket(socket);
    var roomName = userNameToRoomNameMap[user];
     // if room is empty then broadcast


    audience = roomNameToAudienceSocketArrayMap[roomName];
    if( typeof audience === 'undefined'){
      socket.write( '<=' +  getUserNameForSocket(socket) + ": ");
      return;

    }
        
    for(var i = 0; i<audience.length; i++) {

      if (audience[i] !== socket) {
        audience[i].write( "\r\n");
        audience[i].write('=>' + user  + " : "+ data + "\n");
        audience[i].write('<=' +  getUserNameForSocket(audience[i]) + ": ");
      }
    }
    showPrompt(socket);
}





//##################   QUIT  ############################

function quit(socket){
  cleanDataStructures(socket);
  socket.end('Goodbye!\n');
}




//##################   LEAVE A ROOM  ############################


function cleanDataStructures(socket){
    var user =  getUserNameForSocket(socket);
    var roomName = userNameToRoomNameMap[user];
    userNameToRoomNameMap[user] = undefined;

    var i =  roomNameToAudienceSocketArrayMap[roomName].indexOf(socket);
    if (i != -1) {
      roomNameToAudienceSocketArrayMap[roomName].splice(i, 1);
    }
}

function leaveARoom(socket){
    var user =  getUserNameForSocket(socket);
    var roomName = userNameToRoomNameMap[user];
    if( typeof roomName === 'undefined'){
      socket.write( "User is not in a chat room currently. \r\n");
    }
    else {
      cleanDataStructures(socket);
      socket.write( "Leaving " + roomName + "\r\n");
    }
    showPrompt(socket);
}






//##################   SET USERNAME  ############################

function assignUserName(socket, cleanData){
      // this is a new socket

    // is this a unique userName?
    for (var key in socketNameToUserNameMap) {

      if(socketNameToUserNameMap[key] == cleanData){
        socket.write( "<= Sorry, name taken. \r\n<= Login Name? ");
        return;
      }
    }
    
      socketNameToUserNameMap['mysocket.' + socket.myId] = cleanData;
      socket.write( "<= Welcome " + cleanData + " ! \r\n");
      showPrompt(socket);
}











// Create a new server and provide a callback for when a connection occurs
var server = net.createServer(newSocket);

// Listen for response on this port
server.listen(PORT_NUMBER);









